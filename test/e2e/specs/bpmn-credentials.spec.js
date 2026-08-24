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
const fs = require('fs/promises');

const { test, expect } = require('../harness/test');
const { copyFixture } = require('../harness/files');

const Modeler = require('../pages/Modeler');

// The credential create / edit flow is gated on a live Camunda 8 cluster, which
// the offline e2e harness has none of. These specs therefore cover the offline
// contract: the chooser renders for a credential-enabled template and prompts to
// connect a cluster instead of offering the (unusable) create action.
test.describe('BPMN credentials chooser (Camunda 8)', function() {

  test('should render the credential chooser for a templated element', async function({ launch, tmp }) {

    // given
    const app = await launchWithTemplate(launch, tmp);

    // when
    await revealChooser(app);

    // then
    await expect(chooser(app)).toBeVisible();
  });


  test('should label the chooser from the template', async function({ launch, tmp }) {

    // given
    const app = await launchWithTemplate(launch, tmp);

    // when
    await revealChooser(app);

    // then
    await expect(chooser(app)).toContainText('E2E credential');
  });


  test('should prompt to connect a cluster when offline', async function({ launch, tmp }) {

    // given
    const app = await launchWithTemplate(launch, tmp);

    // when
    await revealChooser(app);

    // then
    await expect(unavailable(app)).toHaveText(/Connect to a Camunda 8 cluster/);
  });


  test('should disable the create action when offline', async function({ launch, tmp }) {

    // given
    const app = await launchWithTemplate(launch, tmp);

    // when
    await revealChooser(app);

    // then
    await expect(placeholder(app)).toBeDisabled();
  });

});


// helpers //////////

async function launchWithTemplate(launch, tmp) {
  const templatesDir = path.join(tmp, '.camunda', 'element-templates');

  await fs.mkdir(templatesDir, { recursive: true });
  await copyFixture('credentials-e2e-template.json', templatesDir);

  const file = await copyFixture('credentials-service-task.bpmn', tmp);

  return launch({ openFile: file });
}

async function revealChooser(app) {
  const modeler = new Modeler(app);

  await modeler.bpmnEditor.canvas().waitFor();

  await modeler.bpmnEditor.selectElement('ServiceTask_1');

  await modeler.propertiesPanel.waitForLoad();
  await modeler.propertiesPanel.openGroup('Authentication');
}

function chooser(app) {
  return app.page.locator('.bio-properties-panel-configuration-chooser');
}

function unavailable(app) {
  return app.page.locator('.bio-properties-panel-configuration-chooser .bio-properties-panel-description');
}

function placeholder(app) {
  return app.page.locator('.bio-properties-panel-configuration-chooser-card--placeholder');
}
