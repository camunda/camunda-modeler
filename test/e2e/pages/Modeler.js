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

const BpmnEditorPage = require('./BpmnEditorPage');
const DmnEditorPage = require('./DmnEditorPage');
const FormEditorPage = require('./FormEditorPage');
const RpaEditorPage = require('./RpaEditorPage');
const PropertiesPanelPage = require('./PropertiesPanelPage');
const ProblemsPanelPage = require('./ProblemsPanelPage');
const EngineProfilePage = require('./EngineProfilePage');

/**
 * Top-level page object for a running Camunda Modeler instance. Wraps the
 * launched app and exposes its UI surfaces as ready-to-use page objects, so a
 * test constructs one `Modeler` instead of wiring each page object by hand:
 *
 *   const modeler = new Modeler(app);
 *   await modeler.bpmnEditor.selectElement('Task_1');
 *   await modeler.propertiesPanel.openGroup('General');
 */
class Modeler {

  /**
   * @param {import('../harness/electron-app').ElectronApp} app
   */
  constructor(app) {
    this.app = app;
    this.page = app.page;

    this.bpmnEditor = new BpmnEditorPage(app);
    this.dmnEditor = new DmnEditorPage(app);
    this.formEditor = new FormEditorPage(app);
    this.rpaEditor = new RpaEditorPage(app);
    this.propertiesPanel = new PropertiesPanelPage(app.page);
    this.problemsPanel = new ProblemsPanelPage(app);
    this.engineProfile = new EngineProfilePage(app);
  }

  /**
   * Switch the active editor to its XML source view via the status-bar sheet
   * toggle, and wait for the source editor to render.
   *
   * @return {Promise<void>}
   */
  async showXml() {
    await this.page.locator('[title="Toggle XML"]').click();

    await this.xmlView().waitFor();
  }

  /**
   * The XML source view's editor content. Only the active sheet is mounted, so
   * in the XML view this is the source editor — the diagram editor and its
   * properties panel (which also use CodeMirror) are swapped out.
   *
   * @return {import('@playwright/test').Locator}
   */
  xmlView() {
    return this.page.locator('.cm-content').first();
  }
}

module.exports = Modeler;
