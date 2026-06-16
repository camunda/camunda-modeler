/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

'use strict';

const os = require('os');
const path = require('path');
const fs = require('fs/promises');

const { _electron } = require('@playwright/test');

const { APP_DIR } = require('./paths');
const { stubSaveDialog, stubOpenDialog, recordDialogs, dialogCalls } = require('./dialog');
const { triggerAccelerator, clickMenuItem, findMenuItem, menuLabels } = require('./menu');

/**
 * A launched Camunda Modeler instance, wrapping the Electron main-process
 * handle and the renderer page. The one abstraction specs build on.
 */
class ElectronApp {

  /**
   * @param {import('@playwright/test').ElectronApplication} electronApp
   * @param {import('@playwright/test').Page} page
   * @param {string} userDataDir
   */
  constructor(electronApp, page, userDataDir) {
    this.electronApp = electronApp;
    this.page = page;
    this.userDataDir = userDataDir;
  }

  /**
   * Trigger a keyboard shortcut through its real binding: look up the command
   * bound to the accelerator and invoke it as the accelerator would.
   *
   * Playwright can't deliver a keystroke to a native menu accelerator, so this
   * drives the binding directly. It retries briefly because menu enablement
   * updates asynchronously after editor changes (e.g. a tab becomes dirty).
   *
   * @param {string} accelerator e.g. 'CommandOrControl+S'
   *
   * @return {Promise<void>}
   */
  async shortcut(accelerator) {
    for (let attempt = 0; attempt < 25; attempt++) {
      if (await triggerAccelerator(this.electronApp, accelerator)) {
        return;
      }

      await this.page.waitForTimeout(200);
    }

    throw new Error(`shortcut unavailable (unbound or disabled): ${ accelerator }`);
  }

  /**
   * Click an application menu item by label. For menu actions without a
   * keyboard accelerator (e.g. "New File > DMN diagram (Camunda 8)").
   *
   * @param {string} label
   *
   * @return {Promise<void>}
   */
  menu(label) {
    return clickMenuItem(this.electronApp, label);
  }

  /**
   * Inspect an application menu item by label.
   *
   * @param {string} label
   *
   * @return {Promise<{ label: string, enabled: boolean, accelerator: string|null }|null>}
   */
  menuItem(label) {
    return findMenuItem(this.electronApp, label);
  }

  /**
   * @return {Promise<string[]>} all application menu item labels
   */
  menuLabels() {
    return menuLabels(this.electronApp);
  }

  /**
   * Make the next native "Save as" dialog resolve to `filePath`. The app then
   * performs the real file write to that path.
   *
   * @param {string} filePath
   *
   * @return {Promise<void>}
   */
  expectSaveDialog(filePath) {
    return stubSaveDialog(this.electronApp, filePath);
  }

  /**
   * Make the next native "Open" dialog resolve to `filePaths`.
   *
   * @param {string[]} filePaths
   *
   * @return {Promise<void>}
   */
  expectOpenDialog(filePaths) {
    return stubOpenDialog(this.electronApp, filePaths);
  }

  /**
   * Record all native dialog calls and auto-answer them (so they don't block).
   * Use with `dialogCalls()` to assert the app showed a dialog.
   *
   * @return {Promise<void>}
   */
  recordDialogs() {
    return recordDialogs(this.electronApp);
  }

  /**
   * @return {Promise<Array<{ name: string, message?: string, title?: string }>>}
   *   the dialogs the app tried to show since `recordDialogs()`
   */
  dialogCalls() {
    return dialogCalls(this.electronApp);
  }

  /**
   * Signal that the window regained focus — the same action the backend sends
   * on OS focus, which makes the app re-check open files for external changes.
   *
   * @return {Promise<void>}
   */
  focusWindow() {
    return this.electronApp.evaluate(({ app }) => app.emit('menu:action', 'window-focused'));
  }

  /**
   * Start recording a Playwright trace (with DOM snapshots + screenshots) for
   * this instance. Electron windows aren't covered by the test runner's
   * automatic tracing, so we drive it on the app's own context.
   *
   * @return {Promise<void>}
   */
  startTracing() {
    return this.electronApp.context().tracing.start({
      screenshots: true,
      snapshots: true,
      sources: true
    });
  }

  /**
   * Stop tracing. With a path, the trace is written there (open it with
   * `npx playwright show-trace <path>`); without one, it is discarded.
   *
   * @param {string} [path]
   *
   * @return {Promise<void>}
   */
  stopTracing(path) {
    return this.electronApp.context().tracing.stop(path ? { path } : undefined);
  }

  /**
   * Run `fn` inside a named group so it shows up as a labelled milestone in the
   * trace viewer's action list. Useful for steps that have no visible page
   * activity (menu actions, dialog handling, on-disk assertions).
   *
   * @param {string} name
   * @param {() => Promise<T>} fn
   *
   * @return {Promise<T>}
   * @template T
   */
  async step(name, fn) {
    const { tracing } = this.electronApp.context();

    await tracing.group(name);

    try {
      return await fn();
    } finally {
      await tracing.groupEnd();
    }
  }

  /**
   * Close the app and remove its isolated profile directory.
   *
   * A tab with unsaved changes triggers a "Save changes before closing?"
   * prompt that would block teardown (this happens on any test that edits
   * without saving, including failures). We auto-answer "Don't Save" so the
   * app always closes.
   *
   * @return {Promise<void>}
   */
  async close() {
    await this.electronApp.evaluate(({ dialog }) => {
      dialog.showMessageBox = async (...args) => {
        const options = args.find(arg => arg && Array.isArray(arg.buttons)) || {};
        const index = (options.buttons || []).findIndex(label => /don'?t save/i.test(String(label)));

        return { response: index === -1 ? 0 : index };
      };
    }).catch(() => {});

    await this.electronApp.close();
    await fs.rm(this.userDataDir, { recursive: true, force: true });
  }
}

/**
 * Launch a Camunda Modeler instance with an isolated profile.
 *
 * @param {Object} [options]
 * @param {string[]} [options.args] extra CLI args / flags (e.g. '--disable-dmn')
 * @param {string} [options.openFile] absolute path to a diagram to open at startup
 * @param {Object} [options.env] extra environment variables
 *
 * @return {Promise<ElectronApp>}
 */
async function launch(options = {}) {
  const {
    args = [],
    openFile,
    env = {}
  } = options;

  // isolated config / workspace per instance so tests don't bleed into each other
  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cm-e2e-'));

  // pre-seed the profile so first-run onboarding hints (which overlay the
  // properties panel and intercept clicks) don't appear
  await fs.writeFile(
    path.join(userDataDir, 'config.json'),
    JSON.stringify({ hints: { panelToggleDismissed: true } })
  );

  const electronApp = await _electron.launch({
    args: [
      APP_DIR,

      // isolated, throwaway profile per instance
      `--user-data-dir=${ userDataDir }`,

      // no telemetry / update checks / first-run privacy modal in tests.
      // the `=true` form is required so the CLI parser (mri) does not consume
      // the following file path as this flag's value.
      '--disable-remote-interaction=true',

      ...args,
      ...(openFile ? [ openFile ] : [])
    ],
    env: {
      ...process.env,
      ...env
    }
  });

  const page = await electronApp.firstWindow();

  // the app shell is ready once the tab container is mounted
  await page.waitForSelector('.tabs', { timeout: 30000 });

  return new ElectronApp(electronApp, page, userDataDir);
}

module.exports = {
  ElectronApp,
  launch
};
