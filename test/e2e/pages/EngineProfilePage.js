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
 * Page object for the status-bar engine profile (execution platform version)
 * chooser, shared by all editors.
 */
class EngineProfilePage {

  /**
   * @param {import('../harness/electron-app').ElectronApp} app
   */
  constructor(app) {
    this.page = app.page;
  }

  /**
   * @return {import('@playwright/test').Locator} the status-bar version button
   *   (e.g. "Camunda 8.6")
   */
  button() {
    return this.page.locator('button', { hasText: /^Camunda \d/ }).first();
  }

  /**
   * Open the version chooser and pick a version.
   *
   * @param {string} versionLabel e.g. '8.4'
   *
   * @return {Promise<void>}
   */
  async setVersion(versionLabel) {
    await this.button().click();

    const select = this.page.locator('select[name="engineProfile.version"]');

    await select.waitFor();
    await select.selectOption({ label: versionLabel });
  }
}

module.exports = EngineProfilePage;
