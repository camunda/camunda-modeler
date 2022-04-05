/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import FormLinter from '../FormLinter';

import camundaCloud10 from './camunda-cloud-1-0.json';
import camundaCloud10Errors from './camunda-cloud-1-0-errors.json';
import camundaCloud11 from './camunda-cloud-1-1.json';
import camundaCloud12 from './camunda-cloud-1-2.json';
import camundaCloud120 from './camunda-cloud-1-2-0.json';
import camundaCloud13 from './camunda-cloud-1-3.json';
import camundaCloud8 from './camunda-cloud-8.json';
import camundaPlatform715 from './camunda-platform-7-15.json';
import camundaPlatform715Errors from './camunda-platform-7-15-errors.json';
import camundaPlatform716 from './camunda-platform-7-16.json';
import camundaPlatform7160 from './camunda-platform-7-16-0.json';
import noEngineProfile from './no-engine-profile.json';


describe('FormLinter', function() {

  it('should lint (JSON string)', function() {

    // when
    const results = FormLinter.lint(JSON.stringify(camundaPlatform715));

    // then
    expect(results).to.exist;
    expect(results).to.be.empty;
  });


  it('should lint (JSON object)', function() {

    // when
    const results = FormLinter.lint(camundaPlatform715);

    // then
    expect(results).to.exist;
    expect(results).to.be.empty;
  });


  it('should not lint if no engine profile', function() {

    // when
    const results = FormLinter.lint(noEngineProfile);

    // then
    expect(results).to.exist;
    expect(results).to.be.empty;
  });


  [
    [ 'Camunda Platform 7.15', camundaPlatform715, camundaPlatform715Errors ],
    [ 'Camunda Platform 7.16', camundaPlatform716 ],
    [ 'Camunda Platform 7.16.0', camundaPlatform7160 ],
    [ 'Camunda Platform 8 (Zeebe 1.0)', camundaCloud10, camundaCloud10Errors ],
    [ 'Camunda Platform 8 (Zeebe 1.1)', camundaCloud11 ],
    [ 'Camunda Platform 8 (Zeebe 1.2)', camundaCloud12 ],
    [ 'Camunda Platform 8 (Zeebe 1.2)', camundaCloud120 ],
    [ 'Camunda Platform 8 (Zeebe 1.3)', camundaCloud13 ],
    [ 'Camunda Platform 8', camundaCloud8 ]
  ].forEach(([ engineProfile, noErrorsSchema, errorsSchema ]) => {

    describe(engineProfile, function() {

      it('should lint without errors', function() {

        // when
        const results = FormLinter.lint(noErrorsSchema);

        // then
        expect(results).to.exist;
        expect(results).to.be.empty;
      });


      errorsSchema && it('should lint with errors', function() {

        // when
        const results = FormLinter.lint(errorsSchema);

        // then
        expect(results).to.exist;
        expect(results).to.eql([
          {
            id: 'Field_3',
            label: 'Approved',
            message: `A <Checkbox> is not supported by ${ engineProfile }`,
            category: 'error'
          }
        ]);
      });

    });

  });

});
