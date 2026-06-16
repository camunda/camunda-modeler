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
 * Page object for the bottom "Problems" panel (linting results).
 */
class ProblemsPanelPage {

  /**
   * @param {import('../harness/electron-app').ElectronApp} app
   */
  constructor(app) {
    this.app = app;
    this.page = app.page;
  }

  /**
   * Open the Problems panel via the status-bar linting button (it always shows
   * the error/warning counts).
   *
   * @return {Promise<void>}
   */
  async open() {
    await this.page.locator('button:has(.errors)').first().click();

    await this.page.waitForSelector('.linting-tab-item, .linting-tab-item--empty');
  }

  /**
   * @return {import('@playwright/test').Locator} all problem rows
   */
  items() {
    return this.page.locator('.linting-tab-item');
  }

  /**
   * Click a problem row (matched by text) to focus its element — the app
   * selects the offending element in the editor.
   *
   * @param {string} text substring identifying the problem row
   *
   * @return {Promise<void>}
   */
  async focusItem(text) {
    await this.items().filter({ hasText: text }).first()
      .locator('.linting-tab-item__header').click();
  }

  /**
   * @return {import('@playwright/test').Locator} error problem rows
   */
  errors() {
    return this.page.locator('.linting-tab-item--error');
  }
}

module.exports = ProblemsPanelPage;
