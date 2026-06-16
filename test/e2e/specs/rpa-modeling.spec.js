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
const { readFile, expectFileExists, expectFileContains } = require('../harness/files');

const Modeler = require('../pages/Modeler');

test.describe('RPA modeling (Camunda 8)', function() {

  test('should create, edit, save and re-open an RPA script', async function({ launch, tmp }) {

    // given a new RPA script
    const app = await launch({});

    const editor = new Modeler(app).rpaEditor;

    await app.page.waitForSelector('.tabs');

    await app.step('create a new RPA script', async () => {
      await app.menu('RPA script (Camunda 8)');
      await editor.waitForLoad();
    });

    const output = path.join(tmp, 'test.rpa');
    const dirtyMarker = app.page.locator('.tab__dirty-marker');

    // a new file starts dirty; save it so editing toggles the marker visibly
    await app.step('save the new file', async () => {
      await app.expectSaveDialog(output);
      await app.shortcut('CommandOrControl+S');

      await expectFileExists(output);
      await expect(dirtyMarker).toHaveCount(0);
    });

    // when editing the script content
    await app.step('edit the script content', async () => {
      await editor.type('# edited-by-e2e');

      // then the tab is marked dirty
      await expect(dirtyMarker).toHaveCount(1);
    });

    // and the edit is written to disk on save, keeping the original content
    await app.step('save and verify the file', async () => {
      await app.shortcut('CommandOrControl+S');

      await expectFileContains(output, '# edited-by-e2e');

      const content = await readFile(output);

      expect(content).toContain('Complete the challenge'); // from the initial script
    });

    // and re-opening the file from disk preserves the content
    await app.step('close and re-open the saved file', async () => {
      await app.shortcut('CommandOrControl+W');

      await app.expectOpenDialog([ output ]);
      await app.shortcut('CommandOrControl+O');

      await editor.waitForLoad();

      await expect(editor.editor()).toContainText('# edited-by-e2e');
      await expect(editor.editor()).toContainText('Complete the challenge');
    });
  });


  test('should undo and redo an edit', async function({ launch, tmp }) {

    // given a saved RPA script
    const app = await launch({});

    const editor = new Modeler(app).rpaEditor;

    await app.page.waitForSelector('.tabs');

    await app.step('create and save a new RPA script', async () => {
      await app.menu('RPA script (Camunda 8)');
      await editor.waitForLoad();

      await app.expectSaveDialog(path.join(tmp, 'undo.rpa'));
      await app.shortcut('CommandOrControl+S');
    });

    await app.step('edit the script content', async () => {
      await editor.type('undoMarkerE2E');

      await expect(editor.editor()).toContainText('undoMarkerE2E');
    });

    // when undoing, the edit is reverted
    await app.step('undo the edit', async () => {
      await app.shortcut('CommandOrControl+Z');

      await expect(editor.editor()).not.toContainText('undoMarkerE2E');
    });

    // and redoing restores it
    await app.step('redo the edit', async () => {
      await app.shortcut('CommandOrControl+Y');

      await expect(editor.editor()).toContainText('undoMarkerE2E');
    });
  });


  test('should expose the worker status and test-script controls', async function({ launch }) {

    // given a new RPA script (no worker running)
    const app = await launch({});

    const editor = new Modeler(app).rpaEditor;

    await app.page.waitForSelector('.tabs');
    await app.menu('RPA script (Camunda 8)');
    await editor.waitForLoad();

    // then the status bar shows the (disconnected) worker status and the test button
    await expect(editor.workerStatusButton()).toContainText('not connected');
    await expect(editor.testButton()).toBeVisible();

    // when clicking the worker status, the configuration dialog opens
    await app.step('open the worker configuration dialog', async () => {
      await editor.workerStatusButton().click();

      await expect(editor.workerStatusButton()).toHaveClass(/btn--active/);
    });
  });


  test('should open find and the properties panel', async function({ launch }) {

    // given a new RPA script
    const app = await launch({});

    const modeler = new Modeler(app);
    const editor = modeler.rpaEditor;

    await app.page.waitForSelector('.tabs');
    await app.menu('RPA script (Camunda 8)');
    await editor.waitForLoad();

    // the execution platform version is shown in the status bar
    await expect(modeler.engineProfile.button()).toBeVisible();

    // when opening find, the editor's find widget appears
    await app.step('open find', async () => {
      await editor.editor().click();
      await app.shortcut('CommandOrControl+F');

      await expect(app.page.locator('.monaco-editor .find-widget')).toBeVisible();
    });

    // and the properties panel opens via its Settings toggle
    await app.step('open the properties panel', async () => {
      await editor.openProperties();

      await expect(editor.propertiesPanel()).toContainText('General');
    });
  });


  test('should report a lint violation and clear it when fixed', async function({ launch }) {

    // given a new RPA script on a supported version (RPA needs Camunda 8.7+)
    const app = await launch({});

    const modeler = new Modeler(app);
    const editor = modeler.rpaEditor;
    const engine = modeler.engineProfile;
    const problems = modeler.problemsPanel;

    await app.page.waitForSelector('.tabs');
    await app.menu('RPA script (Camunda 8)');
    await editor.waitForLoad();

    const unsupported = problems.items().filter({ hasText: 'RPA is only supported' });

    await app.step('no version problem on a supported version', async () => {
      await problems.open();

      await expect(unsupported).toHaveCount(0);
    });

    // when downgrading to a version that does not support RPA
    await app.step('select Camunda 8.6', () => engine.setVersion('8.6'));

    // then the problems panel reports it
    await app.step('the version is flagged as unsupported', async () => {
      await expect(unsupported.first()).toContainText('RPA is only supported by Camunda 8.7 or newer');
    });

    // and fixing the version clears the problem
    await app.step('select Camunda 8.7 — the problem clears', async () => {
      await engine.setVersion('8.7');

      await expect(unsupported).toHaveCount(0);
    });
  });

});
