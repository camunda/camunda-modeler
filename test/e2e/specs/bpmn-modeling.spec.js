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

test.describe('BPMN modeling', function() {

  test('should build a diagram from scratch', async function({ launch, tmp }) {

    // given a new, empty BPMN diagram (starts with a single start event)
    const app = await launch({});

    const editor = new Modeler(app).bpmnEditor;

    await app.page.waitForSelector('.tabs');

    await app.step('create a new BPMN diagram', () => app.menu('BPMN diagram (Camunda 8)'));

    await editor.canvas().waitFor();

    await app.shortcut('CommandOrControl+0');

    // when modeling Start -> "Inspect Invoice" (user task) -> "Check" (service
    // task) -> exclusive gateway, which splits into two branches:
    //   - a "Process Payment" sub-process holding Start -> "Charge Card" -> End
    //   - a direct end event
    let subProcess;

    await app.step('model the main flow', async () => {
      await editor.setName('StartEvent_1', 'Invoice received');

      const userTask = await editor.appendTask('StartEvent_1', 'User task', 'Inspect Invoice');
      const serviceTask = await editor.appendTask(userTask, 'Service task', 'Check');

      const gateway = await editor.append(serviceTask, 'append.gateway', 'Approved?');

      subProcess = await editor.appendElement(gateway, 'Sub-process (expanded)');
      await editor.setName(subProcess, 'Process Payment');

      // close both branches with end events while the sub-process is still empty
      await editor.append(gateway, 'append.end-event', 'Rejected');
      await editor.append(subProcess, 'append.end-event', 'Payment completed');
    });

    await app.step('model the simple case inside the sub-process', async () => {

      // an appended sub-process is empty, so drop a start event into it via the
      // palette, then model start -> "Charge Card" task -> end
      const innerStart = await editor.createChildElement('create.start-event', subProcess, 0.18, 0.5);
      await editor.setName(innerStart, 'Payment started');

      const innerTask = await editor.append(innerStart, 'append.append-task', 'Charge Card');
      await editor.append(innerTask, 'append.end-event', 'Payment processed');
    });

    const output = path.join(tmp, 'scratch.bpmn');

    // then the saved diagram contains the modeled, typed, named, connected elements
    await app.step('save and verify the built diagram', async () => {
      await app.expectSaveDialog(output);
      await app.shortcut('CommandOrControl+Shift+S');

      await expectFileExists(output);

      const xml = await readFile(output);

      // 2 start events (top-level + inside the sub-process), 3 end events
      // (gateway branch + sub-process branch + inside the sub-process)
      expect(countMatches(xml, /<bpmn:startEvent\b/g)).toBe(2);
      expect(countMatches(xml, /<bpmn:endEvent\b/g)).toBe(3);
      expect(countMatches(xml, /<bpmn:sequenceFlow\b/g)).toBe(8);

      expect(countMatches(xml, /<bpmn:exclusiveGateway\b/g)).toBe(1);
      expect(countMatches(xml, /<bpmn:subProcess\b/g)).toBe(1);

      expect(xml).toContain('<bpmn:userTask');
      expect(xml).toContain('<bpmn:serviceTask');

      // every element carries the name we gave it
      for (const elementName of [
        'Invoice received', 'Inspect Invoice', 'Check', 'Approved?',
        'Process Payment', 'Rejected', 'Payment completed',
        'Payment started', 'Charge Card', 'Payment processed'
      ]) {
        expect(xml).toContain(`name="${ elementName }"`);
      }
    });
  });


  test('should open and round-trip a complex diagram', async function({ launch, tmp }) {

    // given the reference test diagram (pools, sub-process, gateway, data store,
    // message flows, text annotation, user/service tasks)
    const file = await copyFixture('complex.bpmn', tmp);

    const app = await launch({ openFile: file });

    const editor = new Modeler(app).bpmnEditor;

    // it renders (a pool from the collaboration is on the canvas)
    await expect(editor.element('Participant_0sxt036')).toBeVisible();

    const output = path.join(tmp, 'roundtrip.bpmn');

    await app.step('save as a new file', async () => {
      await app.expectSaveDialog(output);
      await app.shortcut('CommandOrControl+Shift+S');

      await expectFileExists(output);
    });

    // then every element type survives the import + export round-trip
    await app.step('verify all elements are preserved', async () => {
      const xml = await readFile(output);

      expect(countMatches(xml, /<bpmn:participant\b/g)).toBe(3);
      expect(countMatches(xml, /<bpmn:subProcess\b/g)).toBe(1);
      expect(countMatches(xml, /<bpmn:exclusiveGateway\b/g)).toBe(1);
      expect(countMatches(xml, /<bpmn:userTask\b/g)).toBe(2);
      expect(countMatches(xml, /<bpmn:serviceTask\b/g)).toBe(1);
      expect(countMatches(xml, /<bpmn:dataStoreReference\b/g)).toBe(1);
      expect(countMatches(xml, /<bpmn:messageFlow\b/g)).toBe(2);
      expect(countMatches(xml, /<bpmn:textAnnotation\b/g)).toBe(1);
    });

    // and the saved file re-imports correctly
    await app.step('close and re-open the saved file', async () => {
      await app.shortcut('CommandOrControl+W');

      await app.expectOpenDialog([ output ]);
      await app.shortcut('CommandOrControl+O');

      await expect(editor.element('Participant_0sxt036')).toBeVisible();
    });
  });


  test('should reflect a model edit in the in-app XML view', async function({ launch, tmp }) {

    // given an opened diagram whose task has been renamed in the editor
    const file = await copyFixture('simple.bpmn', tmp);

    const app = await launch({ openFile: file });

    const modeler = new Modeler(app);
    const editor = modeler.bpmnEditor;

    await editor.canvas().waitFor();

    await editor.setName('Task_0zlv465', 'Review invoice');

    // when switching to the XML source view
    await app.step('toggle the XML view', () => modeler.showXml());

    // then the in-app XML reflects the edit (the editor's serialization, not
    // just the file written to disk)
    await expect(modeler.xmlView()).toContainText('name="Review invoice"');
  });

});
