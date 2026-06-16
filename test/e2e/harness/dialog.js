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

/**
 * The single, contained seam where we replace a native OS surface.
 *
 * Native file pickers cannot be driven by Playwright, so we stub only the
 * return value of Electron's save/open dialog. Everything downstream — the
 * actual file write performed by the app — stays real.
 *
 * The app's `Dialog` wrapper (app/lib/dialog.js) delegates to these very
 * methods on the Electron `dialog` module, so overriding them is enough.
 *
 * A later phase may swap this for real native-dialog automation per platform
 * (macOS osascript, Windows AutoIt, Linux dogtail) behind the same API.
 */

/**
 * Make the next native "Save as" dialog resolve to `filePath` without
 * showing any UI.
 *
 * @param {import('@playwright/test').ElectronApplication} electronApp
 * @param {string} filePath
 *
 * @return {Promise<void>}
 */
function stubSaveDialog(electronApp, filePath) {
  return electronApp.evaluate(({ dialog }, filePath) => {
    const original = dialog.showSaveDialog;

    // one-shot: restore the real dialog after the first call so the stub does
    // not leak into later save operations in the same test
    dialog.showSaveDialog = async () => {
      dialog.showSaveDialog = original;

      return { canceled: false, filePath };
    };
  }, filePath);
}

/**
 * Make the next native "Open" dialog resolve to `filePaths` without
 * showing any UI.
 *
 * @param {import('@playwright/test').ElectronApplication} electronApp
 * @param {string[]} filePaths
 *
 * @return {Promise<void>}
 */
function stubOpenDialog(electronApp, filePaths) {
  return electronApp.evaluate(({ dialog }, filePaths) => {
    const original = dialog.showOpenDialog;

    // one-shot: restore the real dialog after the first call so the stub does
    // not leak into later open operations in the same test
    dialog.showOpenDialog = async () => {
      dialog.showOpenDialog = original;

      return { canceled: false, filePaths };
    };
  }, filePaths);
}

/**
 * Spy on all native dialogs: record each call and auto-answer it with a safe
 * default (so it never blocks). Lets a test assert that the app *tried* to show
 * a dialog (e.g. an "Import Error" message box) without a native window
 * appearing.
 *
 * @param {import('@playwright/test').ElectronApplication} electronApp
 *
 * @return {Promise<void>}
 */
function recordDialogs(electronApp) {
  return electronApp.evaluate(({ dialog }) => {
    const calls = globalThis.__cmDialogCalls = [];

    const spy = (name, result) => {
      dialog[name] = async (...args) => {
        const options = args[args.length - 1] || {};

        calls.push({ name, message: options.message, title: options.title });

        return result;
      };
    };

    spy('showSaveDialog', { canceled: true });
    spy('showOpenDialog', { canceled: true, filePaths: [] });
    spy('showMessageBox', { response: 0 });
  });
}

/**
 * @param {import('@playwright/test').ElectronApplication} electronApp
 *
 * @return {Promise<Array<{ name: string, message?: string, title?: string }>>}
 */
function dialogCalls(electronApp) {
  return electronApp.evaluate(() => globalThis.__cmDialogCalls || []);
}

module.exports = {
  stubSaveDialog,
  stubOpenDialog,
  recordDialogs,
  dialogCalls
};
