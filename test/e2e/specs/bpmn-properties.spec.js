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

const { test, expect } = require('../harness/test');
const { copyFixture, readFile, expectFileContains } = require('../harness/files');

const Modeler = require('../pages/Modeler');

test.describe('BPMN properties panel (Camunda 8)', function() {

  test('should configure a service task via the properties panel', async function({ launch, tmp }) {

    // given
    const file = await copyFixture('service-task.bpmn', tmp);

    const app = await launch({ openFile: file });

    const modeler = new Modeler(app);
    const editor = modeler.bpmnEditor;
    const panel = modeler.propertiesPanel;

    await editor.canvas().waitFor();

    // when
    await app.step('configure service task', async () => {
      await editor.selectElement('ServiceTask_1');

      await panel.waitForLoad();

      // task definition: job type
      await panel.openGroup('Task definition');
      await panel.setText('taskDefinitionType', 'check-order');

      // an input mapping (adding a list item expands the group).
      await panel.addListItem('Input mapping');
      await panel.openListItem('ServiceTask_1-input-0');
      await panel.setFeel('ServiceTask_1-input-0-source', 'order.id');
      await panel.setText('ServiceTask_1-input-0-target', 'orderId');
    });

    // then
    await app.step('save and verify zeebe extensions in XML', async () => {

      await expect.poll(async () => {
        await app.shortcut('CommandOrControl+S');

        return readFile(file);
      }, { timeout: 10000 }).toContain('source="=order.id"');

      const xml = await readFile(file);

      expect(xml).toContain('zeebe:taskDefinition');
      expect(xml).toContain('type="check-order"');
      expect(xml).toContain('zeebe:ioMapping');
      expect(xml).toContain('target="orderId"');
    });
  });


  test('should add an execution listener via the properties panel', async function({ launch, tmp }) {

    // given
    const file = await copyFixture('service-task.bpmn', tmp);

    const app = await launch({ openFile: file });

    const modeler = new Modeler(app);
    const editor = modeler.bpmnEditor;
    const panel = modeler.propertiesPanel;

    await editor.canvas().waitFor();

    // when adding a start execution listener with a job type
    await app.step('add an execution listener', async () => {
      await editor.selectElement('ServiceTask_1');

      await panel.waitForLoad();

      // adding a list item expands the "Execution listeners" group
      await panel.addListItem('Execution listeners');
      await panel.selectOption('ServiceTask_1-executionListener-0-eventType', 'start');
      await panel.setText('ServiceTask_1-executionListener-0-listenerType', 'cleanup-job');
    });

    // then the listener is persisted as a zeebe extension
    await app.step('save and verify the listener in XML', async () => {
      await app.shortcut('CommandOrControl+S');

      await expectFileContains(file, 'zeebe:executionListeners');

      const xml = await readFile(file);

      expect(xml).toContain('<zeebe:executionListener');
      expect(xml).toContain('eventType="start"');
      expect(xml).toContain('type="cleanup-job"');
    });
  });

});

test.describe('BPMN properties panel (Camunda 7)', function() {

  test('should configure job execution (asyncBefore + retry time cycle)', async function({ launch, tmp }) {

    // given a Camunda 7 service task
    const file = await copyFixture('c7-service-task.bpmn', tmp);

    const app = await launch({ openFile: file });

    const modeler = new Modeler(app);
    const editor = modeler.bpmnEditor;
    const panel = modeler.propertiesPanel;

    await editor.canvas().waitFor();

    // when enabling asynchronous-before and setting a retry time cycle (the
    // "Job execution" group appears once a continuation is asynchronous)
    await app.step('enable asyncBefore and set a retry time cycle', async () => {
      await editor.selectElement('ServiceTask_1');

      await panel.waitForLoad();
      await panel.openGroup('Asynchronous continuations');
      await panel.setCheckbox('asynchronousContinuationBefore', true);

      await panel.openGroup('Job execution');
      await panel.setText('retryTimeCycle', 'R3/PT10M');
    });

    // then both are persisted as Camunda 7 extensions
    await app.step('save and verify the job-execution config in XML', async () => {
      await app.shortcut('CommandOrControl+S');

      await expectFileContains(file, 'R3/PT10M');

      const xml = await readFile(file);

      expect(xml).toContain('camunda:asyncBefore="true"');
      expect(xml).toContain('<camunda:failedJobRetryTimeCycle>R3/PT10M</camunda:failedJobRetryTimeCycle>');
    });
  });

});
