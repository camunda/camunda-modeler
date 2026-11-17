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

const fs = require('fs/promises');
const path = require('path');

const { test, expect } = require('../harness/test');
const { copyFixture, readFile, expectFileContains } = require('../harness/files');

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


test.describe('template update autofix', function() {

  test('should match properties-panel Update, reveal the element and undo in one step', async function({ launch, tmp }) {

    // given
    const { app, file } = await launchWithOutdatedTemplate(launch, tmp);
    const { bpmnEditor: editor, propertiesPanel, problemsPanel } = new Modeler(app);

    await editor.canvas().waitFor();
    await editor.selectElement('ServiceTask_1');
    await propertiesPanel.waitForLoad();

    await app.page.getByRole('button', { name: 'Update available', exact: true }).click();
    await app.page.getByText('Update', { exact: true }).click();

    const propertiesPanelXML = await saveTemplateVersion(app, file, 2);

    await editor.undo();
    await saveTemplateVersion(app, file, 1);
    await problemsPanel.open();

    // finding-row navigation must select without updating
    await editor.selectElement('StartEvent_1');
    await problemsPanel.focusItem('Element has updated template available.');
    await expect(editor.element('ServiceTask_1')).toHaveClass(/\bselected\b/);
    await expect(app.page.getByRole('button', { name: 'Update available', exact: true })).toBeVisible();

    await editor.canvas().click({ position: { x: 200, y: 200 } });
    await expect(app.page.locator('.djs-shape.selected')).toHaveCount(0);
    await app.page.getByRole('button', { name: 'Properties', exact: true }).click();
    await expect(app.page.locator('.side-panel')).not.toHaveClass(/\bopen\b/);

    // when
    await problemsPanel.items().filter({ hasText: 'Element has updated template available.' })
      .getByRole('button', { name: 'Update', exact: true }).click();

    // then
    await expect(editor.element('ServiceTask_1')).toHaveClass(/\bselected\b/);
    await expect(app.page.locator('.side-panel')).toHaveClass(/\bopen\b/);
    await expect(propertiesPanel.header()).toBeVisible();
    await expect(propertiesPanel.header()).toContainText('Update E2E');
    await expect(problemsPanel.items().filter({ hasText: 'Element has updated template available.' })).toHaveCount(0);
    expect(await saveTemplateVersion(app, file, 2)).toBe(propertiesPanelXML);

    await editor.undo();
    await saveTemplateVersion(app, file, 1);
    await expect(problemsPanel.items().filter({ hasText: 'Element has updated template available.' })).toHaveCount(1);

    await editor.redo();
    expect(await saveTemplateVersion(app, file, 2)).toBe(propertiesPanelXML);
  });


  test('should activate from the keyboard without moving focus into the properties panel', async function({ launch, tmp }) {

    // given
    const { app, file } = await launchWithOutdatedTemplate(launch, tmp);
    const { bpmnEditor: editor, propertiesPanel, problemsPanel } = new Modeler(app);

    await editor.canvas().waitFor();
    await app.page.getByRole('button', { name: 'Properties', exact: true }).click();
    await expect(app.page.locator('.side-panel')).not.toHaveClass(/\bopen\b/);
    await problemsPanel.open();

    const update = problemsPanel.items().filter({ hasText: 'Element has updated template available.' })
      .getByRole('button', { name: 'Update', exact: true });

    await update.focus();
    await app.page.evaluate(() => {
      globalThis.propertiesPanelFocusEvents = [];
      globalThis.document.addEventListener('focusin', event => {
        if (event.target.closest('.bio-properties-panel')) {
          globalThis.propertiesPanelFocusEvents.push(event.target.tagName);
        }
      });
    });

    // when
    await update.press('Enter');

    // then
    await expect(editor.element('ServiceTask_1')).toHaveClass(/\bselected\b/);
    await expect(app.page.locator('.side-panel')).toHaveClass(/\bopen\b/);
    await expect(propertiesPanel.header()).toBeVisible();
    await saveTemplateVersion(app, file, 2);
    expect(await app.page.evaluate(() => globalThis.propertiesPanelFocusEvents)).toEqual([]);
  });


  test('should update only once on rapid activation', async function({ launch, tmp }) {

    // given
    const { app, file } = await launchWithOutdatedTemplate(launch, tmp);
    const { bpmnEditor: editor, problemsPanel } = new Modeler(app);

    await editor.canvas().waitFor();
    await problemsPanel.open();

    // when
    await problemsPanel.items().filter({ hasText: 'Element has updated template available.' })
      .getByRole('button', { name: 'Update', exact: true }).dblclick();

    // then
    await saveTemplateVersion(app, file, 2);
    await editor.undo();
    await saveTemplateVersion(app, file, 1);
    await expect(problemsPanel.items().filter({ hasText: 'Element has updated template available.' })).toHaveCount(1);
  });

});


// helpers //////////

async function launchWithOutdatedTemplate(launch, tmp) {
  const templatesDir = path.join(tmp, '.camunda', 'element-templates');
  const templates = [ 1, 2 ].map(version => ({
    $schema: 'https://unpkg.com/@camunda/zeebe-element-templates-json-schema/resources/schema.json',
    id: 'io.camunda.examples.CredentialsE2E',
    name: 'Update E2E',
    version,
    appliesTo: [ 'bpmn:Task' ],
    elementType: { value: 'bpmn:ServiceTask' },
    properties: [ {
      type: 'Hidden',
      value: `io.camunda:e2e:${ version }`,
      binding: { type: 'zeebe:taskDefinition', property: 'type' }
    } ]
  }));

  await fs.mkdir(templatesDir, { recursive: true });
  await fs.writeFile(path.join(templatesDir, 'update.json'), JSON.stringify(templates));

  const file = await copyFixture('credentials-service-task.bpmn', tmp);
  const app = await launch({ openFile: file });

  return { app, file };
}

async function saveTemplateVersion(app, file, version) {
  await app.shortcut('CommandOrControl+S');
  await expectFileContains(file, `zeebe:modelerTemplateVersion="${ version }"`);
  await expectFileContains(file, `type="io.camunda:e2e:${ version }"`);

  return readFile(file);
}
