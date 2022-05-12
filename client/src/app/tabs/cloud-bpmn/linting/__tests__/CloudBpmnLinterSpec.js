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

import camundaCloud10ValidXML from './camunda-cloud-1-0-valid.bpmn';
import camundaCloud10InvalidXML from './camunda-cloud-1-0-invalid.bpmn';
import camundaCloud11ValidXML from './camunda-cloud-1-1-valid.bpmn';
import camundaCloud11InvalidXML from './camunda-cloud-1-1-invalid.bpmn';
import camundaCloud12ValidXML from './camunda-cloud-1-2-valid.bpmn';
import camundaCloud12InvalidXML from './camunda-cloud-1-2-invalid.bpmn';
import camundaCloud13ValidXML from './camunda-cloud-1-3-valid.bpmn';
import camundaCloud13InvalidXML from './camunda-cloud-1-3-invalid.bpmn';
import camundaCloud80ValidXML from './camunda-cloud-8-0-valid.bpmn';
import camundaCloud80InvalidXML from './camunda-cloud-8-0-invalid.bpmn';
import noEngineProfileXML from './no-engine-profile.bpmn';


describe('CloudBpmnLinter', function() {

  it('should lint (XML string)', async function() {

    // when
    const results = await CloudBpmnLinter.lint(camundaCloud10ValidXML);

    // then
    expect(results).to.exist;
    expect(results).to.be.empty;
  });


  it('should lint (moddle instance)', async function() {

    // when
    const definitions = await parseDefinitions(camundaCloud10ValidXML);

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
    [ 'Camunda Platform 8 (Zeebe 1.0)', camundaCloud10ValidXML, camundaCloud10InvalidXML ],
    [ 'Camunda Platform 8 (Zeebe 1.1)', camundaCloud11ValidXML, camundaCloud11InvalidXML ],
    [ 'Camunda Platform 8 (Zeebe 1.2)', camundaCloud12ValidXML, camundaCloud12InvalidXML ],
    [ 'Camunda Platform 8 (Zeebe 1.3)', camundaCloud13ValidXML, camundaCloud13InvalidXML ],
    [ 'Camunda Platform 8', camundaCloud80ValidXML, camundaCloud80InvalidXML ]
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
        expect(results).not.to.be.empty;
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