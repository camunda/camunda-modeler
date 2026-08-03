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

const { expect } = require('@playwright/test');

/**
 * Shared base for the diagram-js based editors (bpmn-js, dmn-js). Holds the
 * common canvas/element/selection/context-pad interactions; the BPMN and DMN
 * page objects extend it with their type-specific behavior.
 */
class DiagramEditorPage {

  /**
   * @param {import('../harness/electron-app').ElectronApp} app
   */
  constructor(app) {
    this.app = app;
    this.page = app.page;
  }

  /**
   * @return {import('@playwright/test').Locator} the diagram-js canvas container
   */
  canvas() {
    return this.page.locator('.djs-container');
  }

  /**
   * Focus the diagram canvas so undo/redo reach the diagram rather than the
   * native (no-op) handler. Focuses the tabindexed canvas SVG without changing
   * the selection, then waits for the Edit menu to switch to the diagram
   * undo/redo, which the editor derives from canvas focus asynchronously.
   *
   * @return {Promise<void>}
   */
  async focusCanvas() {
    await this.canvas().locator('svg[tabindex]').first().evaluate((el) => el.focus({ preventScroll: true }));

    await expect.poll(() => this.app.isCanvasFocused(), { timeout: 5000 }).toBe(true);
  }

  /**
   * @param {string} elementId
   *
   * @return {import('@playwright/test').Locator}
   */
  element(elementId) {
    return this.page.locator(`.djs-element[data-element-id="${ elementId }"]`).first();
  }

  /**
   * The id of the currently selected shape — e.g. an element just appended via
   * the context pad, whose id is auto-generated.
   *
   * @return {Promise<string>}
   */
  selectedElementId() {
    return this.page.locator('.djs-shape.selected[data-element-id]').first()
      .getAttribute('data-element-id');
  }

  /**
   * Select an element by its id (selecting it populates the properties panel).
   * Clicking an already-selected element would toggle it off, so we only click
   * when it is not already the selection.
   *
   * @param {string} elementId
   *
   * @return {Promise<void>}
   */
  async selectElement(elementId) {
    const isSelected = await this.element(elementId).evaluate(el => el.classList.contains('selected'));

    if (!isSelected) {
      await this.element(elementId).click();
    }
  }

  /**
   * Show an element's context pad. Selecting an element opens its pad, so we
   * just select it and wait for the pad.
   *
   * @param {string} elementId
   *
   * @return {Promise<void>}
   */
  async showContextPad(elementId) {
    await this.selectElement(elementId);

    await this.page.locator('.djs-context-pad').waitFor();
  }

  /**
   * Click a context-pad action for an element (e.g. 'append.append-task',
   * 'append.input-data'). Appended elements are auto-placed and connected, and
   * become the new selection.
   *
   * @param {string} elementId
   * @param {string} action the entry's `data-action`
   *
   * @return {Promise<void>}
   */
  async contextPadAction(elementId, action) {
    await this.showContextPad(elementId);

    await this.page.locator(`.djs-context-pad .entry[data-action="${ action }"]`).click();
  }

  /**
   * Open a context-pad popup menu (e.g. via 'replace' or 'append') and click the
   * entry with the given label. Opens and clicks as a retried unit because a
   * background re-render can tear the popup down right after it opens.
   *
   * @param {string} elementId
   * @param {string} action the context-pad entry's `data-action`, e.g. 'replace'
   * @param {string} entryLabel the popup entry's label, e.g. 'User task'
   *
   * @return {Promise<void>}
   */
  async selectPopupEntry(elementId, action, entryLabel) {
    const popup = this.page.locator('.djs-popup');

    // the label lives in `.djs-popup-label`; match its exact text
    const entry = popup
      .locator(`.entry:has(.djs-popup-label:text-is("${ entryLabel }"))`)
      .first();

    // grouped menus nest entries in drill-in categories; the search box
    // flattens them so entries can be reached by label
    const search = popup.locator('.djs-popup-search input');

    for (let attempt = 0; attempt < 5; attempt++) {

      if (!(await popup.count())) {
        await this.contextPadAction(elementId, action);

        await popup.waitFor({ timeout: 2000 }).catch(() => {});

        continue;
      }

      // the search filters on keyup, so focus it and type real keystrokes
      // (fill alone does not trigger the filter)
      if (await search.count() && !(await entry.count())) {
        await search.click();
        await search.fill('');
        await search.pressSequentially(entryLabel);
      }

      // wait for the entry (the filter may still be settling), then click; if
      // the popup was torn down, loop to re-open and retry
      try {
        await entry.waitFor({ state: 'visible', timeout: 2000 });
        await entry.click({ timeout: 2000 });

        return;
      } catch (err) {
        continue;
      }
    }

    throw new Error(`could not select "${ entryLabel }" from the "${ action }" popup`);
  }
}

module.exports = DiagramEditorPage;
