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

const DiagramEditorPage = require('./DiagramEditorPage');

/**
 * Page object for the DMN editor (dmn-js) DRD view — diagram-js based, so the
 * canvas/selection/context-pad interactions come from {@link DiagramEditorPage}.
 */
class DmnEditorPage extends DiagramEditorPage {

  /**
   * Morph a decision's logic type via the context pad's replace menu, e.g.
   * 'Decision table' or 'Literal expression'.
   *
   * @param {string} elementId
   * @param {string} title the replace-menu entry text
   *
   * @return {Promise<void>}
   */
  async morphLogic(elementId, title) {
    await this.showContextPad(elementId);

    await this.page.locator('.djs-context-pad .entry[data-action="replace"]').click();

    await this.page.waitForSelector('.djs-popup');
    await this.page.locator('.djs-popup .entry').filter({ hasText: title }).first().click();
  }

  /**
   * Set a text annotation's content via direct editing: double-click to edit,
   * type, then click empty canvas to commit (Escape would cancel the edit).
   *
   * @param {string} elementId
   * @param {string} text
   *
   * @return {Promise<void>}
   */
  async setTextAnnotation(elementId, text) {
    await this.element(elementId).dblclick();

    await this.page.locator('.djs-direct-editing-content').waitFor();
    await this.page.keyboard.type(text);

    // commit by blurring — click an empty corner of the canvas
    const box = await this.canvas().boundingBox();

    await this.page.mouse.click(box.x + box.width - 40, box.y + box.height - 40);
  }

  /**
   * Drill into a decision's logic via its blue overlay — i.e. open the decision
   * table editor ("table editing mode").
   *
   * @param {string} elementId
   *
   * @return {Promise<void>}
   */
  async openDecisionTable(elementId) {
    await this.selectElement(elementId);

    // each logic-bearing decision has its own drill-down overlay, scoped by the
    // decision id, so we target the right one when several decisions exist
    await this.page.locator(`[data-container-id="${ elementId }"] .drill-down-overlay`).click();
  }

  /**
   * @return {import('@playwright/test').Locator} the decision table editor view
   */
  decisionTable() {
    return this.page.locator('.dmn-decision-table-container');
  }
}

module.exports = DmnEditorPage;
