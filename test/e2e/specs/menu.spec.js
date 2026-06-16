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
const { copyFixture } = require('../harness/files');

const Modeler = require('../pages/Modeler');

// the version the app reports (Help > "Version x.y.z" / about menu)
const APP_VERSION = require('../../../app/package.json').version;

test.describe('application menu', function() {

  test('should show the correct app version', async function({ launch }) {

    const app = await launch({});

    const labels = await app.menuLabels();

    expect(labels).toContain(`Version ${ APP_VERSION }`);
  });


  test('should enable Undo only after an edit', async function({ launch, tmp }) {

    // given a freshly opened diagram with no edit history
    const app = await launch({ openFile: await copyFixture('service-task.bpmn', tmp) });

    const modeler = new Modeler(app);
    const editor = modeler.bpmnEditor;
    const panel = modeler.propertiesPanel;

    await editor.canvas().waitFor();

    // then "Undo" is disabled (nothing to undo)
    expect((await app.menuItem('Undo')).enabled).toBe(false);

    // when the diagram is edited
    await editor.selectElement('ServiceTask_1');
    await panel.waitForLoad();
    await panel.openGroup('Task definition');
    await panel.setText('taskDefinitionType', 'check-order');

    // then "Undo" becomes enabled (menu state updates asynchronously)
    await expect.poll(async () => (await app.menuItem('Undo')).enabled, { timeout: 5000 })
      .toBe(true);
  });

});
