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

const sinon = require('sinon');
const fs = require('fs');
const CamundaClientFactory = require('../../../lib/zeebe-api/camunda-client-factory');
const {
  ENDPOINT_TYPES
} = require('../../../lib/zeebe-api/constants');

const { setupPlatformStub } = require('./helper');

describe('CamundaClientFactory', function() {

  // TODO(barmac): remove when system keychain certificates are tested
  setupPlatformStub();

  let Camunda8, flags, log, clients;
  let mockCamundaClient, mockZeebeClient, mockRestClient;

  beforeEach(function() {


    mockZeebeClient = {
      topology: sinon.stub()
    };

    mockRestClient = {
      getTopology: sinon.stub()
    };

    mockCamundaClient = {
      getZeebeGrpcApiClient: sinon.stub().returns(mockZeebeClient),
      getCamundaRestClient: sinon.stub().returns(mockRestClient),
      closeAllClients: sinon.stub()
    };

    Camunda8 = sinon.stub().returns(mockCamundaClient);

    flags = {
      get: sinon.stub()
    };

    log = {
      debug: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub()
    };

    clients = new CamundaClientFactory(fs, Camunda8, flags, log);
  });

  afterEach(function() {

    // Reset instance state to prevent test bleed
    clients._protocol = 'rest';
    clients._camundaClient = null;
    clients._endpoint = undefined;
    clients._cachedEndpoint = undefined;

    // Only restore specific stubs, not all of sinon
    // sinon.restore() affects other tests globally
  });

  describe('#_determineProtocol', function() {

    it('should use pattern protocol for Camunda SaaS endpoints (gRPC)', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
        url: 'https://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.reg-1.zeebe.camunda.io'
      };

      // when
      const protocol = await clients._determineProtocol(endpoint);

      // then
      expect(protocol).to.equal('grpcs');
    });


    it('should use pattern protocol for Camunda SaaS endpoints (REST)', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
        url: 'https://reg-1.zeebe.camunda.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
      };

      // when
      const protocol = await clients._determineProtocol(endpoint);

      // then
      expect(protocol).to.equal('https');
    });


    it('should respect explicit gRPC protocol in URL', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'grpcs://localhost:26500'
      };

      // when
      const protocol = await clients._determineProtocol(endpoint);

      // then
      expect(protocol).to.equal('grpcs');
    });


    it('should fallback to gRPC', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'http://localhost:25600'
      };
      mockRestClient.getTopology.rejects(new Error('Connection failed'));

      // when
      const protocol = await clients._determineProtocol(endpoint);

      // then
      expect(protocol).to.equal('grpc');
    });


    it('should use gRPCs for https URLs', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'https://localhost:8080'
      };
      mockRestClient.getTopology.rejects(new Error('Connection failed'));

      // when
      const protocol = await clients._determineProtocol(endpoint);

      // then
      expect(protocol).to.equal('grpcs');
    });

    it('should handle connection timeout gracefully with protocol detection enabled', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'http://localhost:8080'
      };

      // Mock slow gRPC connection that should timeout
      mockZeebeClient.topology.returns(new Promise(() => {})); // Never resolves

      // when
      const protocol = await clients._determineProtocol(endpoint);

      // then - should fall back to HTTP when gRPC times out
      expect(protocol).to.equal('http');
    });

  });

  describe('#_testProtocol', function() {

    it('should return true when gRPC connection succeeds', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'http://localhost:8080'
      };

      mockZeebeClient.topology.resolves({ brokers: [] });

      // when
      const result = await clients._testProtocol(endpoint, 'grpc');

      // then
      expect(result).to.be.true;
      expect(mockCamundaClient.closeAllClients).to.have.been.called;
    });

    it('should return true when REST connection succeeds', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'http://localhost:8080'
      };

      mockRestClient.getTopology.resolves({ brokers: [] });

      // when
      const result = await clients._testProtocol(endpoint, 'http');

      // then
      expect(result).to.be.true;
      expect(mockCamundaClient.closeAllClients).to.have.been.called;
    });

    it('should return false when connection fails', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'http://localhost:8080'
      };

      mockZeebeClient.topology.rejects(new Error('Connection failed'));

      // when
      const result = await clients._testProtocol(endpoint, 'grpc');

      // then
      expect(result).to.be.false;
    });

  });


  describe('#getSupportedCamundaClients', function() {

    beforeEach(function() {
      sinon.stub(clients, '_determineProtocol');
    });



    it('should return gRPC client when protocol is determined to be gRPC', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'http://localhost:26500'
      };

      clients._determineProtocol.resolves('grpc');

      // when
      const result = await clients.getSupportedCamundaClients(endpoint);

      // then
      expect(result).to.deep.equal({
        zeebeGrpcClient: mockZeebeClient
      });
    });


    it('should return REST client when protocol is determined to be http', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'grpc://localhost:8080'
      };

      clients._determineProtocol.resolves('http');

      // when
      const result = await clients.getSupportedCamundaClients(endpoint);

      // then
      expect(result).to.deep.equal({
        camundaRestClient: mockRestClient
      });
    });


    it('should return gRPC client when protocol is gRPCs', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'grpcs://localhost:26500'
      };

      clients._determineProtocol.resolves('grpcs');

      // when
      const result = await clients.getSupportedCamundaClients(endpoint);

      // then
      expect(result).to.deep.equal({
        zeebeGrpcClient: mockZeebeClient
      });
    });


    it('should set the determined protocol on the instance', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'http://localhost:8080'
      };

      clients._determineProtocol.resolves('grpc');

      // when
      await clients.getSupportedCamundaClients(endpoint);

      // then
      expect(clients._protocol).to.equal('grpc');
    });

  });


  describe('Integration scenarios', function() {

    it('should handle gRPC URL with explicit protocol', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'grpc://localhost:26500'
      };

      // when
      const result = await clients.getSupportedCamundaClients(endpoint);

      // then
      expect(result.zeebeGrpcClient).to.exist;
      expect(result.camundaRestClient).to.not.exist;
      expect(clients._protocol).to.equal('grpc');
    });


    it('should fallback to gRPC', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'http://localhost:8080'
      };
      mockRestClient.getTopology.rejects(new Error('Connection failed'));


      // when
      const result = await clients.getSupportedCamundaClients(endpoint);

      // then
      expect(clients._protocol).to.equal('grpc');
      expect(result.camundaRestClient).to.not.exist;
      expect(result.zeebeGrpcClient).to.exist;
    });


    it('should use rest if available', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'https://localhost:8080'
      };
      mockRestClient.getTopology.resolves({ brokers: [] });

      // when
      const result = await clients.getSupportedCamundaClients(endpoint);

      // then
      expect(clients._protocol).to.equal('https');
      expect(result.camundaRestClient).to.exist;
      expect(result.zeebeGrpcClient).to.not.exist;
    });

  });

});