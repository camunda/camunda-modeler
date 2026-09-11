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
    clients._cachedProtocolIsFallback = false;
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
      const result = await clients._getProtocol(endpoint);

      // then
      expect(result).to.deep.equal({ protocol: 'grpcs', fallback: false });
    });


    it('should detect REST protocol for SaaS URLs', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
        url: 'https://reg-1.zeebe.camunda.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
      };

      // when
      const result = await clients._getProtocol(endpoint);

      // then
      expect(result).to.deep.equal({ protocol: 'https', fallback: false });
    });


    it('should detect gRPC protocol in Self-Managed gRPC URL', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'grpcs://localhost:26500'
      };

      // when
      const result = await clients._getProtocol(endpoint);

      // then
      expect(result).to.deep.equal({ protocol: 'grpcs', fallback: false });
    });


    it('should detect gRPC for Self-Managed HTTP URLs when only gRPC connects', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'http://localhost:26500'
      };
      mockRestClient.getTopology.rejects(new Error('Connection failed'));
      mockZeebeClient.topology.resolves({ brokers: [] });

      // when
      const result = await clients._getProtocol(endpoint);

      // then - gRPC is verified by probe
      expect(result).to.deep.equal({ protocol: 'grpc', fallback: false });
    });


    it('should detect secure gRPC for Self-Managed HTTPS URLs when only gRPC connects', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'https://localhost:8080'
      };
      mockRestClient.getTopology.rejects(new Error('Connection failed'));
      mockZeebeClient.topology.resolves({ brokers: [] });

      // when
      const result = await clients._getProtocol(endpoint);

      // then - gRPC is verified by probe
      expect(result).to.deep.equal({ protocol: 'grpcs', fallback: false });
    });


    it('should assume REST for Self-Managed HTTP URLs when no protocol connects', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'http://localhost:8080'
      };
      mockRestClient.getTopology.rejects(new Error('Connection failed'));
      mockZeebeClient.topology.rejects(new Error('Connection failed'));

      // when
      const result = await clients._getProtocol(endpoint);

      // then - REST is assumed as unverified fallback
      expect(result).to.deep.equal({ protocol: 'http', fallback: true });
    });


    it('should assume secure REST for Self-Managed HTTPS URLs when no protocol connects', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'https://localhost:8080'
      };
      mockRestClient.getTopology.rejects(new Error('Connection failed'));
      mockZeebeClient.topology.rejects(new Error('Connection failed'));

      // when
      const result = await clients._getProtocol(endpoint);

      // then - REST is assumed as unverified fallback
      expect(result).to.deep.equal({ protocol: 'https', fallback: true });
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
      const result = await clients._getProtocol(endpoint);

      // then - should fall back to HTTP when gRPC times out
      expect(result).to.deep.equal({ protocol: 'http', fallback: false });
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
      expect(mockCamundaClient.closeAllClients).to.have.been.called;
    });


    it('should return false when client cannot be created', async function() {

      // given - invalid endpoint type yields no client, cf. #_createCamundaClient
      const endpoint = {
        type: 'INVALID',
        url: 'http://localhost:8080'
      };

      // when
      const result = await clients._canConnectWithProtocol(endpoint, 'http');

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

      clients._getProtocol.resolves({ protocol: 'grpc', fallback: false });

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

      clients._getProtocol.resolves({ protocol: 'http', fallback: false });

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

      clients._getProtocol.resolves({ protocol: 'grpcs', fallback: false });

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

      clients._getProtocol.resolves({ protocol: 'grpc', fallback: false });

      // when
      await clients.getSupportedCamundaClients(endpoint);

      // then
      expect(clients._cachedProtocol).to.equal('grpc');
    });


    it('should reuse cached client for unchanged endpoint', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'http://localhost:8080'
      };

      clients._getProtocol.resolves({ protocol: 'grpc', fallback: false });

      // when
      await clients.getSupportedCamundaClients(endpoint);
      await clients.getSupportedCamundaClients({ ...endpoint });

      // then
      // client is created only once, protocol is not re-probed
      expect(Camunda8).to.have.been.calledOnce;
      expect(clients._getProtocol).to.have.been.calledOnce;
      expect(mockCamundaClient.closeAllClients).not.to.have.been.called;
    });


    it('should re-probe fallback protocol for unchanged endpoint', async function() {

      // given - cluster unreachable, REST probe failed
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'http://localhost:8080'
      };

      clients._getProtocol.resolves({ protocol: 'grpc', fallback: true });

      // when
      await clients.getSupportedCamundaClients(endpoint);
      await clients.getSupportedCamundaClients({ ...endpoint });

      // then
      // protocol is re-probed, previous client is closed and a new one created
      expect(Camunda8).to.have.been.calledTwice;
      expect(clients._getProtocol).to.have.been.calledTwice;
      expect(mockCamundaClient.closeAllClients).to.have.been.called;
    });


    it('should recreate client for changed endpoint', async function() {

      // given
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'http://localhost:8080'
      };

      clients._getProtocol.resolves({ protocol: 'grpc', fallback: false });

      // when
      await clients.getSupportedCamundaClients(endpoint);
      await clients.getSupportedCamundaClients({ ...endpoint, url: 'http://localhost:9090' });

      // then
      // previous client is closed and a new one is created
      expect(Camunda8).to.have.been.calledTwice;
      expect(clients._getProtocol).to.have.been.calledTwice;
      expect(mockCamundaClient.closeAllClients).to.have.been.called;
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
      expect(clients._cachedProtocolIsFallback).to.be.false;
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


    it('should recover once an initially unreachable cluster comes up', async function() {

      // given - cluster is down, no protocol connects, REST is assumed
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'http://localhost:8080'
      };
      mockRestClient.getTopology.rejects(new Error('Connection failed'));
      mockZeebeClient.topology.rejects(new Error('Connection failed'));

      // when
      const downResult = await clients.getSupportedCamundaClients(endpoint);

      // then
      expect(clients._cachedProtocol).to.equal('http');
      expect(clients._cachedProtocolIsFallback).to.be.true;
      expect(downResult.camundaRestClient).to.exist;

      // when - cluster comes up, REST probe succeeds for the same endpoint
      mockRestClient.getTopology.resetBehavior();
      mockRestClient.getTopology.resolves({ brokers: [] });

      const upResult = await clients.getSupportedCamundaClients({ ...endpoint });

      // then - protocol is re-probed and the verified REST client is cached
      expect(clients._cachedProtocol).to.equal('http');
      expect(clients._cachedProtocolIsFallback).to.be.false;
      expect(upResult.camundaRestClient).to.exist;
      expect(upResult.zeebeGrpcClient).to.not.exist;

      // when - subsequent interactions reuse the verified client
      const callCount = Camunda8.callCount;

      await clients.getSupportedCamundaClients({ ...endpoint });

      // then - no further client is created
      expect(Camunda8.callCount).to.equal(callCount);
    });


    it('should permanently cache verified gRPC fallback for gRPC-only endpoints', async function() {

      // given - REST is not served, gRPC connects
      const endpoint = {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: 'http://localhost:26500'
      };
      mockRestClient.getTopology.rejects(new Error('Connection failed'));
      mockZeebeClient.topology.resolves({ brokers: [] });

      // when
      const result = await clients.getSupportedCamundaClients(endpoint);

      // then - gRPC is verified and cached
      expect(clients._cachedProtocol).to.equal('grpc');
      expect(clients._cachedProtocolIsFallback).to.be.false;
      expect(result.zeebeGrpcClient).to.exist;

      // when - subsequent interactions reuse the verified client
      const callCount = Camunda8.callCount;

      await clients.getSupportedCamundaClients({ ...endpoint });

      // then - no further client is created, no re-probing happens
      expect(Camunda8.callCount).to.equal(callCount);
    });

  });

});