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
const { copyFixture, readFile, expectFileExists } = require('../harness/files');

const Modeler = require('../pages/Modeler');

test.describe('version chooser', function() {

  test('should change the execution platform version', async function({ launch, tmp }) {

    // given
    const file = await copyFixture('service-task.bpmn', tmp);

    const app = await launch({ openFile: file });

    const engine = new Modeler(app).engineProfile;

    await app.page.waitForSelector('.djs-container');

    // when
    await app.step('select Camunda 8.4', () => engine.setVersion('8.4'));

    // then the status bar reflects the new version
    await expect(engine.button()).toHaveText(/Camunda 8\.4/);

    // and it persists to the file
    await app.step('save and verify version in XML', async () => {
      const output = path.join(tmp, 'output.bpmn');

      await app.expectSaveDialog(output);
      await app.shortcut('CommandOrControl+Shift+S');

      await expectFileExists(output);
      expect(await readFile(output)).toContain('executionPlatformVersion="8.4');
    });
  });


  test('should validate against the selected version', async function({ launch, tmp }) {

    // given a service task that uses execution listeners (an 8.6 feature),
    // opened at a version that supports them (8.6)
    const app = await launch({ openFile: await copyFixture('service-task-listener.bpmn', tmp) });

    const modeler = new Modeler(app);
    const engine = modeler.engineProfile;
    const problems = modeler.problemsPanel;

    await app.page.waitForSelector('.djs-container');

    // then there is no version problem at the supported version
    await app.step('no version problem at 8.6', async () => {
      await problems.open();

      await expect(problems.items().filter({ hasText: 'Execution listeners' }))
        .toHaveCount(0);
    });

    // when downgrading to a version that predates execution listeners
    await app.step('select Camunda 8.4', () => engine.setVersion('8.4'));

    // then linting flags the feature as unsupported by the selected version
    await app.step('the feature is flagged as unsupported at 8.4', async () => {
      await expect(problems.items().filter({ hasText: 'Execution listeners' }).first())
        .toContainText('only supported by Camunda 8.6 or newer');
    });
  });


  test('should select a version and validate a Camunda 7 diagram', async function({ launch, tmp }) {

    // given a Camunda 7 diagram missing its history time to live
    const app = await launch({ openFile: await copyFixture('c7-no-httl.bpmn', tmp) });

    const modeler = new Modeler(app);
    const engine = modeler.engineProfile;
    const problems = modeler.problemsPanel;

    await app.page.waitForSelector('.djs-container');

    // when selecting a Camunda 7 version
    await app.step('select Camunda 7.20', () => engine.setVersion('7.20'));

    await expect(engine.button()).toHaveText(/Camunda 7\.20/);

    // then linting validates the diagram against Camunda 7 rules
    await app.step('verify the C7 validation problem', async () => {
      await problems.open();

      await expect(problems.items().filter({ hasText: 'historyTimeToLive' }))
        .toHaveCount(1);
    });
  });

});
