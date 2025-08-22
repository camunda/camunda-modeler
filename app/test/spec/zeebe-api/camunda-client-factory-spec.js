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
    clients._cachedProtocol = 'rest';
    clients._cachedClient = null;
    clients._cachedEndpoint = undefined;

    // Only restore specific stubs, not all of sinon
    // sinon.restore() affects other tests globally
  });

  describe('#_getProtocol', function() {

    it('should detect gRPC protocol for SaaS URLs', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
        url: 'https://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.reg-1.zeebe.camunda.io'
      };

      // when
      const protocol = await clients._getProtocol(endpoint);

      // then
      expect(protocol).to.equal('grpcs');
    });


    it('should detect REST protocol for SaaS URLs', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
        url: 'https://reg-1.zeebe.camunda.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
      };

      // when
      const protocol = await clients._getProtocol(endpoint);

      // then
      expect(protocol).to.equal('https');
    });


    it('should detect gRPC protocol in Self-Managed gRPC URL', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'grpcs://localhost:26500'
      };

      // when
      const protocol = await clients._getProtocol(endpoint);

      // then
      expect(protocol).to.equal('grpcs');
    });


    it('should fallback to gRPC for Self-Managed HTTP URLs when REST connection fails', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'http://localhost:25600'
      };
      mockRestClient.getTopology.rejects(new Error('Connection failed'));

      // when
      const protocol = await clients._getProtocol(endpoint);

      // then
      expect(protocol).to.equal('grpc');
    });


    it('should fallback to secure gRPC for Self-Managed HTTPS URLs when REST fails', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'https://localhost:8080'
      };
      mockRestClient.getTopology.rejects(new Error('Connection failed'));

      // when
      const protocol = await clients._getProtocol(endpoint);

      // then
      expect(protocol).to.equal('grpcs');
    });


    it('should handle connection timeout gracefully with protocol detection', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'http://localhost:8080'
      };

      // Mock slow gRPC connection that should timeout
      mockZeebeClient.topology.returns(new Promise(() => {})); // Never resolves

      // when
      const protocol = await clients._getProtocol(endpoint);

      // then - should fall back to HTTP when gRPC times out
      expect(protocol).to.equal('http');
    });

  });


  describe('#_canConnectWithProtocol', function() {

    it('should return true when gRPC topology call succeeds', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'http://localhost:8080'
      };

      mockZeebeClient.topology.resolves({ brokers: [] });

      // when
      const result = await clients._canConnectWithProtocol(endpoint, 'grpc');

      // then
      expect(result).to.be.true;
      expect(mockCamundaClient.closeAllClients).to.have.been.called;
    });


    it('should return true when REST topology call succeeds', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'http://localhost:8080'
      };

      mockRestClient.getTopology.resolves({ brokers: [] });

      // when
      const result = await clients._canConnectWithProtocol(endpoint, 'http');

      // then
      expect(result).to.be.true;
      expect(mockCamundaClient.closeAllClients).to.have.been.called;
    });


    it('should return false when connection attempt fails', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'http://localhost:8080'
      };

      mockZeebeClient.topology.rejects(new Error('Connection failed'));

      // when
      const result = await clients._canConnectWithProtocol(endpoint, 'grpc');

      // then
      expect(result).to.be.false;
    });

  });


  describe('#getSupportedCamundaClients', function() {

    beforeEach(function() {
      sinon.stub(clients, '_getProtocol');
    });


    it('should return gRPC client when protocol is gRPC', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'http://localhost:26500'
      };

      clients._getProtocol.resolves('grpc');

      // when
      const result = await clients.getSupportedCamundaClients(endpoint);

      // then
      expect(result).to.deep.equal({
        zeebeGrpcClient: mockZeebeClient
      });
    });


    it('should return REST client when protocol is HTTP', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'grpc://localhost:8080'
      };

      clients._getProtocol.resolves('http');

      // when
      const result = await clients.getSupportedCamundaClients(endpoint);

      // then
      expect(result).to.deep.equal({
        camundaRestClient: mockRestClient
      });
    });


    it('should return gRPC client when protocol is secure gRPC', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'grpcs://localhost:26500'
      };

      clients._getProtocol.resolves('grpcs');

      // when
      const result = await clients.getSupportedCamundaClients(endpoint);

      // then
      expect(result).to.deep.equal({
        zeebeGrpcClient: mockZeebeClient
      });
    });


    it('should cache detected protocol', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'http://localhost:8080'
      };

      clients._getProtocol.resolves('grpc');

      // when
      await clients.getSupportedCamundaClients(endpoint);

      // then
      expect(clients._cachedProtocol).to.equal('grpc');
    });

  });


  describe('integration', function() {

    it('should return gRPC client for explicit gRPC URLs', async function() {

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
      expect(clients._cachedProtocol).to.equal('grpc');
    });


    it('should fallback to gRPC when REST fails', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'http://localhost:8080'
      };
      mockRestClient.getTopology.rejects(new Error('Connection failed'));


      // when
      const result = await clients.getSupportedCamundaClients(endpoint);

      // then
      expect(clients._cachedProtocol).to.equal('grpc');
      expect(result.camundaRestClient).to.not.exist;
      expect(result.zeebeGrpcClient).to.exist;
    });


    it('should use REST when connection succeeds', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'https://localhost:8080'
      };
      mockRestClient.getTopology.resolves({ brokers: [] });

      // when
      const result = await clients.getSupportedCamundaClients(endpoint);

      // then
      expect(clients._cachedProtocol).to.equal('https');
      expect(result.camundaRestClient).to.exist;
      expect(result.zeebeGrpcClient).to.not.exist;
    });

  });

});