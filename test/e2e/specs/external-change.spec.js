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

const { test, expect } = require('../harness/test');
const { copyFixture, readFile } = require('../harness/files');

const Modeler = require('../pages/Modeler');

test.describe('external change detection', function() {

  test('should reload without prompting when the open file changes on disk and has no unsaved changes', async function({ launch, tmp }) {

    // given an open, unmodified diagram (the task is labelled "foo")
    const file = await copyFixture('simple.bpmn', tmp);

    const app = await launch({ openFile: file });

    const editor = new Modeler(app).bpmnEditor;

    await editor.canvas().waitFor();

    await expect(editor.element('Task_0zlv465')).toContainText('foo');

    await app.recordDialogs();

    // when the file is changed by another program
    const xml = await readFile(file);

    await fs.writeFile(file, xml.replace('name="foo"', 'name="reloaded externally"'));

    // then, once the window regains focus, the diagram is silently refreshed
    // with the external contents — no reload prompt is shown. The watcher may
    // not have picked up the change at the first focus, so re-focus on each poll
    // until the new label appears.
    await expect.poll(async () => {
      await app.focusWindow();

      return editor.element('Task_0zlv465').textContent();
    }, { timeout: 10000 }).toContain('reloaded externally');

    const calls = await app.dialogCalls();

    expect(calls.some(call => /changed externally/.test(call.message || ''))).toBe(false);
  });


  test('should prompt to reload when the open file changes on disk and the diagram has unsaved changes', async function({ launch, tmp }) {

    // given an open diagram with unsaved changes (renamed in the editor, not saved)
    const file = await copyFixture('simple.bpmn', tmp);

    const app = await launch({ openFile: file });

    const editor = new Modeler(app).bpmnEditor;

    await editor.canvas().waitFor();

    await editor.setName('Task_0zlv465', 'local edit');

    await app.recordDialogs();

    // when the file is changed by another program
    const xml = await readFile(file);

    await fs.writeFile(file, xml.replace('name="foo"', 'name="external edit"'));

    // then, once the window regains focus, the app prompts to reload the
    // externally changed file (reloading would discard the unsaved edit). The
    // watcher may not have picked up the change at the first focus, so re-focus
    // on each poll until the prompt appears.
    await expect.poll(async () => {
      await app.focusWindow();

      const calls = await app.dialogCalls();

      return calls.some(call => /changed externally/.test(call.message || ''));
    }, { timeout: 10000 }).toBe(true);
  });


  test('should reload a background tab that changed on disk when it is re-activated', async function({ launch, tmp }) {

    // given two open diagrams, with the first one pushed to the background
    const fileA = await copyFixture('simple.bpmn', tmp, 'a.bpmn');
    const fileB = await copyFixture('simple.bpmn', tmp, 'b.bpmn');

    const app = await launch({ openFile: fileA });

    const editor = new Modeler(app).bpmnEditor;

    await editor.canvas().waitFor();
    await expect(editor.element('Task_0zlv465')).toContainText('foo');

    // edit a.bpmn and save it; this leaves the tab clean while the editor
    // keeps the saved XML cached — the situation a background reload must reset
    await editor.setName('Task_0zlv465', 'edited in app');

    await app.shortcut('CommandOrControl+S');

    await expect(app.page.locator('.tab--active.tab--dirty')).toHaveCount(0);

    // open the second file; it becomes active and pushes a.bpmn to the background
    await app.expectOpenDialog([ fileB ]);
    await app.shortcut('CommandOrControl+O');

    await expect(app.page.locator('.tab--active .tab__name', { hasText: 'b.bpmn' })).toBeVisible();

    await app.recordDialogs();

    // when the background file is changed by another program
    const xml = await readFile(fileA);

    await fs.writeFile(fileA, xml.replace('name="edited in app"', 'name="reloaded externally"'));

    // and the tab is re-activated
    await app.page.locator('.tab[data-tab-id] .tab__name', { hasText: 'a.bpmn' }).click();

    await expect(app.page.locator('.tab--active .tab__name', { hasText: 'a.bpmn' })).toBeVisible();

    // then the diagram is refreshed with the external contents...
    await expect(editor.element('Task_0zlv465')).toContainText('reloaded externally');

    // ...without a reload prompt...
    const calls = await app.dialogCalls();

    expect(calls.some(call => /changed externally/.test(call.message || ''))).toBe(false);

    // ...and the tab is not marked dirty
    await expect(app.page.locator('.tab--active.tab--dirty')).toHaveCount(0);
  });

});
