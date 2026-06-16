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

// `document` is referenced inside a page.evaluate callback, which runs in the
// browser context
/* global document */

const { expect } = require('@playwright/test');

/**
 * Page object for the Camunda Forms editor (form-js). Not diagram-js based —
 * fields render as `.fjs-form-field` elements; selecting one populates the
 * properties panel (the same @bpmn-io/properties-panel as the other editors).
 */
class FormEditorPage {

  /**
   * @param {import('../harness/electron-app').ElectronApp} app
   */
  constructor(app) {
    this.app = app;
    this.page = app.page;
  }

  /**
   * @return {import('@playwright/test').Locator} the form editor canvas
   */
  canvas() {
    return this.page.locator('.fjs-form-editor');
  }

  /**
   * Select a form field on the editor canvas (not the palette) by index.
   *
   * @param {number} [index]
   *
   * @return {Promise<void>}
   */
  async selectField(index = 0) {
    await this.page.locator('.fjs-editor-container .fjs-form-field').nth(index).click();
  }

  /**
   * Select a field on the editor canvas by its form-js field type (e.g.
   * 'radio'), populating the properties panel for it.
   *
   * @param {string} fieldType
   *
   * @return {Promise<void>}
   */
  async selectFieldByType(fieldType) {
    await this.page.locator(`.fjs-editor-container .fjs-element[data-field-type="${ fieldType }"]`).first().click();
  }

  /**
   * @return {import('@playwright/test').Locator} the currently selected field
   */
  selectedField() {
    return this.page.locator('.fjs-editor-container .fjs-editor-selected');
  }

  /**
   * A rendered field on the editor canvas showing the given text (a label or a
   * button caption). Used to wait for an async label commit to take effect — the
   * preview only shows the text once the label is in the model.
   *
   * @param {string} text
   *
   * @return {import('@playwright/test').Locator}
   */
  fieldByText(text) {
    return this.page.locator('.fjs-editor-container').getByText(text, { exact: true }).first();
  }

  /**
   * Drag a field type from the palette onto the form. form-js uses a
   * dragula-style (mouse-event) drag which occasionally fails to register the
   * drop, so we perform the drag and retry until a field actually lands. The new
   * field ends up selected, so its properties can be set right after.
   *
   * @param {string} fieldType the palette entry's `data-field-type`, e.g. 'textfield'
   *
   * @return {Promise<void>}
   */
  async addField(fieldType) {
    const fields = this.page.locator('.fjs-editor-container .fjs-element[data-id^="Field_"]');
    const before = await fields.count();

    // the drop occasionally does not register, so re-drag until a field lands
    for (let attempt = 0; attempt < 3; attempt++) {
      await this.dragField(fieldType);

      try {
        await expect(fields).toHaveCount(before + 1, { timeout: 2000 });

        return;
      } catch {
        continue;
      }
    }

    throw new Error(`failed to drop a "${ fieldType }" field onto the form`);
  }

  /**
   * Close any open app notifications (toasts). The connector-templates toast
   * appears shortly after launch in the bottom-left and overlays the form
   * editor's drop area, swallowing drops.
   *
   * @return {Promise<void>}
   */
  async dismissNotifications() {
    const closes = this.page.locator('[role="status"] .close, [role="alert"] .close');

    for (let count = await closes.count(); count > 0; count--) {
      await closes.first().click().catch(() => {});
    }
  }

  /**
   * One palette-to-canvas drag: press the palette entry, nudge past the drag
   * threshold, move onto the drop target in small steps (pausing so the dragover
   * registers), and release.
   *
   * To append at the end we bring the last field into view (the form can be
   * taller than the editor, e.g. on a small CI display) and drop just above its
   * bottom edge — form-js reads the lower part of a field as "insert after it".
   * The Y is clamped to a few pixels above the visible editor's bottom so it
   * never lands off screen or on the editor border. For an empty form there is
   * no last field, so we drop in the centre of the drop container.
   *
   * @param {string} fieldType
   *
   * @return {Promise<void>}
   */
  async dragField(fieldType) {
    const tool = this.page.locator(`.fjs-palette-field[data-field-type="${ fieldType }"]`);

    // a toast (e.g. "Camunda Connector templates updated") overlays the bottom
    // of the editor and intercepts the drop — dismiss any open notification first
    await this.dismissNotifications();

    // the palette scrolls — bring the entry into view so its box is valid
    await tool.scrollIntoViewIfNeeded();

    const target = await this.page.evaluate(() => {
      const container = document.querySelector('.fjs-drop-container-vertical');
      const editor = document.querySelector('.fjs-editor-container');

      if (!container || !editor) {
        return null;
      }

      const fields = document.querySelectorAll('.fjs-editor-container .fjs-element[data-id^="Field_"]');
      const last = fields[fields.length - 1];

      // bring the last field's bottom into view (the browser scrolls whatever
      // nested container is scrollable)
      if (last) {
        last.scrollIntoView({ block: 'end' });
      }

      const editorBox = editor.getBoundingClientRect();
      const ref = (last || container).getBoundingClientRect();
      const x = Math.round(ref.x + ref.width / 2);

      // empty form: no field to append after — drop in the container centre
      if (!last) {
        return { x, y: Math.round(ref.y + ref.height / 2) };
      }

      // just above the last field's bottom (its lower part = "insert after"),
      // but never below the visible editor (a few px clear of its border)
      return { x, y: Math.round(Math.min(ref.bottom - 4, editorBox.bottom - 4)) };
    });

    if (!target) {
      return;
    }

    const toolBox = await tool.boundingBox();
    const fromX = toolBox.x + toolBox.width / 2;
    const fromY = toolBox.y + toolBox.height / 2;

    // these short pauses are intrinsic to driving the dragula-style drag via
    // synthetic mouse events (no observable intermediate state to await); the
    // caller `addField` is the reliability net — it re-drags until a field lands
    await this.page.mouse.move(fromX, fromY);
    await this.page.mouse.down();
    await this.page.mouse.move(fromX + 6, fromY + 6); // start the drag
    await this.page.waitForTimeout(50);

    for (let step = 1; step <= 15; step++) {
      await this.page.mouse.move(fromX + (target.x - fromX) * step / 15, fromY + (target.y - fromY) * step / 15);
    }

    await this.page.mouse.move(target.x, target.y);
    await this.page.waitForTimeout(150); // let the drop target register
    await this.page.mouse.up();
  }
}

module.exports = FormEditorPage;
