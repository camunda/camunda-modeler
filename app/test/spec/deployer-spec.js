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

const Deployer = require('../../lib/deployer');

const fetch = require('../helper/mock/fetch'),
      fs = require('../helper/mock/fs'),
      FormData = require('../helper/mock/form-data');


describe('Deployer', function() {

  let fetchSpy;

  beforeEach(() => {
    fetchSpy = sinon.spy(fetch);
  });

  afterEach(sinon.restore);

  describe('#deploy', function() {

    it('should deploy with provided parameters', async function() {

      // given
      const deployer = createDeployer(fetchSpy);

      const data = getDeploymentData({ tenantId: 'someTenantId' });

      const url = 'some/url';

      const expectedForm = new FormData();

      expectedForm.append(data.file.name, fs.createReadStream(data.file.path));

      expectedForm.append('deployment-name', data.deploymentName);
      expectedForm.append('deploy-changed-only', 'true');
      expectedForm.append('deployment-source', 'Camunda Modeler');
      expectedForm.append('tenant-id', data.tenantId);

      // when
      await deployer.deploy(url, data, (err, data) => {
        // then
        expect(err).not.to.exist;
        expect(data).to.eql(fetch.RESPONSE_OK);
      });

      // then
      expect(fetchSpy).to.have.been.calledOnce;

      const [ usedUrl, requestParams ] = fetchSpy.getCall(0).args;

      expect(usedUrl).to.eql(url);
      expect(requestParams).to.deep.contain({
        body: expectedForm,
        method: 'POST'
      });

    });


    it('should deploy even without tenant id provided', async function() {

      // given
      const deployer = createDeployer(fetchSpy);

      const data = getDeploymentData();

      const url = 'some/url';

      const expectedForm = new FormData();

      expectedForm.append(data.file.name, fs.createReadStream(data.file.path));

      expectedForm.append('deployment-name', data.deploymentName);
      expectedForm.append('deploy-changed-only', 'true');
      expectedForm.append('deployment-source', 'Camunda Modeler');

      // when
      await deployer.deploy(url, data, (err, data) => {
        // then
        expect(err).not.to.exist;
        expect(data).to.eql(fetch.RESPONSE_OK);
      });

      // then
      expect(fetchSpy).to.have.been.calledOnce;

      const [ usedUrl, requestParams ] = fetchSpy.getCall(0).args;

      expect(usedUrl).to.eql(url);
      expect(requestParams).to.deep.contain({
        body: expectedForm,
        method: 'POST'
      });

    });


    it('should NOT throw error when response is OK but not a JSON', async function() {

      // given
      const okResponse = 'OK';

      function fetchResolvingToText() {
        return Promise.resolve({
          ok: true,
          statusText: okResponse,
          json() {
            return Promise.reject(new Error('fail on json parse'));
          }
        });
      }

      const deployer = createDeployer(fetchResolvingToText);

      const data = getDeploymentData();

      // when
      const response = await deployer.deploy('some/url', data);

      // then
      expect(response).to.eql(okResponse);
    });


    it('should handle fetch error', async function() {

      // given
      const fetchError = 'FETCH_ERROR';

      function failingFetch() {
        return Promise.reject(new Error(fetchError));
      }

      const deployer = createDeployer(failingFetch);

      const data = getDeploymentData();

      // when
      try {
        await deployer.deploy('some/url', data);

      } catch (error) {
        // then
        expect(error.message).to.eql(fetchError);

        return;
      }

      throw new Error('should never get here');
    });


    it('should return error with proper code for backend error', async function() {

      // given
      const errorStatus = 500,
            errorStatusText = 'INTERNAL SERVER ERROR';

      function failingFetch() {
        return Promise.resolve({
          ok: false,
          status: errorStatus,
          statusText: errorStatusText,
          json() {
            return Promise.reject(new Error('fail on json parse'));
          }
        });
      }

      // given
      const deployer = createDeployer(failingFetch);

      const data = getDeploymentData();

      // when
      try {
        await deployer.deploy('some/url', data);
      } catch (error) {
        // then
        expect(error.status).to.eql(errorStatus);

        return;
      }

      throw new Error('should never get here');
    });


    it('should attach deployment name to error', async function() {

      // given
      const deploymentName = 'deploymentName';

      function failingFetch() {
        return Promise.reject(new Error());
      }

      const deployer = createDeployer(failingFetch);

      const data = getDeploymentData({ deploymentName });

      // when
      try {
        await deployer.deploy('some/url', data);
      } catch (error) {
        // then
        expect(error.deploymentName).to.eql(deploymentName);

        return;
      }

      throw new Error('should never get here');
    });


    describe('authentication', function() {

      it('should deploy without auth', async function() {
        // given
        const deployer = createDeployer(fetchSpy);

        const data = getDeploymentData({ tenantId: 'someTenantId' });

        const url = 'some/url';

        // when
        await deployer.deploy(url, data);

        // then
        expect(fetchSpy).to.be.calledOnce;

        const requestParams = fetchSpy.getCall(0).args[1];

        expect(requestParams).to.satisfy(function(params) {
          return !params.headers || !params.headers.Authorization;
        });

      });


      it('should throw error for unknown auth', async function() {
        // given
        const deployer = createDeployer(fetchSpy);

        const data = getDeploymentData({
          tenantId: 'someTenantId',
          auth: {}
        });

        const url = 'some/url';

        // when
        try {
          await deployer.deploy(url, data);
        } catch (error) {
          expect(fetchSpy).to.have.not.be.called;

          return;
        }

        throw new Error('should never get here');
      });


      it('should deploy with basic auth', async function() {
        // given
        const username = 'username',
              password = 'password',
              credentials = btoa(`${username}:${password}`),
              basicHeader = `Basic ${credentials}`;

        const deployer = createDeployer(fetchSpy);

        const data = getDeploymentData({
          tenantId: 'someTenantId',
          auth: {
            username,
            password
          }
        });

        const url = 'some/url';

        // when
        await deployer.deploy(url, data);

        // then
        expect(fetchSpy).to.be.calledOnce;

        const requestParams = fetchSpy.getCall(0).args[1];

        expect(requestParams).to.have.property('headers')
          .which.has.property('Authorization').eql(basicHeader);

      });


      it('should deploy with bearer token', async function() {
        // given
        const bearerToken = 'bearerToken',
              bearerHeader = `Bearer ${bearerToken}`;

        const deployer = createDeployer(fetchSpy);

        const data = getDeploymentData({
          tenantId: 'someTenantId',
          auth: {
            bearer: bearerToken
          }
        });

        const url = 'some/url';

        // when
        await deployer.deploy(url, data);

        // then
        expect(fetchSpy).to.be.calledOnce;

        const requestParams = fetchSpy.getCall(0).args[1];

        expect(requestParams).to.have.property('headers')
          .which.has.property('Authorization').eql(bearerHeader);
      });
    });
  });


  describe('#ping', function() {

    it('should fetch the response', async function() {
      // given
      const deployer = createDeployer(fetchSpy);
      const url = 'some/url';

      // when
      await deployer.ping(url, {});

      // then
      expect(fetchSpy).to.be.calledOnce;
    });


    it('should handle auth', async function() {
      // given
      const deployer = createDeployer(fetchSpy);
      const url = 'some/url';

      // when
      await deployer.ping(url, { auth: { bearer: 'token' } });

      // then
      expect(fetchSpy).to.be.calledOnce;
    });
  });


});



// helpers /////////
function createDeployer(fetch) {
  return new Deployer({
    fetch,
    fs,
    FormData
  });
}

function getDeploymentData(options = {}) {
  return Object.assign({
    deploymentName: 'some deployment name',
    file: {
      name: 'some name',
      path: 'some/path'
    }
  }, options);
}

/**
 * @returns {string} base64 encoded content
 * @param {string} text
 */
function btoa(text) {
  return Buffer.from(text, 'utf8').toString('base64');
}
