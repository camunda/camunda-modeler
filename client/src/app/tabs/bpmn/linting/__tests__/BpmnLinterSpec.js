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
import camundaModdle from 'camunda-bpmn-moddle/resources/camunda.json';

import BpmnLinter from '../BpmnLinter';

import camundaPlatform715 from './camunda-platform-7-15.bpmn';
import camundaPlatform716 from './camunda-platform-7-16.bpmn';
import camundaPlatform717 from './camunda-platform-7-17.bpmn';
import noEngineProfile from './no-engine-profile.bpmn';


describe('BpmnLinter', function() {

  it('should lint (XML string)', function() {

    // when
    const results = BpmnLinter.lint(camundaPlatform715);

    // then
    expect(results).to.exist;
    expect(results).to.be.empty;
  });


  it('should lint (object)', async function() {

    // when
    const definitions = await parseDefinitions(camundaPlatform715);

    const results = await BpmnLinter.lint(definitions);

    // then
    expect(results).to.exist;
    expect(results).to.be.empty;
  });


  it('should not lint if no engine profile', function() {

    // when
    const results = BpmnLinter.lint(noEngineProfile);

    // then
    expect(results).to.exist;
    expect(results).to.be.empty;
  });


  [
    [ 'Camunda Platform 7.15', camundaPlatform715 ],
    [ 'Camunda Platform 7.16', camundaPlatform716 ],
    [ 'Camunda Platform 7.16', camundaPlatform717 ]
  ].forEach(([ engineProfile, noErrorsSchema ]) => {

    describe(engineProfile, function() {

      it('should lint without errors', function() {

        // when
        const results = BpmnLinter.lint(noErrorsSchema);

        // then
        expect(results).to.exist;
        expect(results).to.be.empty;
      });

    });

  });

});

async function parseDefinitions(xml) {
  const moddle = new BpmnModdle({
    modeler: modelerModdle,
    camunda: camundaModdle
  });

  const { rootElement } = await moddle.fromXML(xml);

  return rootElement;
}