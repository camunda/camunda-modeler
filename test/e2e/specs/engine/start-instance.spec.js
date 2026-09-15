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

const { test, expect } = require('../../harness/test');
const { copyFixture, copyFixtureDir } = require('../../harness/files');
const { DeploymentPage } = require('../../pages/DeploymentPage');

// Starting an instance deploys and starts in one step: `StartInstancePluginOverlay`
// renders only the start instance form, ignoring the `renderDeployment*` props
// both plugins pass it. The instance halts at the user task, so it stays active
// and the Operate link resolves to something real.
test.describe('start instance', function() {

  test('starts an instance from a file', async function({ launch, tmp }) {
    const file = await copyFixture('deploy/invoice.bpmn', tmp);

    const app = await launch({ openFile: file, connectToEngine: true });

    await app.page.waitForSelector('.djs-container');

    const deployment = new DeploymentPage(app.page);

    await deployment.openStartInstance();

    await deployment.submit('Start BPMN process instance');

    const notification = deployment.notification('Process instance started');

    await expect(notification).toBeVisible();
    await expect(notification).toContainText('invoice.bpmn');

    await expect(deployment.operateLink('Process instance started')).toBeVisible();
  });


  test('starts an instance from a process application', async function({ launch, tmp }) {
    const dir = await copyFixtureDir('deploy/process-application', tmp);

    const app = await launch({
      openFile: path.join(dir, 'invoice.bpmn'),
      connectToEngine: true
    });

    await app.page.waitForSelector('.djs-container');

    const deployment = new DeploymentPage(app.page);

    // this control is only mounted once the process application is open, so
    // clicking it is itself the gate on the file context indexer. How many
    // resources get deployed is the deployment spec's subject.
    await deployment.openProcessApplicationStartInstance();

    await deployment.submit('Start BPMN process instance');

    const notification = deployment.notification('Process instance started');

    await expect(notification).toBeVisible();

    await expect(deployment.operateLink('Process instance started')).toBeVisible();
  });

});
