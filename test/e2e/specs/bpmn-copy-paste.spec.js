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

test.describe('BPMN copy/paste', function() {

  test('should copy and paste all elements (select all)', async function({ launch, tmp }) {

    // given a diagram with several elements
    const file = await copyFixture('simple.bpmn', tmp);

    const app = await launch({ openFile: file });

    const editor = new Modeler(app).bpmnEditor;

    await editor.canvas().waitFor();

    // when selecting everything, copying, and pasting
    await app.step('select all and copy', async () => {
      await app.shortcut('CommandOrControl+A');
      await app.shortcut('CommandOrControl+C');
    });

    await app.step('paste', () => editor.pasteAt(0.5, 0.72));

    // then the elements are duplicated
    await app.step('save and verify the duplicates', async () => {
      const output = path.join(tmp, 'pasted.bpmn');

      await app.expectSaveDialog(output);
      await app.shortcut('CommandOrControl+Shift+S');

      await expectFileExists(output);

      const xml = await readFile(output);

      expect(countMatches(xml, /<bpmn:task\b/g)).toBe(2);
      expect(countMatches(xml, /<bpmn:startEvent\b/g)).toBe(2);
    });
  });


  test('should paste copied elements into a new empty diagram', async function({ launch, tmp }) {

    // given a diagram with content
    const app = await launch({ openFile: await copyFixture('simple.bpmn', tmp) });

    const editor = new Modeler(app).bpmnEditor;

    await editor.canvas().waitFor();

    // when selecting all and copying it
    await app.step('select all and copy', async () => {
      await app.shortcut('CommandOrControl+A');
      await app.shortcut('CommandOrControl+C');
    });

    // and creating a new diagram, then clearing its start event so it is empty
    await app.step('create a new, empty diagram', async () => {
      await app.menu('BPMN diagram (Camunda 8)');
      await editor.canvas().waitFor();
      await editor.contextPadAction('StartEvent_1', 'delete');
    });

    await app.step('paste', () => editor.pasteAt(0.5, 0.5));

    // then the copied contents land in the new diagram
    await app.step('save and verify the pasted contents', async () => {
      const output = path.join(tmp, 'pasted-new.bpmn');

      await app.expectSaveDialog(output);
      await app.shortcut('CommandOrControl+Shift+S');

      await expectFileExists(output);

      const xml = await readFile(output);

      expect(countMatches(xml, /<bpmn:startEvent\b/g)).toBe(1);
      expect(countMatches(xml, /<bpmn:task\b/g)).toBe(1);
      expect(countMatches(xml, /<bpmn:endEvent\b/g)).toBe(1);
      expect(xml).toContain('name="foo"');
    });
  });


  test('should keep zeebe extensions on a copied + pasted service task', async function({ launch, tmp }) {

    // given a service task with a task definition and an input mapping
    const file = await copyFixture('service-task-configured.bpmn', tmp);

    const app = await launch({ openFile: file });

    const editor = new Modeler(app).bpmnEditor;

    await editor.canvas().waitFor();

    // when copying it and pasting a second copy
    await app.step('copy + paste the service task', async () => {
      await editor.copy('ServiceTask_1');
      await editor.pasteAt(0.5, 0.72);
    });

    await app.step('save file', () => app.shortcut('CommandOrControl+S'));

    // then both tasks carry the same zeebe extensions
    await app.step('verify pasted copy kept its extensions', async () => {
      await expect.poll(
        () => readFile(file).then(xml => countMatches(xml, /<bpmn:serviceTask/g)),
        { timeout: 10000 }
      ).toBe(2);

      const xml = await readFile(file);

      expect(countMatches(xml, /zeebe:taskDefinition/g)).toBe(2);
      expect(countMatches(xml, /target="orderId"/g)).toBe(2);
    });
  });


  test('should keep the linked form on a copied + pasted user task', async function({ launch, tmp }) {

    // given a user task linked to a Camunda form
    const file = await copyFixture('user-task-form.bpmn', tmp);

    const app = await launch({ openFile: file });

    const editor = new Modeler(app).bpmnEditor;

    await editor.canvas().waitFor();

    // when copying it and pasting a second copy
    await app.step('copy + paste the user task', async () => {
      await editor.copy('UserTask_1');
      await editor.pasteAt(0.5, 0.72);
    });

    await app.step('save file', () => app.shortcut('CommandOrControl+S'));

    // then both user tasks keep the linked form
    await app.step('verify pasted copy kept its form', async () => {
      await expect.poll(
        () => readFile(file).then(xml => countMatches(xml, /<bpmn:userTask/g)),
        { timeout: 10000 }
      ).toBe(2);

      const xml = await readFile(file);

      expect(countMatches(xml, /zeebe:formDefinition/g)).toBe(2);
      expect(countMatches(xml, /formId="invoice-form"/g)).toBe(2);
    });
  });

});
