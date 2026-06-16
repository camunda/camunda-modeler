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
 * Page object for the properties panel (@bpmn-io/properties-panel).
 *
 * Entries are addressed by their stable `data-entry-id`; groups by their
 * header title.
 */
class PropertiesPanelPage {

  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Wait for the panel to render for the current selection.
   *
   * @return {Promise<void>}
   */
  async waitForLoad() {
    await this.page.waitForSelector('.bio-properties-panel');
  }

  /**
   * @param {string} title group header title, e.g. 'Input mapping'
   *
   * @return {import('@playwright/test').Locator}
   */
  group(title) {
    return this.page.locator('.bio-properties-panel-group', {
      has: this.page.locator('.bio-properties-panel-group-header-title', { hasText: title })
    });
  }

  /**
   * Expand a group if it is collapsed (groups start collapsed, hiding their
   * entries). Idempotent.
   *
   * @param {string} title
   *
   * @return {Promise<void>}
   */
  async openGroup(title) {
    const group = this.group(title);

    // a collapsed group hides its entries; expand it by clicking the header.
    // (we probe an entry's visibility rather than a fixed container, so this
    // also works for list groups — Static options, Execution listeners — which
    // don't use the standard entries container)
    const entry = group.locator('[data-entry-id]').first();

    if (!(await entry.isVisible().catch(() => false))) {
      await group.locator('.bio-properties-panel-group-header').first().click();
    }
  }

  /**
   * Expand a list item (e.g. a single input mapping) if collapsed, so its
   * fields become editable. Idempotent.
   *
   * @param {string} entryId the list item's entry id, e.g. 'ServiceTask_1-input-0'
   *
   * @return {Promise<void>}
   */
  async openListItem(entryId) {
    const item = this.entry(entryId).first();
    const header = item.locator('.bio-properties-panel-collapsible-entry-header').first();

    // a collapsible list item carries an `open` class when expanded. Toggling
    // blindly is parity-fragile (a freshly added item is already open, so a
    // stray click would close it) — click the header only while it is collapsed,
    // then wait for the `open` class rather than a fixed delay.
    for (let attempt = 0; attempt < 3; attempt++) {
      if (await item.evaluate(el => el.classList.contains('open')).catch(() => false)) {
        return;
      }

      await header.click();

      try {
        await expect(item).toHaveClass(/\bopen\b/, { timeout: 2000 });

        return;
      } catch {
        continue;
      }
    }

    throw new Error(`could not expand list item "${ entryId }"`);
  }

  /**
   * @param {string} entryId
   *
   * @return {import('@playwright/test').Locator}
   */
  entry(entryId) {
    return this.page.locator(`[data-entry-id="${ entryId }"]`);
  }

  /**
   * Set a text entry value, blurring afterwards to commit (entries commit on
   * blur/change). Handles both plain `input`/`textarea` entries and the
   * CodeMirror "feelers" editors that form-js uses for labels, descriptions and
   * text content — for those the value is inserted atomically (typing char by
   * char drops keystrokes).
   *
   * @param {string} entryId
   * @param {string} value
   *
   * @return {Promise<void>}
   */
  async setText(entryId, value) {
    const editor = this.entry(entryId).locator('.cm-content');

    if (await editor.count()) {
      await editor.click();

      // clear any existing content first — some feelers fields carry a default
      // (e.g. a button's "Button" label), and an insert would append to it
      await this.page.keyboard.press('ControlOrMeta+A');
      await this.page.keyboard.press('Backspace');

      await this.page.keyboard.insertText(value);
      await editor.blur();

      return;
    }

    const input = this.entry(entryId).locator('input, textarea').first();

    await input.fill(value);
    await input.blur();
  }

  /**
   * Set a FEEL entry value. The editor is CodeMirror (a contenteditable that
   * ignores value writes), so we focus it, type, and blur to commit. The
   * leading `=` is implicit in FEEL fields — pass the expression without it.
   *
   * @param {string} entryId
   * @param {string} expression e.g. 'order.id'
   *
   * @return {Promise<void>}
   */
  async setFeel(entryId, expression) {
    const editor = this.entry(entryId).locator('.cm-content');

    await editor.click();

    // type with a per-char delay: the FEEL editor (CodeMirror + async
    // autocompletion) drops characters when typed too fast
    await editor.pressSequentially(expression, { delay: 50 });

    // the full text must be present before we commit
    await expect(editor).toContainText(expression);

    // dismiss the autocompletion popup, then blur to commit to the model
    await this.page.keyboard.press('Escape');
    await editor.blur();
  }

  /**
   * Set a select (dropdown) entry value. Selects commit on change, so no blur
   * is needed.
   *
   * @param {string} entryId
   * @param {string} value the option `value` (e.g. 'start' for an event type)
   *
   * @return {Promise<void>}
   */
  async selectOption(entryId, value) {
    await this.entry(entryId).locator('select').selectOption(value);
  }

  /**
   * Set a checkbox entry. Checkboxes commit on change, so no blur is needed.
   *
   * @param {string} entryId
   * @param {boolean} [checked]
   *
   * @return {Promise<void>}
   */
  async setCheckbox(entryId, checked = true) {
    await this.entry(entryId).locator('input[type="checkbox"]').setChecked(checked);
  }

  /**
   * Add a list item to a list group (e.g. 'Input mapping') by clicking its
   * add button.
   *
   * @param {string} groupTitle
   *
   * @return {Promise<void>}
   */
  async addListItem(groupTitle) {
    await this.group(groupTitle).locator('.bio-properties-panel-add-entry').click();
  }
}

module.exports = PropertiesPanelPage;
