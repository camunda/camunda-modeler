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

test.describe('problems panel (linting)', function() {

  test('should report missing implementation details for a Camunda 8 diagram', async function({ launch, tmp }) {

    // given a C8 service task with no task definition
    const app = await launch({ openFile: await copyFixture('service-task.bpmn', tmp) });

    const problems = new Modeler(app).problemsPanel;

    await app.page.waitForSelector('.djs-container');

    // when opening the problems panel
    await problems.open();

    // then an error points at the missing implementation
    await expect(problems.errors().first()).toContainText('Task definition type');
  });


  test('should report missing History Time To Live for a Camunda 7 diagram', async function({ launch, tmp }) {

    // given a C7 executable process without historyTimeToLive
    const app = await launch({ openFile: await copyFixture('c7-no-httl.bpmn', tmp) });

    const problems = new Modeler(app).problemsPanel;

    await app.page.waitForSelector('.djs-container');

    // when opening the problems panel
    await problems.open();

    // then a problem points at the missing historyTimeToLive
    await expect(problems.items().filter({ hasText: 'historyTimeToLive' }))
      .toHaveCount(1);
  });

});
