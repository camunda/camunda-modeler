/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { expect } from 'chai';

import sinon from 'sinon';

import {
  createFeelEvaluator,
  getFeelPlaygroundConfig
} from '../FeelPlaygroundConfig';


describe('FeelPlaygroundConfig', function() {

  describe('#getFeelPlaygroundConfig', function() {

    it('should disable evaluation without a connection', function() {

      // when
      const config = getFeelPlaygroundConfig(null);

      // then
      expect(config).to.eql({
        evaluationUnavailable: 'No Camunda connection.',
        onEvaluate: undefined
      });
    });


    it('should disable evaluation for an offline connection', function() {

      // when
      const config = getFeelPlaygroundConfig({
        connection: { id: 'cluster' },
        success: false
      });

      // then
      expect(config).to.eql({
        evaluationUnavailable: 'No Camunda connection.',
        onEvaluate: undefined
      });
    });


    it('should disable evaluation for an unsupported cluster', function() {

      // when
      const config = getFeelPlaygroundConfig({
        connection: { id: 'cluster' },
        response: { gatewayVersion: '8.8.0' },
        success: true
      });

      // then
      expect(config).to.eql({
        evaluationUnavailable: 'FEEL expression evaluation requires Camunda 8.9 or newer.',
        onEvaluate: undefined
      });
    });


    it('should enable evaluation for a supported cluster', function() {

      // when
      const config = getFeelPlaygroundConfig({
        connection: { id: 'cluster' },
        response: { gatewayVersion: '8.9.0' },
        success: true
      }, {});

      // then
      expect(config).to.include({ evaluationUnavailable: undefined });
      expect(config.onEvaluate).to.be.a('function');
    });
  });


  describe('#createFeelEvaluator', function() {

    it('should evaluate an expression', async function() {

      // given
      const zeebeApi = {
        evaluateExpression: sinon.stub().resolves({
          success: true,
          response: {
            result: 2,
            warnings: [ { message: 'Warning' } ]
          }
        })
      };
      const endpoint = { id: 'cluster' };
      const evaluate = createFeelEvaluator(zeebeApi, endpoint);

      // when
      const result = await evaluateExpression(evaluate);

      // then
      expect(result).to.eql({
        result: 2,
        warnings: [ { message: 'Warning' } ]
      });
      expect(zeebeApi.evaluateExpression).to.have.been.calledWithExactly(
        { endpoint },
        '=1 + 1',
        {}
      );
    });


    it('should default warnings', async function() {

      // given
      const zeebeApi = {
        evaluateExpression: sinon.stub().resolves({
          success: true,
          response: { result: 2 }
        })
      };
      const evaluate = createFeelEvaluator(zeebeApi, { id: 'cluster' });

      // when
      const result = await evaluateExpression(evaluate);

      // then
      expect(result).to.eql({ result: 2, warnings: [] });
    });


    it('should expose evaluation failure', async function() {

      // given
      const zeebeApi = {
        evaluateExpression: sinon.stub().resolves({
          success: false,
          reason: 'Evaluation failed'
        })
      };
      const evaluate = createFeelEvaluator(zeebeApi, { id: 'cluster' });

      // when
      const error = await getRejection(evaluateExpression(evaluate));

      // then
      expect(error).to.have.property('message', 'Evaluation failed');
    });


    it('should reject evaluation when already aborted', async function() {

      // given
      const zeebeApi = { evaluateExpression: sinon.stub() };
      const evaluate = createFeelEvaluator(zeebeApi, { id: 'cluster' });
      const controller = new AbortController();
      controller.abort();

      // when
      const error = await getRejection(evaluateExpression(evaluate, controller.signal));

      // then
      expect(error).to.have.property('name', 'AbortError');
      expect(zeebeApi.evaluateExpression).not.to.have.been.called;
    });


    it('should reject evaluation when aborted while pending', async function() {

      // given
      let resolveEvaluation;
      const zeebeApi = {
        evaluateExpression: sinon.stub().returns(new Promise(resolve => {
          resolveEvaluation = resolve;
        }))
      };
      const evaluate = createFeelEvaluator(zeebeApi, { id: 'cluster' });
      const controller = new AbortController();
      const evaluation = evaluateExpression(evaluate, controller.signal);

      // when
      controller.abort();
      resolveEvaluation({ success: true, response: { result: 2 } });
      const error = await getRejection(evaluation);

      // then
      expect(error).to.have.property('name', 'AbortError');
    });
  });
});


// helpers //////////

function evaluateExpression(evaluate, signal = new AbortController().signal) {
  return evaluate(
    { expression: '1 + 1', context: {} },
    { signal }
  );
}

async function getRejection(promise) {
  try {
    await promise;
  } catch (error) {
    return error;
  }

  throw new Error('Expected promise to reject');
}