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

const { test, expect } = require('../harness/test');
const { copyFixture } = require('../harness/files');

const Modeler = require('../pages/Modeler');

const DIAGNOSTIC_ACTION = '.bio-properties-panel-diagnostic-action';

/**
 * Covers the integration of `@camunda/linting-autofix` — that its diagnostics
 * render through the properties panel and modify the diagram. The affordances
 * themselves are covered by the library.
 */
test.describe('agent config autofix', function() {

  test('should fix a malformed fromAi() key from the properties panel', async function({ launch, tmp }) {

    // given
    const file = await copyFixture('agentic-tool.bpmn', tmp);

    const app = await launch({ openFile: file });

    const modeler = new Modeler(app);
    const editor = modeler.bpmnEditor;
    const propertiesPanel = modeler.propertiesPanel;

    await editor.canvas().waitFor();

    await editor.selectElement('ToolTask_1');

    await propertiesPanel.waitForLoad();
    await propertiesPanel.openGroup('Input mapping');
    await propertiesPanel.openListItem('ToolTask_1-input-0');

    const sourceEntry = propertiesPanel.entry('ToolTask_1-input-0-source');
    const fixButton = sourceEntry.locator(DIAGNOSTIC_ACTION);

    await expect(sourceEntry).toContainText('fromAi(url)');
    await expect(fixButton).toBeVisible();

    // when
    await app.step('accept the correction', async () => {
      await fixButton.click();
    });

    // then
    await expect(sourceEntry).toContainText('fromAi(toolCall.url)');
    await expect(fixButton).toHaveCount(0);
  });


  test('should undo a fix in a single step', async function({ launch, tmp }) {

    // given
    const file = await copyFixture('agentic-tool.bpmn', tmp);

    const app = await launch({ openFile: file });

    const modeler = new Modeler(app);
    const editor = modeler.bpmnEditor;
    const propertiesPanel = modeler.propertiesPanel;

    await editor.canvas().waitFor();

    await editor.selectElement('ToolTask_1');

    await propertiesPanel.waitForLoad();
    await propertiesPanel.openGroup('Input mapping');
    await propertiesPanel.openListItem('ToolTask_1-input-0');

    const sourceEntry = propertiesPanel.entry('ToolTask_1-input-0-source');
    const fixButton = sourceEntry.locator(DIAGNOSTIC_ACTION);

    await app.step('accept the correction', async () => {
      await fixButton.click();
    });

    await expect(sourceEntry).toContainText('fromAi(toolCall.url)');

    // when
    await app.step('undo the correction', async () => {
      await editor.undo();
    });

    // then
    await expect(sourceEntry).toContainText('fromAi(url)');
    await expect(fixButton).toBeVisible();
  });

});
