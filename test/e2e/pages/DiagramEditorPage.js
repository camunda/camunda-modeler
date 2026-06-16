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
}

module.exports = DiagramEditorPage;
