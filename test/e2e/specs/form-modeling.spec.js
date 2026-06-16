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

test.describe('Forms modeling (Camunda 8)', function() {

  test('should open a Camunda Form in a tab', async function({ launch, tmp }) {

    // given
    const input = await copyFixture('form.form', tmp, 'invoice.form');

    // when
    const app = await launch({ openFile: input });

    // then
    await expect(app.page.locator('.tab__name', { hasText: 'invoice.form' }).first())
      .toBeVisible();

    await expect(app.page.locator('.fjs-form-editor')).toBeVisible();
  });


  test('should create a new Camunda Form', async function({ launch, tmp }) {

    // given
    const app = await launch({ openFile: await copyFixture('form.form', tmp) });

    await app.page.waitForSelector('.fjs-form-editor');

    // when
    await app.menu('Form (Camunda 8)');

    // then — a new form tab opens with its own editor
    await expect(app.page.locator('.tab__name', { hasText: '.form' })).toHaveCount(2);
    await expect(app.page.locator('.fjs-form-editor')).toBeVisible();
  });


  test('should build the reference form from scratch', async function({ launch, tmp }) {

    // given a new, empty Camunda Form
    const app = await launch({ openFile: await copyFixture('form.form', tmp) });

    const modeler = new Modeler(app);
    const editor = modeler.formEditor;
    const panel = modeler.propertiesPanel;

    await editor.canvas().waitFor();

    await app.step('create a new form', async () => {
      await app.menu('Form (Camunda 8)');
      await editor.canvas().waitFor();
    });

    // each component is dragged from the palette (it ends up selected) and then
    // configured in the properties panel. Components append in drop order.

    await app.step('add the display components (title, text, expression)', async () => {
      await editor.addField('text');
      await panel.openGroup('General');
      await panel.setText('text', '# Invoice');

      await editor.addField('text');
      await panel.openGroup('General');
      await panel.setText('text', [
        'Lorem ipsum _dolor_ **sit**.',
        '',
        'A list of DPMN symbols:',
        '',
        '* Start event',
        '* Task',
        '',
        'Learn more about [forms](https://docs.camunda.io).'
      ].join('\n'));

      // the reference shows an empty expression component
      await editor.addField('expression');
    });

    await app.step('add the input fields', async () => {
      await editor.addField('textfield');
      await panel.openGroup('General');
      await panel.setText('label', 'Creditor');
      await panel.setText('description', 'Creditor in format: CAM-<someNumber>');
      await panel.openGroup('Validation');
      await panel.setCheckbox('required', true);
      await panel.setText('pattern', '^CAM-[0-9]+$');

      await editor.addField('textfield');
      await panel.openGroup('General');
      await panel.setText('label', 'Invoice Number');
      await panel.setText('description', 'An invoice number in the format: C-123.');
      await panel.openGroup('Validation');
      await panel.setText('pattern', '^C-[0-9]+$');

      await editor.addField('textfield');
      await panel.openGroup('General');
      await panel.setText('label', 'Approved By');

      await editor.addField('checkbox');
      await panel.openGroup('General');
      await panel.setText('label', 'Approved');
    });

    await app.step('add the radio group with two options', async () => {
      await editor.addField('radio');

      // only the options here — the radio's own label is set last (below). A
      // subsequent palette drop (the buttons) wipes the radio's freshly-set main
      // label, so it must be applied after every addField.
      await panel.openGroup('Static options');
      await panel.openListItem('staticOptions-0');
      await panel.setText('staticOptions-0-label', 'Camunda Platform');

      await panel.addListItem('Static options');
      await panel.openListItem('staticOptions-1');
      await panel.setText('staticOptions-1-label', 'Camunda Cloud');
    });

    await app.step('add the submit and reset buttons', async () => {
      await editor.addField('button');
      await panel.openGroup('General');
      await panel.setText('label', 'Submit');

      await editor.addField('button');
      await panel.openGroup('General');

      // set the action before the label: switching to "reset" re-renders the
      // button and resets its label, which would overwrite a label set first
      await panel.selectOption('action', 'reset');
      await panel.setText('label', 'Reset');

      // verify the buttons while in view (naming the radio below scrolls to it)
      await editor.fieldByText('Submit').waitFor();
      await editor.fieldByText('Reset').waitFor();
    });

    // name the radio group last: a palette drop wipes the radio's main label, so
    // it is applied here, after all fields are added — nothing but the save
    // follows, so the (async) commit lands reliably.
    await app.step('name the radio group', async () => {
      await editor.selectFieldByType('radio');
      await panel.waitForLoad();
      await panel.openGroup('General');
      await panel.setText('label', 'Radio group');

      await editor.fieldByText('Radio group').waitFor();
    });

    const output = path.join(tmp, 'built.form');

    // then every component of the reference form is persisted in the schema
    await app.step('save and verify the form', async () => {
      await app.expectSaveDialog(output);
      await app.shortcut('CommandOrControl+Shift+S');

      await expectFileExists(output);

      const json = await readFile(output);

      expect(countMatches(json, /"type": "text"/g)).toBe(2);
      expect(countMatches(json, /"type": "textfield"/g)).toBe(3);
      expect(countMatches(json, /"type": "button"/g)).toBe(2);
      expect(json).toContain('"type": "expression"');
      expect(json).toContain('"type": "checkbox"');
      expect(json).toContain('"type": "radio"');

      // a submit and a reset button
      expect(json).toContain('"action": "submit"');
      expect(json).toContain('"action": "reset"');

      // markdown text, labels, descriptions, validation and options
      for (const text of [
        '# Invoice', 'Lorem ipsum _dolor_ **sit**.', '* Start event',
        '[forms](https://docs.camunda.io)', 'Creditor', '^CAM-[0-9]+$',
        'Invoice Number', 'Approved By', 'Approved', 'Radio group',
        'Camunda Platform', 'Camunda Cloud', 'Submit', 'Reset'
      ]) {
        expect(json).toContain(text);
      }
    });
  });


  test('should add a validation pattern to a field and save it', async function({ launch, tmp }) {

    // given
    const file = await copyFixture('form.form', tmp);

    const app = await launch({ openFile: file });

    const modeler = new Modeler(app);
    const editor = modeler.formEditor;
    const panel = modeler.propertiesPanel;

    await editor.canvas().waitFor();

    // when
    await app.step('set a regex pattern on the field', async () => {
      await editor.selectField();

      await panel.waitForLoad();
      await panel.openGroup('Validation');
      await panel.setText('pattern', '^CAM-[0-9]+$');
    });

    const output = path.join(tmp, 'output.form');

    await app.step('save as new file', async () => {
      await app.expectSaveDialog(output);
      await app.shortcut('CommandOrControl+Shift+S');
    });

    // then
    await app.step('verify the pattern in the saved form', async () => {
      await expectFileExists(output);

      const json = await readFile(output);

      expect(json).toContain('^CAM-[0-9]+$');
    });

    // close the tab and re-open the file from disk to confirm it imports
    await app.step('close and re-open the saved form', async () => {
      await app.shortcut('CommandOrControl+W');

      await app.expectOpenDialog([ output ]);
      await app.shortcut('CommandOrControl+O');

      await expect(app.page.locator('.fjs-form-editor')).toBeVisible();
      await expect(app.page.getByText('Invoice Number').first()).toBeVisible();
    });
  });


  test('should validate components against the selected platform version', async function({ launch, tmp }) {

    // given a form using an Expression component (supported only on newer
    // platforms), opened at a version that supports it (8.6)
    const app = await launch({ openFile: await copyFixture('form-expression.form', tmp) });

    const modeler = new Modeler(app);
    const editor = modeler.formEditor;
    const engine = modeler.engineProfile;
    const problems = modeler.problemsPanel;

    await editor.canvas().waitFor();

    // then there is no "not supported" problem at the supported version
    await app.step('no unsupported-component problem at 8.6', async () => {
      await problems.open();

      await expect(problems.items().filter({ hasText: 'not supported' }))
        .toHaveCount(0);
    });

    // when downgrading to a platform version that predates the component
    await app.step('select Camunda 8.0', () => engine.setVersion('8.0'));

    // then the problems panel reports it as unsupported
    await app.step('the component is flagged as unsupported at 8.0', async () => {
      await expect(problems.items().filter({ hasText: 'Expression' }).first())
        .toContainText('not supported by Camunda Platform 8.0');
    });

    // and clicking the problem focuses the offending field in the editor
    await app.step('clicking the problem focuses the field', async () => {
      await problems.focusItem('Expression');

      await expect(editor.selectedField()).toBeVisible();

      await expect(app.page.locator('.bio-properties-panel-header-type'))
        .toContainText('Expression', { ignoreCase: true });
    });
  });

});
