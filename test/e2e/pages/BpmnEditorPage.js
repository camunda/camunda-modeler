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
const PropertiesPanelPage = require('./PropertiesPanelPage');

/**
 * Page object for the BPMN editor (bpmn-js) canvas — diagram-js based, so the
 * canvas/selection/context-pad interactions come from {@link DiagramEditorPage}.
 */
class BpmnEditorPage extends DiagramEditorPage {

  /**
   * Select an element by id, panning it into view first (BPMN diagrams grow
   * beyond the viewport, unlike the small DRDs).
   *
   * @param {string} elementId
   *
   * @return {Promise<void>}
   */
  async selectElement(elementId) {
    await this.scrollToElement(elementId);

    await super.selectElement(elementId);
  }

  /**
   * Pan the canvas so an element is in view, by mouse-wheel scrolling the
   * viewport until the element is centred. Works at a fixed zoom — we move the
   * view to the element rather than zooming the whole diagram in and out (which
   * would shrink shapes below a clickable size). No-op when the element is
   * already fully visible.
   *
   * Empirically a wheel delta moves the content by ~0.75x that many pixels, so
   * we divide the screen-space gap by that factor and iterate to converge.
   *
   * @param {string} elementId
   *
   * @return {Promise<void>}
   */
  async scrollToElement(elementId) {
    const canvas = await this.canvas().boundingBox();

    // the canvas box spans the whole editor area, but the palette (left) and
    // the top toolbar overlay it — an element under those is unclickable. Work
    // within a safe inset region and centre elements into it.
    const left = canvas.x + 130;
    const top = canvas.y + 80;
    const right = canvas.x + canvas.width - 30;
    const bottom = canvas.y + canvas.height - 30;
    const cx = (left + right) / 2;
    const cy = (top + bottom) / 2;

    for (let attempt = 0; attempt < 6; attempt++) {
      const box = await this.element(elementId).boundingBox();

      if (!box) {
        return;
      }

      const visible =
        box.x >= left && box.y >= top &&
        box.x + box.width <= right && box.y + box.height <= bottom;

      if (visible) {
        return;
      }

      const dx = (box.x + box.width / 2 - cx) / 0.75;
      const dy = (box.y + box.height / 2 - cy) / 0.75;

      await this.page.mouse.move(cx, cy);
      await this.page.mouse.wheel(dx, dy);
      await this.page.waitForTimeout(60);
    }
  }

  /**
   * Morph (change the type of) an element via the context pad's replace menu.
   *
   * @param {string} elementId
   * @param {string} targetTitle the replace-menu entry title, e.g. 'User task'
   *
   * @return {Promise<void>}
   */
  async changeType(elementId, targetTitle) {
    await this.showContextPad(elementId);

    await this.page.locator('.djs-context-pad .entry[data-action="replace"]').click();

    await this.page.waitForSelector('.djs-popup');

    await this.page.locator(`.djs-popup .entry[title="${ targetTitle }"]`).first().click();
  }

  /**
   * Undo the last command (Cmd/Ctrl+Z).
   *
   * @return {Promise<void>}
   */
  undo() {
    return this.app.shortcut('CommandOrControl+Z');
  }

  /**
   * Redo the last undone command (Cmd/Ctrl+Y).
   *
   * @return {Promise<void>}
   */
  redo() {
    return this.app.shortcut('CommandOrControl+Y');
  }

  /**
   * The type of an element as shown in the properties-panel header (e.g. 'User
   * Task', 'Service Task'). Selects the element first, so it works as an
   * observable after undo/redo — which clear the canvas selection.
   *
   * @param {string} elementId
   *
   * @return {Promise<string>}
   */
  async getElementType(elementId) {
    await this.selectElement(elementId);

    return new PropertiesPanelPage(this.page).elementType();
  }

  /**
   * Set the name of any element, addressed by id. Selects the element first (so
   * it does not matter what was selected before), then sets the name in the
   * properties panel's General group.
   *
   * @param {string} elementId
   * @param {string} value
   *
   * @return {Promise<void>}
   */
  async setName(elementId, value) {
    await this.selectElement(elementId);

    const panel = new PropertiesPanelPage(this.page);

    await panel.waitForLoad();
    await panel.openGroup('General');
    await panel.setText('name', value);
  }

