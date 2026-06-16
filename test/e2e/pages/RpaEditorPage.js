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
 * Page object for the RPA script editor (a Monaco code editor wrapped by
 * `@camunda/rpa-integration`).
 */
class RpaEditorPage {

  /**
   * @param {import('../harness/electron-app').ElectronApp} app
   */
  constructor(app) {
    this.app = app;
    this.page = app.page;
  }

  /**
   * @return {import('@playwright/test').Locator} the Monaco editor
   */
  editor() {
    return this.page.locator('.monaco-editor').first();
  }

  /**
   * Wait for the editor to be mounted.
   *
   * @return {Promise<void>}
   */
  waitForLoad() {
    return this.editor().waitFor();
  }

  /**
   * Type text into the editor at the cursor. Focuses the editor by clicking its
   * rendered lines (the hidden Monaco textarea is not directly clickable). Pass
   * a marker without newlines so the insert is a single Monaco undo step.
   *
   * @param {string} text
   *
   * @return {Promise<void>}
   */
  async type(text) {
    await this.page.locator('.monaco-editor .view-lines').first().click();
    await this.page.keyboard.type(text);
  }

  /**
   * @return {import('@playwright/test').Locator} the status-bar RPA worker
   *   status button (shows "RPA worker not connected" with no worker; clicking
   *   it opens the runtime configuration dialog)
   */
  workerStatusButton() {
    return this.page.locator('[title="Configure RPA Runtime"]');
  }

  /**
   * @return {import('@playwright/test').Locator} the status-bar "Test RPA
   *   script" button
   */
  testButton() {
    return this.page.locator('[title="Test RPA script"]');
  }

  /**
   * Open the properties side panel via its Settings (gear) toggle.
   *
   * @return {Promise<void>}
   */
  openProperties() {
    return this.page.locator('.btn--tab-action').first().click();
  }

  /**
   * @return {import('@playwright/test').Locator} the properties side panel
   */
  propertiesPanel() {
    return this.page.locator('.side-panel');
  }
}

module.exports = RpaEditorPage;
