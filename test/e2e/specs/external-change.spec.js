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


  test('should not treat window focus caused by an app dialog as an external change', async function({ launch, tmp }) {

    // given an open diagram with unsaved changes
    const file = await copyFixture('simple.bpmn', tmp);

    const app = await launch({ openFile: file });

    const editor = new Modeler(app).bpmnEditor;

    await editor.canvas().waitFor();

    await editor.setName('Task_0zlv465', 'local edit');

    await expect(app.page.locator('.tab--active.tab--dirty')).toHaveCount(1);

    // and the file has meanwhile changed on disk
    const xml = await readFile(file);

    await fs.writeFile(file, xml.replace('name="foo"', 'name="external edit"'));

    // and the "close file" dialog answers "Don't Save", but — like a real native
    // modal — first refocuses the window while it is still open. Record every
    // message box so we can assert the refocus did not surface a reload prompt.
    await app.electronApp.evaluate(async ({ app: electronApp, dialog }) => {
      const calls = globalThis.__cmDialogCalls = [];

      dialog.showMessageBox = async (...args) => {
        const options = args[args.length - 1] || {};

        calls.push({ message: options.message, title: options.title });

        const buttons = options.buttons || [];

        // the close dialog is modal to the window: as it is dismissed the
        // window regains focus *before* the dialog result is delivered. Emit
        // that focus now, while the dialog is still open, to reproduce the race.
        if (/before closing/.test(options.message || '')) {
          electronApp.emit('menu:action', 'window-focused');

          await new Promise(resolve => setTimeout(resolve, 750));

          const discard = buttons.findIndex(label => /Don't Save/.test(label));

          return { response: discard === -1 ? 1 : discard };
        }

        // any external-change prompt: keep local changes (do not reload)
        const cancel = buttons.findIndex(label => /Cancel/.test(label));

        return { response: cancel === -1 ? 1 : cancel };
      };
    });

    // when the dirty tab is closed
    await app.shortcut('CommandOrControl+W');

    // then the tab closes ...
    await expect(app.page.locator('.tab[data-tab-id]')).toHaveCount(0);

    // ... and the window focus caused by our own close dialog did not trigger
    // an external-change reload prompt
    const calls = await app.dialogCalls();

    expect(calls.some(call => /changed externally/.test(call.message || ''))).toBe(false);
  });

});
