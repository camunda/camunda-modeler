/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const path = require('path');

const chai = require('chai');
const sinonChai = require('sinon-chai');

chai.should();
chai.use(sinonChai);

const expect = chai.expect;

const createModeler = require('../helper/createModeler');

const diagramPaths = [
  path.join(__dirname, '../fixtures/bpmn/diagram.bpmn')
];

describe('Integration', function() {

  this.timeout(30000);

  let modeler;

  beforeEach(async () => {
    modeler = await createModeler(diagramPaths);
  });

  afterEach(async () => {
    await modeler.close();
  });


  it('should update label', async () => {

    // when
    await modeler.doubleClick('[data-element-id="StartEvent_1"]');

    await modeler.keys([ 'B', 'a', 'r', 'Enter' ]);

    await modeler.click('[title="Save diagram"]');

    // then
    const label = await modeler.getText('[data-element-id="StartEvent_1_label"] text tspan');

    expect(label).to.equal('StartEvent_1Bar');
  });


  it('should create diagram', async () => {

    // when
    await modeler.click('[title="Create diagram"]');

    // await modeler.click('[title="Create diagram"] + .dropdown item');

    // @pinussilvestrus: we need clear identifier
    await modeler.click('//*[@id="root"]/div/div/div[1]/div/ul/li[1]');

    const unsavedTab = await modeler.get('[title="unsaved"]');

    expect(unsavedTab).to.exist;
  });


  it.skip('a11y', async () => {

    // when
    const audit = await modeler.auditA11y();

    // then
    expect(audit.failed).to.be.false;
    expect(audit.results).to.be.empty;
  });
});
