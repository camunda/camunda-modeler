import { expect } from 'chai';

import { SCENARIOS } from '../index';

describe('copilot scenario schema', () => {

  SCENARIOS.forEach(scenario => {

    describe(`scenario "${ scenario.id }"`, () => {

      it('has required top-level fields', () => {
        expect(scenario).to.have.property('id').that.is.a('string').and.has.length.greaterThan(0);
        expect(scenario).to.have.property('chip').that.is.an('object');
        expect(scenario).to.have.property('steps').that.is.an('array').and.has.length.greaterThan(0);
        expect(scenario).to.have.property('resultXml').that.is.a('string').and.has.length.greaterThan(0);
      });

      it('has a chip with label and prompt', () => {
        expect(scenario.chip).to.have.property('label').that.is.a('string').and.has.length.greaterThan(0);
        expect(scenario.chip).to.have.property('prompt').that.is.a('string').and.has.length.greaterThan(0);
      });

      it('every step references an element that exists in resultXml', () => {
        scenario.steps.forEach(step => {
          expect(step).to.have.property('elementId').that.is.a('string');
          expect(scenario.resultXml).to.include(`id="${ step.elementId }"`);
        });
      });

      it('every step has narration and rationale', () => {
        scenario.steps.forEach(step => {
          expect(step).to.have.property('narration').that.is.a('string').and.has.length.greaterThan(0);
          expect(step).to.have.property('rationale').that.is.a('string').and.has.length.greaterThan(0);
        });
      });

      it('resultXml starts with BPMN definitions root', () => {
        expect(scenario.resultXml).to.match(/<bpmn:definitions/);
      });

    });

  });

});
