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

});
