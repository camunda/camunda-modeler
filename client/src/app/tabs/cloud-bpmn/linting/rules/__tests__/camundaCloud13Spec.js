/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import BpmnLinter from '../../BpmnLinter';

import { parseDefinitions } from './Util';

import camundaCloud13AllXML from './camunda-cloud-1-3-all.bpmn';
import camundaCloud13ErrorXML from './camunda-cloud-1-3-error.bpmn';


describe('Camunda Cloud 1.3 BPMN Linting Rules', function() {

  it('should support all BPMN elements', async function() {

    // when
    const definitions = await parseDefinitions(camundaCloud13AllXML);

    const results = await BpmnLinter.lint(definitions);

    // then
    expect(results).to.exist;
    expect(results).to.be.empty;
  });


  it('should not support all BPMN elements', async function() {

    // when
    const definitions = await parseDefinitions(camundaCloud13ErrorXML);

    const results = await BpmnLinter.lint(definitions);

    // then
    expect(results).to.exist;
    expect(results).to.have.length(1);
  });

});