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

    it('should wait while the connection is being resolved', function() {

      // when
      const config = getFeelPlaygroundConfig(null);

      // then
      expect(config).to.eql({
        evaluationUnavailable: {
          title: 'Loading connection',
          message: 'Resolving the Camunda connection for this file.',
          action: undefined
        },
        onEvaluate: undefined
      });
    });


    it('should disable evaluation for a failed connection check', function() {

      // when
      const config = getFeelPlaygroundConfig({
        connection: { id: 'cluster' },
        success: false
      });

      // then
      expect(config.onEvaluate).not.to.exist;
      expect(config.evaluationUnavailable).to.include({
        title: 'Connection check failed',
        message: 'Check the connection settings and cluster status.'
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
      expect(config.onEvaluate).not.to.exist;
      expect(config.evaluationUnavailable).to.include({
        title: 'Camunda 8.9 or newer required',
        message: 'Connected to Camunda 8.8.0. Select a newer cluster to evaluate expressions.'
      });
    });


    it('should disable evaluation for a gRPC connection', function() {

      // when
      const config = getFeelPlaygroundConfig({
        connection: { id: 'cluster' },
        response: {
          gatewayVersion: '8.9.0',
          protocol: 'grpc'
        },
        success: true
      });

      // then
      expect(config.onEvaluate).not.to.exist;
      expect(config.evaluationUnavailable).to.include({
        title: 'REST connection required',
        message: 'This connection uses gRPC. Select a REST connection to Camunda 8.9 or newer.'
      });
    });


    it('should disable evaluation if the cluster version is unavailable', function() {

      // when
      const config = getFeelPlaygroundConfig({
        connection: { id: 'cluster' },
        success: true
      });

      // then
      expect(config.onEvaluate).not.to.exist;
      expect(config.evaluationUnavailable).to.include({
        title: 'Camunda version unavailable',
        message: 'Check the connection; evaluation requires Camunda 8.9 or newer.'
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


    it('should wait while a selected connection is being checked', function() {

      // when
      const config = getFeelPlaygroundConfig({ connection: { id: 'cluster' } });

      // then
      expect(config).to.eql({
        evaluationUnavailable: {
          title: 'Checking connection',
          message: 'Waiting for the Camunda connection check to finish.',
          action: undefined
        },
        onEvaluate: undefined
      });
    });


    [
      [ 'offline mode', { connection: { id: 'NO_CONNECTION' } }, 'Offline mode' ],
      [ 'no configuration', { reason: 'NO_CONFIG', success: false }, 'No connection selected' ],
      [ 'missing connection ID', { success: true, response: { gatewayVersion: '8.9.0' } }, 'No connection selected' ]
    ].forEach(([ name, status, title ]) => {
      it(`should explain ${ name } and offer connection selection`, function() {

        // given
        const onConfigureConnection = sinon.spy();

        // when
        const config = getFeelPlaygroundConfig(status, {}, onConfigureConnection);

        // then
        expect(config).to.eql({
          evaluationUnavailable: {
            title,
            message: 'Select a Camunda connection to evaluate expressions.',
            action: { label: 'Select connection', onClick: onConfigureConnection }
          },
          onEvaluate: undefined,
        });
      });
    });


    [
      [ 'CONTACT_POINT_UNAVAILABLE', 'Cannot reach Camunda', 'Check the cluster URL and your network connection.' ],
      [ 'CLUSTER_UNAVAILABLE', 'Cannot reach Camunda', 'Check the cluster URL and your network connection.' ],
      [ 'CLUSTER_TEMPORARILY_UNAVAILABLE', 'Camunda is temporarily unavailable', 'The cluster may be paused or starting up. Wait for it to become available, or select another connection.' ],
      [ 'UNAUTHORIZED', 'Credentials rejected', 'Check the connection credentials.' ],
      [ 'FORBIDDEN', 'Access denied', 'Ask your administrator to grant access, or use different credentials.' ],
      [ 'OAUTH_URL', 'Cannot reach the OAuth endpoint', 'Check the OAuth URL and your network connection.' ],
      [ 'INVALID_CLIENT_ID', 'Invalid client ID', 'Check the client ID in your connection settings.' ],
      [ 'INVALID_CREDENTIALS', 'Invalid client secret', 'Check the client ID and secret in your connection settings.' ],
      [ 'INVALID_CONFIGURATION', 'Invalid connection configuration', 'Review the required fields in your connection settings.' ],
      [ 'UNSUPPORTED_ENGINE', 'Unsupported Camunda version', 'Select a REST connection to Camunda 8.9 or newer.' ],
      [ 'UNKNOWN', 'Connection check failed', 'Check the connection settings and cluster status.' ],
      [ 'NEW_REASON', 'Connection check failed', 'Check the connection settings and cluster status.' ]
    ].forEach(([ reason, title, message ]) => {
      it(`should explain ${ reason } and offer connection configuration`, function() {

        // given
        const onConfigureConnection = sinon.spy();

        // when
        const config = getFeelPlaygroundConfig({
          connection: { id: 'cluster' },
          success: false,
          reason
        }, {}, onConfigureConnection);

        // then
        expect(config.onEvaluate).not.to.exist;
        expect(config.evaluationUnavailable).to.include({ title, message });
        expect(config.evaluationUnavailable.action.onClick).to.equal(onConfigureConnection);
        expect(config.evaluationUnavailable.action.label).to.be.a('string');
      });
    });


    it('should suggest starting an unreachable local Camunda 8 Run', function() {

      // when
      const config = getFeelPlaygroundConfig({
        connection: { id: 'local', name: 'c8run (local)', contactPoint: 'http://localhost:8080/v2' },
        success: false,
        reason: 'CONTACT_POINT_UNAVAILABLE'
      });

      // then
      expect(config.onEvaluate).not.to.exist;
      expect(config.evaluationUnavailable).to.include({
        title: 'Cannot reach local Camunda 8 Run',
        message: 'Start Camunda 8 Run, then check the connection.'
      });
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
      expect(error).to.have.property('message', 'Failed to evaluate expression. Reason: evaluation failed');
    });


    it('should expose unknown evaluation failure', async function() {

      // given
      const zeebeApi = {
        evaluateExpression: sinon.stub().resolves({
          success: false,
          reason: 'UNKNOWN'
        })
      };
      const evaluate = createFeelEvaluator(zeebeApi, { id: 'cluster' });

      // when
      const error = await getRejection(evaluateExpression(evaluate));

      // then
      expect(error).to.have.property('message', 'Failed to evaluate expression. Reason: unknown');
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