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

const path = require('path');

const { test, expect } = require('../harness/test');
const { copyFixture, readFile, countMatches, expectFileExists } = require('../harness/files');

const Modeler = require('../pages/Modeler');

test.describe('DMN modeling', function() {

  test('should open a DMN diagram in a tab', async function({ launch, tmp }) {

    // given
    const input = await copyFixture('decision.dmn', tmp, 'diagram.dmn');

    // when
    const app = await launch({ openFile: input });

    // then
    await expect(app.page.locator('.tab__name', { hasText: 'diagram.dmn' }).first())
      .toBeVisible();

    await expect(app.page.locator('.djs-container')).toBeVisible();
  });


  test('should create a new DMN diagram', async function({ launch, tmp }) {

    // given
    const app = await launch({ openFile: await copyFixture('decision.dmn', tmp) });

    await app.page.waitForSelector('.djs-container');

    // when
    await app.menu('DMN diagram (Camunda 8)');

    // then — a new DMN tab opens with its own DRD canvas
    await expect(app.page.locator('.tab__name', { hasText: '.dmn' })).toHaveCount(2);
    await expect(app.page.locator('.djs-container')).toBeVisible();
  });


  test('should build the reference DRD from scratch', async function({ launch, tmp }) {

    // given a new DMN diagram (starts with a single decision)
    const app = await launch({ openFile: await copyFixture('decision.dmn', tmp) });

    const modeler = new Modeler(app);
    const editor = modeler.dmnEditor;
    const panel = modeler.propertiesPanel;

    await editor.canvas().waitFor();

    await app.step('create a new DMN diagram', async () => {
      await app.menu('DMN diagram (Camunda 8)');
      await editor.canvas().waitFor();
    });

    // name the element that is currently selected (the freshly appended one, so
    // no click is needed — which also keeps clear of the status bar that overlaps
    // the lower elements)
    const nameSelected = async (value) => {
      await panel.waitForLoad();
      await panel.openGroup('General');
      await panel.setText('name', value);
    };

    // the new DRD has one decision — that becomes "Go on Holidays?"
    const goOnHolidays = await app.page.locator('.djs-element[data-element-id]').first()
      .getAttribute('data-element-id');

    await app.step('model and name the reference DRD', async () => {

      // appending a decision/input-data creates the upstream element that feeds
      // the source decision, and leaves it selected
      await editor.contextPadAction(goOnHolidays, 'append.decision');
      const whichSeason = await editor.selectedElementId();
      await nameSelected('Which Season');

      await editor.contextPadAction(goOnHolidays, 'append.decision');
      await nameSelected('Which Region');

      await editor.contextPadAction(whichSeason, 'append.input-data');
      await nameSelected('Regional Weather');

      await editor.setTextAnnotation(goOnHolidays, 'We decide for holidays once we agreed on season and region');

      // the default decision is named last (clicking it selects it — it sits at
      // the top, always clear of the status bar)
      await editor.selectElement(goOnHolidays);
      await nameSelected('Go on Holidays?');
    });

    const output = path.join(tmp, 'built.dmn');

    // then the saved DRD matches the reference: 3 decisions, 1 input data,
    // 1 annotation, the 3 information requirements and the association
    await app.step('save and verify the DRD', async () => {
      await app.expectSaveDialog(output);
      await app.shortcut('CommandOrControl+Shift+S');

      await expectFileExists(output);

      const xml = await readFile(output);

      expect(countMatches(xml, /<decision\b/g)).toBe(3);
      expect(countMatches(xml, /<inputData\b/g)).toBe(1);
      expect(countMatches(xml, /<textAnnotation\b/g)).toBe(1);
      expect(countMatches(xml, /<informationRequirement\b/g)).toBe(3);
      expect(countMatches(xml, /<association\b/g)).toBe(1);

      expect(xml).toContain('name="Go on Holidays?"');
      expect(xml).toContain('name="Which Season"');
      expect(xml).toContain('name="Which Region"');
      expect(xml).toContain('name="Regional Weather"');
      expect(xml).toContain('We decide for holidays once we agreed on season and region');
    });
  });


  test('should morph decision logic (decision table / literal expression)', async function({ launch, tmp }) {

    // given a new DMN diagram (the default decision already has a decision table)
    const app = await launch({ openFile: await copyFixture('decision.dmn', tmp) });

    const editor = new Modeler(app).dmnEditor;

    await editor.canvas().waitFor();

    await app.step('create a new DMN diagram', async () => {
      await app.menu('DMN diagram (Camunda 8)');
      await editor.canvas().waitFor();
    });

    const decision = await app.page.locator('.djs-element[data-element-id]').first()
      .getAttribute('data-element-id');

    // when appending two (logic-less) decisions and morphing their logic types
    await app.step('append two decisions and morph their logic', async () => {
      await editor.contextPadAction(decision, 'append.decision');
      const toTable = await editor.selectedElementId();
      await editor.morphLogic(toTable, 'Decision table');

      await editor.contextPadAction(decision, 'append.decision');
      const toLiteral = await editor.selectedElementId();
      await editor.morphLogic(toLiteral, 'Literal expression');
    });

    const output = path.join(tmp, 'morphed.dmn');

    // then two decisions carry a decision table (the default + the morphed one)
    // and one carries a literal expression
    await app.step('save and verify the logic types', async () => {
      await app.expectSaveDialog(output);
      await app.shortcut('CommandOrControl+Shift+S');

      await expectFileExists(output);

      const xml = await readFile(output);

      expect(countMatches(xml, /<decisionTable\b/g)).toBe(2);
      expect(countMatches(xml, /<literalExpression\b/g)).toBe(1);
    });
  });


  test('should morph the named decisions and open the table via the overlay', async function({ launch, tmp }) {

    // given a new DMN diagram (the default decision already carries a table)
    const app = await launch({ openFile: await copyFixture('decision.dmn', tmp) });

    const modeler = new Modeler(app);
    const editor = modeler.dmnEditor;
    const panel = modeler.propertiesPanel;

    await editor.canvas().waitFor();

    await app.step('create a new DMN diagram', async () => {
      await app.menu('DMN diagram (Camunda 8)');
      await editor.canvas().waitFor();
    });

    const nameSelected = async (value) => {
      await panel.waitForLoad();
      await panel.openGroup('General');
      await panel.setText('name', value);
    };

    const goOnHolidays = await app.page.locator('.djs-element[data-element-id]').first()
      .getAttribute('data-element-id');

    // when modeling the three reference decisions and morphing each to its logic:
    // "Go on Holidays?" keeps its (default) decision table, "Which Season" is
    // morphed to a decision table, "Which Region" to a literal expression
    await app.step('model and morph the three decisions', async () => {
      await editor.selectElement(goOnHolidays);
      await nameSelected('Go on Holidays?');

      await editor.contextPadAction(goOnHolidays, 'append.decision');
      const whichSeason = await editor.selectedElementId();
      await nameSelected('Which Season');
      await editor.morphLogic(whichSeason, 'Decision table');

      await editor.contextPadAction(goOnHolidays, 'append.decision');
      const whichRegion = await editor.selectedElementId();
      await nameSelected('Which Region');
      await editor.morphLogic(whichRegion, 'Literal expression');
    });

    // and clicking the blue overlay on "Go on Holidays?" drills into its table
    await app.step('open the decision table via the blue overlay', async () => {
      await editor.openDecisionTable(goOnHolidays);

      await expect(editor.decisionTable()).toBeVisible();
    });

    const output = path.join(tmp, 'morphed-named.dmn');

    // then the saved DRD has two decision tables and one literal expression
    await app.step('save and verify the logic types and names', async () => {
      await app.expectSaveDialog(output);
      await app.shortcut('CommandOrControl+Shift+S');

      await expectFileExists(output);

      const xml = await readFile(output);

      expect(countMatches(xml, /<decisionTable\b/g)).toBe(2);
      expect(countMatches(xml, /<literalExpression\b/g)).toBe(1);
      expect(xml).toContain('name="Go on Holidays?"');
      expect(xml).toContain('name="Which Season"');
      expect(xml).toContain('name="Which Region"');
    });
  });


  test('should save from the decision table editor (table editing mode)', async function({ launch, tmp }) {

    // given a decision opened in its table editor
    const app = await launch({ openFile: await copyFixture('decision.dmn', tmp) });

    const editor = new Modeler(app).dmnEditor;

    await editor.canvas().waitFor();

    await app.step('open the decision table editor', async () => {
      await editor.openDecisionTable('Decision_1');

      await expect(editor.decisionTable()).toBeVisible();
    });

    const output = path.join(tmp, 'table.dmn');

    // when saving as a new file from table-editing mode
    await app.step('save as new file from table mode', async () => {
      await app.expectSaveDialog(output);
      await app.shortcut('CommandOrControl+Shift+S');
    });

    // then the file is written and the table editor is still active
    await app.step('verify the file written from table mode', async () => {
      await expectFileExists(output);

      expect(await readFile(output)).toContain('<decision id="Decision_1"');

      await expect(editor.decisionTable()).toBeVisible();
    });
  });


  test('should rename a decision, reflect it in the DRD, and re-open after save', async function({ launch, tmp }) {

    // given
    const file = await copyFixture('decision.dmn', tmp);

    const app = await launch({ openFile: file });

    const modeler = new Modeler(app);
    const editor = modeler.dmnEditor;
    const panel = modeler.propertiesPanel;

    await editor.canvas().waitFor();

    // when
    await app.step('rename the decision', async () => {
      await editor.selectElement('Decision_1');

      await panel.waitForLoad();
      await panel.openGroup('General');
      await panel.setText('name', 'Approve Order');
    });

    // then — the new name is shown in the DRD
    await expect(editor.element('Decision_1')).toContainText('Approve Order');

    const output = path.join(tmp, 'output.dmn');

    await app.step('save as new file', async () => {
      await app.expectSaveDialog(output);
      await app.shortcut('CommandOrControl+Shift+S');
    });

    await app.step('verify the renamed decision in XML', async () => {
      await expectFileExists(output);

      const xml = await readFile(output);

      expect(xml).toContain('id="Decision_1"');
      expect(xml).toContain('name="Approve Order"');
    });

    // close the tab and re-open the file from disk to confirm it imports
    await app.step('close and re-open the saved file', async () => {
      await app.shortcut('CommandOrControl+W');

      await app.expectOpenDialog([ output ]);
      await app.shortcut('CommandOrControl+O');

      await expect(editor.canvas()).toBeVisible();
      await expect(editor.element('Decision_1')).toContainText('Approve Order');
    });
  });

});
