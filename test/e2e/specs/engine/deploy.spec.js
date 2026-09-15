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

test.describe('deployment', function() {

  test('deploys a BPMN file', async function({ launch, tmp }) {
    const file = await copyFixture('deploy/invoice.bpmn', tmp);

    const app = await launch({ openFile: file, connectToEngine: true });

    await app.page.waitForSelector('.djs-container');

    const deployment = new DeploymentPage(app.page);

    await deployment.openDeployment();

    await deployment.submit('Deploy BPMN');

    const notification = deployment.notification('Process definition deployed');

    await expect(notification).toBeVisible();
    await expect(notification).toContainText('invoice.bpmn');

    // the link is built from the gateway's deployment response, so a correct
    // process id and version prove the deployment record came back
    const params = await deployment.operateLinkParams('Process definition deployed');

    expect(params.get('process')).toBe('invoice-process');

    // the cluster is reused across runs, so every redeploy bumps the version;
    // only its presence is stable
    expect(Number(params.get('version'))).toBeGreaterThanOrEqual(1);
  });


  test('deploys a DMN file', async function({ launch, tmp }) {
    const file = await copyFixture('deploy/invoice.dmn', tmp);

    const app = await launch({ openFile: file, connectToEngine: true });

    await app.page.waitForSelector('.djs-container');

    const deployment = new DeploymentPage(app.page);

    await deployment.openDeployment();

    await deployment.submit('Deploy DMN');

    const notification = deployment.notification('Decision requirements definition deployed');

    await expect(notification).toBeVisible();
    await expect(notification).toContainText('invoice.dmn');

    // one link per decision in the DRD, keyed on the decision id rather than
    // the process id the BPMN notification carries
    const params = await deployment.operateLinkParams('Decision requirements definition deployed');

    expect(params.get('name')).toBe('invoice-classification');

    expect(Number(params.get('version'))).toBeGreaterThanOrEqual(1);
  });


  test('deploys a form file', async function({ launch, tmp }) {
    const file = await copyFixture('deploy/invoice.form', tmp);

    const app = await launch({ openFile: file, connectToEngine: true });

    await app.page.waitForSelector('.fjs-container');

    const deployment = new DeploymentPage(app.page);

    await deployment.openDeployment();

    await deployment.submit('Deploy Form');

    const notification = deployment.notification('Form definition deployed');

    await expect(notification).toBeVisible();
    await expect(notification).toContainText('invoice.form');

    // forms have no Operate representation, so no link is offered
    await expect(deployment.operateLink('Form definition deployed')).toHaveCount(0);
  });


  test('deploys a process application', async function({ launch, tmp }) {
    const dir = await copyFixtureDir('deploy/process-application', tmp);

    const app = await launch({
      openFile: path.join(dir, 'invoice.bpmn'),
      connectToEngine: true
    });

    await app.page.waitForSelector('.djs-container');

    const deployment = new DeploymentPage(app.page);

    await deployment.openProcessApplicationDeployment();

    // the form is deployed although its tab was never opened: resources come
    // from the indexed process application, not from the open tabs
    await deployment.expectResourceCount(2);

    await deployment.submit('Deploy process application');

    const notification = deployment.notification('Process application deployed');

    await expect(notification).toBeVisible();
    await expect(notification).toContainText('invoice.bpmn');
    await expect(notification).toContainText('and 1 additional file deployed');
  });

});