  /**
   * Append a new element off `fromId` via the context pad's generic "append"
   * action, picking `title` from the chooser popup (e.g. 'Sub-process
   * (expanded)'). Unlike append-then-morph, the element is placed by the
   * auto-layout with proper spacing — it does not expand in place over its
   * neighbour.
   *
   * @param {string} fromId
   * @param {string} title the chooser entry title
   *
   * @return {Promise<string>} the appended element's id
   */
  async appendElement(fromId, title) {
    await this.showContextPad(fromId);

    await this.page.locator('.djs-context-pad .entry[data-action="append"]').click();

    await this.page.waitForSelector('.djs-popup');
    await this.page.locator(`.djs-popup .entry[title="${ title }"]`).first().click();

    return this.selectedElementId();
  }

  /**
   * Append an element off `fromId` via a context-pad action, optionally name
   * it, and return its (auto-generated) id.
   *
   * @param {string} fromId
   * @param {string} action the context-pad entry's `data-action`, e.g. 'append.gateway'
   * @param {string} [label] name to set on the new element
   *
   * @return {Promise<string>} the appended element's id
   */
  async append(fromId, action, label) {
    await this.contextPadAction(fromId, action);

    const id = await this.selectedElementId();

    if (label) {
      await this.setName(id, label);
    }

    return id;
  }

  /**
   * Append a generic task off `fromId`, morph it to `type`, optionally name it,
   * and return its id.
   *
   * @param {string} fromId
   * @param {string} type the replace-menu entry title, e.g. 'User task'
   * @param {string} [label] name to set on the new task
   *
   * @return {Promise<string>} the appended task's id
   */
  async appendTask(fromId, type, label) {
    await this.contextPadAction(fromId, 'append.append-task');

    const id = await this.selectedElementId();

    await this.changeType(id, type);

    if (label) {
      await this.setName(id, label);
    }

    return id;
  }

  /**
   * Create a child element inside a container (e.g. a start event inside an
   * expanded sub-process) by dragging a palette tool onto a point in the
   * container. A freshly created shape opens label direct-editing, which we
   * dismiss with Escape so the next interaction is not swallowed.
   *
   * @param {string} paletteAction the palette entry's `data-action`, e.g. 'create.start-event'
   * @param {string} containerId
   * @param {number} relX 0..1 fraction of the container width to drop at
   * @param {number} relY 0..1 fraction of the container height to drop at
   *
   * @return {Promise<string>} the created element's id
   */
  async createChildElement(paletteAction, containerId, relX, relY) {
    await this.scrollToElement(containerId);

    const box = await this.element(containerId).boundingBox();
    const tool = this.page.locator(`.djs-palette .entry[data-action="${ paletteAction }"]`);
    const toolBox = await tool.boundingBox();

    await this.page.mouse.move(toolBox.x + toolBox.width / 2, toolBox.y + toolBox.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(box.x + box.width * relX, box.y + box.height * relY, { steps: 12 });
    await this.page.mouse.up();

    await this.page.keyboard.press('Escape');

    return this.selectedElementId();
  }

  /**
   * Copy an element via the real Copy shortcut binding (Cmd/Ctrl+C).
   *
   * @param {string} elementId
   *
   * @return {Promise<void>}
   */
  async copy(elementId) {
    await this.selectElement(elementId);

    await this.app.shortcut('CommandOrControl+C');
  }

  /**
   * Paste the clipboard contents (via the real Paste shortcut binding) and drop
   * them at a point in the canvas.
   *
   * `paste` starts an interactive create-drag attached to the cursor, so we
   * position the mouse, paste, then click to drop.
   *
   * @param {number} relX 0..1 fraction of the canvas width
   * @param {number} relY 0..1 fraction of the canvas height
   *
   * @return {Promise<void>}
   */
  async pasteAt(relX, relY) {
    const box = await this.canvas().boundingBox();
    const x = box.x + box.width * relX;
    const y = box.y + box.height * relY;

    await this.page.mouse.move(x, y);

    await this.app.shortcut('CommandOrControl+V');

    await this.page.mouse.click(x, y);
  }
}

module.exports = BpmnEditorPage;
