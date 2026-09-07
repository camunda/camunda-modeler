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
   * Append a text annotation to an element and set its content. Appending a text
   * annotation auto-places it and starts direct editing, so we just wait for the
   * editing box, type, then click empty canvas to commit (Escape would cancel).
   *
   * @param {string} elementId the element to append the annotation to
   * @param {string} text
   *
   * @return {Promise<void>}
   */
  async setTextAnnotation(elementId, text) {
    await this.contextPadAction(elementId, 'append.text-annotation');

    const editing = this.page.locator('.djs-direct-editing-content');

    await editing.waitFor();

    await editing.fill(text);

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

  /**
   * @param {string} ruleId
   *
   * @return {import('@playwright/test').Locator} the rule's (row's) input cell
   */
  ruleInputCell(ruleId) {
    return this.page.locator(`[data-row-id="${ ruleId }"].input-cell`).first();
  }

  /**
   * Type a FEEL value into a rule's input cell — the FEEL editor is a
   * `contenteditable` widget, not an `<input>`, so it is clicked and typed
   * into rather than filled.
   *
   * @param {string} ruleId
   * @param {string} value
   *
   * @return {Promise<void>}
   */
  async setRuleInputValue(ruleId, value) {
    const cell = this.ruleInputCell(ruleId);

    await cell.click();
    await cell.locator('.content-editable').pressSequentially(value);
  }

  /**
   * Drag a rule via its rule-index drag handle and drop it above/below
   * another rule's row — the same gesture as dragging the "Move rule" icon.
   *
   * The handle is only visually revealed on hover (`color: transparent`
   * otherwise), but keeps its layout box, so its position can be read without
   * hovering first. A real HTML5 drag only starts once the browser sees the
   * pointer move past its drag threshold, so the move to the target is split
   * into steps rather than jumping there in one go.
   *
   * @param {string} ruleId the rule to drag
   * @param {string} targetRuleId the rule whose row to drop onto
   * @param {'top'|'bottom'} position drop above or below the target row
   *
   * @return {Promise<void>}
   */
  async dragRule(ruleId, targetRuleId, position) {
    const handle = this.page.locator(`[data-row-id="${ ruleId }"] .dmn-icon-drag.vertical`);
    const targetRow = this.page.locator(`[data-row-id="${ targetRuleId }"]`).first();

    await handle.waitFor();
    await targetRow.waitFor();

    const handleBox = await handle.boundingBox();
    const targetBox = await targetRow.boundingBox();

    if (!handleBox) {
      throw new Error(`could not determine the drag handle position for rule "${ ruleId }"`);
    }

    if (!targetBox) {
      throw new Error(`could not determine the row position for rule "${ targetRuleId }"`);
    }

    const startX = handleBox.x + handleBox.width / 2;
    const startY = handleBox.y + handleBox.height / 2;

    const endX = targetBox.x + targetBox.width / 2;
    const endY = targetBox.y + (position === 'bottom' ? targetBox.height - 2 : 2);

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();

    const steps = 8;

    for (let i = 1; i <= steps; i++) {
      await this.page.mouse.move(
        startX + (endX - startX) * i / steps,
        startY + (endY - startY) * i / steps
      );
    }

    await this.page.mouse.up();
  }
}

module.exports = DmnEditorPage;
