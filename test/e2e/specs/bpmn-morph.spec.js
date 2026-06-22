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
const { copyFixture, readFile, fileExists, expectFileContains } = require('../harness/files');

const Modeler = require('../pages/Modeler');

test.describe('BPMN keep implementation details (Camunda 8)', function() {

  test('should keep shared extensions but drop task-specific ones when morphing', async function({ launch, tmp }) {

    // given a service task with a task definition (service-task specific) and
    // an input mapping (shared across task types)
    const file = await copyFixture('service-task-configured.bpmn', tmp);

    const app = await launch({ openFile: file });

    const editor = new Modeler(app).bpmnEditor;

    await editor.canvas().waitFor();

    // when morphing it to a user task
    await app.step('morph service task to user task', () => {
      return editor.changeType('ServiceTask_1', 'User task');
    });

    await app.step('save file', () => app.shortcut('CommandOrControl+S'));

    // then
    await app.step('verify XML', async () => {

      // wait for the morph to land on disk
      await expectFileContains(file, '<bpmn:userTask');

      const xml = await readFile(file);

      // the task-specific implementation is dropped
      expect(xml).not.toContain('zeebe:taskDefinition');

      // the shared input mapping is preserved
      expect(xml).toContain('zeebe:ioMapping');
      expect(xml).toContain('target="orderId"');
    });
  });


  test('should keep the implementation when morphing to a compatible type', async function({ launch, tmp }) {

    // given a service task with a task definition and an input mapping
    const file = await copyFixture('service-task-configured.bpmn', tmp);

    const app = await launch({ openFile: file });

    const editor = new Modeler(app).bpmnEditor;

    await editor.canvas().waitFor();

    // when morphing it to a send task (also a job-worker task, so it supports
    // the same task definition)
    await app.step('morph service task to send task', () => {
      return editor.changeType('ServiceTask_1', 'Send task');
    });

    await app.step('save file', () => app.shortcut('CommandOrControl+S'));

    // then both the task-specific definition and the shared mapping survive
    await app.step('verify XML', async () => {
      await expectFileContains(file, '<bpmn:sendTask');

      const xml = await readFile(file);

      expect(xml).toContain('zeebe:taskDefinition');
      expect(xml).toContain('type="check-order"');
      expect(xml).toContain('zeebe:ioMapping');
      expect(xml).toContain('target="orderId"');
    });
  });


  test('should undo and redo a morph', async function({ launch, tmp }) {

    // given a service task
    const file = await copyFixture('service-task-configured.bpmn', tmp);

    const app = await launch({ openFile: file });

    const editor = new Modeler(app).bpmnEditor;

    await editor.canvas().waitFor();

    const output = path.join(tmp, 'morph.bpmn');

    // re-save to `output` and report the element's current type
    const savedType = async () => {
      await app.shortcut('CommandOrControl+S');

      if (!(await fileExists(output))) {
        return null;
      }

      const xml = await readFile(output);

      return xml.includes('<bpmn:userTask') ? 'userTask' : 'serviceTask';
    };

    // morph service task -> user task, save as `output`
    await app.step('morph to user task', async () => {
      await editor.changeType('ServiceTask_1', 'User task');

      await app.expectSaveDialog(output);
      await app.shortcut('CommandOrControl+Shift+S');

      await expectFileContains(output, '<bpmn:userTask');
    });

    // undo -> back to a service task
    await app.step('undo restores the service task', async () => {
      await app.shortcut('CommandOrControl+Z');

      await expect.poll(savedType, { timeout: 10000 }).toBe('serviceTask');
    });

    // redo -> user task again
    await app.step('redo re-applies the morph', async () => {
      await app.shortcut('CommandOrControl+Y');

      await expect.poll(savedType, { timeout: 10000 }).toBe('userTask');
    });
  });

});

test.describe('BPMN keep implementation details (Camunda 7)', function() {

  test('should keep the implementation when morphing a service task to a send task', async function({ launch, tmp }) {

    // given a Camunda 7 service task with an implementation, I/O mapping,
    // asyncBefore, a retry time cycle and extension properties
    const file = await copyFixture('c7-service-task-impl.bpmn', tmp);

    const app = await launch({ openFile: file });

    const editor = new Modeler(app).bpmnEditor;

    await editor.canvas().waitFor();

    // when morphing it to a send task (also a job-based task)
    await app.step('morph service task to send task', () => editor.changeType('ServiceTask_1', 'Send task'));
    await app.step('save file', () => app.shortcut('CommandOrControl+S'));

    // then all of the implementation is preserved
    await app.step('verify everything is kept', async () => {
      await expectFileContains(file, '<bpmn:sendTask');

      const xml = await readFile(file);

      expect(xml).toContain('camunda:class="com.example.Check"');
      expect(xml).toContain('camunda:asyncBefore="true"');
      expect(xml).toContain('camunda:inputOutput');
      expect(xml).toContain('camunda:failedJobRetryTimeCycle');
      expect(xml).toContain('camunda:properties');
    });
  });


  test('should drop only the type-specific implementation when morphing to a user task', async function({ launch, tmp }) {

    // given the same configured Camunda 7 service task
    const file = await copyFixture('c7-service-task-impl.bpmn', tmp);

    const app = await launch({ openFile: file });

    const editor = new Modeler(app).bpmnEditor;

    await editor.canvas().waitFor();

    // when morphing it to a user task
    await app.step('morph service task to user task', () => editor.changeType('ServiceTask_1', 'User task'));
    await app.step('save file', () => app.shortcut('CommandOrControl+S'));

    // then the service-task-specific implementation is dropped, but the shared
    // I/O mapping, asyncBefore and retry time cycle are kept
    await app.step('verify only the implementation is dropped', async () => {
      await expectFileContains(file, '<bpmn:userTask');

      const xml = await readFile(file);

      expect(xml).not.toContain('camunda:class');

      expect(xml).toContain('camunda:inputOutput');
      expect(xml).toContain('camunda:asyncBefore="true"');
      expect(xml).toContain('camunda:failedJobRetryTimeCycle');
    });
  });


  test('should drop a form on morph and restore it on undo/redo', async function({ launch, tmp }) {

    // given a Camunda 7 user task with an embedded form
    const file = await copyFixture('c7-user-task-form.bpmn', tmp);

    const app = await launch({ openFile: file });

    const editor = new Modeler(app).bpmnEditor;

    await editor.canvas().waitFor();

    // re-save and report whether the form data is still present
    const hasForm = async () => {
      await app.shortcut('CommandOrControl+S');

      return readFile(file).then(xml => xml.includes('camunda:formData')).catch(() => false);
    };

    // when morphing the user task to a service task, the form is dropped
    await app.step('morph to service task drops the form', async () => {
      await editor.changeType('UserTask_1', 'Service task');

      await expect.poll(hasForm, { timeout: 10000 }).toBe(false);
    });

    // undo -> the form is back
    await app.step('undo restores the form', async () => {
      await editor.undo();

      // wait for the morph to revert before checking the file
      await expect.poll(() => editor.getElementType('UserTask_1'), { timeout: 10000 }).toBe('User Task');

      await expect.poll(hasForm, { timeout: 10000 }).toBe(true);
    });

    // redo -> the form is dropped again
    await app.step('redo drops the form again', async () => {
      await editor.redo();

      // wait for the morph to re-apply before checking the file
      await expect.poll(() => editor.getElementType('UserTask_1'), { timeout: 10000 }).toBe('Service Task');

      await expect.poll(hasForm, { timeout: 10000 }).toBe(false);
    });
  });

});
