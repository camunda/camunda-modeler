/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import BpmnModdle from 'bpmn-moddle';

import modelerModdle from 'modeler-moddle/resources/modeler.json';
import zeebeModdle from 'zeebe-bpmn-moddle/resources/zeebe.json';

import CloudBpmnLinter from '../CloudBpmnLinter';

import camundaCloud10XML from './camunda-cloud-1-0.bpmn';
import camundaCloud10ErrorsXML from './camunda-cloud-1-0-errors.bpmn';
import camundaCloud11XML from './camunda-cloud-1-1.bpmn';
import camundaCloud12XML from './camunda-cloud-1-2.bpmn';
import camundaCloud13XML from './camunda-cloud-1-3.bpmn';
import camundaCloud14XML from './camunda-cloud-1-4.bpmn';
import noEngineProfileXML from './no-engine-profile.bpmn';


describe('CloudBpmnLinter', function() {

  it('should lint (XML string)', async function() {

    // when
    const results = await CloudBpmnLinter.lint(camundaCloud10XML);

    // then
    expect(results).to.exist;
    expect(results).to.be.empty;
  });


  it('should lint (moddle instance)', async function() {

    // when
    const definitions = await parseDefinitions(camundaCloud10XML);

    const results = await CloudBpmnLinter.lint(definitions);

    // then
    expect(results).to.exist;
    expect(results).to.be.empty;
  });


  it('should not lint if no engine profile', async function() {

    // when
    const results = await CloudBpmnLinter.lint(noEngineProfileXML);

    // then
    expect(results).to.exist;
    expect(results).to.be.empty;
  });


  [
    [ 'Camunda Cloud 1.0', camundaCloud10XML, camundaCloud10ErrorsXML ],
    [ 'Camunda Cloud 1.1', camundaCloud11XML ],
    [ 'Camunda Cloud 1.2', camundaCloud12XML ],
    [ 'Camunda Cloud 1.3', camundaCloud13XML ],
    [ 'Camunda Cloud 1.4', camundaCloud14XML ]
  ].forEach(([ engineProfile, noErrorsXML, errorsXML ]) => {

    describe(engineProfile, function() {

      it('should lint without errors', async function() {

        // when
        const results = await CloudBpmnLinter.lint(noErrorsXML);

        // then
        expect(results).to.exist;
        expect(results).to.be.empty;
      });


      errorsXML && it('should lint with errors', async function() {

        // when
        const results = await CloudBpmnLinter.lint(errorsXML);

        // then
        expect(results).to.exist;
        expect(results).to.eql([
          {
            id: 'Activity_1',
            message: `Element of type <bpmn:BusinessRuleTask> not supported by ${ engineProfile }`,
            category: 'error'
          }
        ]);
      });

    });

  });

});

async function parseDefinitions(xml) {
  const moddle = new BpmnModdle({
    modeler: modelerModdle,
    zeebe: zeebeModdle
  });

  const { rootElement } = await moddle.fromXML(xml);

  return rootElement;
}