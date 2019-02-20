/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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


  it('should NOT throw error when response is OK but not a JSON', function(done) {

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

    // given
    const deployer = createDeployer(fetchResolvingToText);

    const data = getDeploymentData();

    // when
    deployer.deploy('some/url', data, (err, data) => {

      // then
      expect(err).to.not.exist;
      expect(data).to.eql(okResponse);

      done();
    });
  });


  it('should handle fetch error', function(done) {

    // given
    const fetchError = 'FETCH_ERROR';

    function failingFetch() {
      return Promise.reject(new Error(fetchError));
    }

    // given
    const deployer = createDeployer(failingFetch);

    const data = getDeploymentData();

    // when
    deployer.deploy('some/url', data, (err, data) => {

      // then
      expect(err).to.exist;
      expect(err.message).to.eql(fetchError);

      expect(data).not.to.exist;

      done();
    });
  });


  it('should return error with proper code for backend error', function(done) {

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
    deployer.deploy('some/url', data, (err, data) => {

      // then
      expect(err).to.exist;
      expect(err.status).to.eql(errorStatus);

      expect(data).not.to.exist;

      done();
    });


    it('should attach deployment name to error', function(done) {

      // given
      const deploymentName = 'deploymentName';

      function failingFetch() {
        return Promise.reject(new Error());
      }

      const deploy = createDeployer(failingFetch);

      const data = getDeploymentData({ deploymentName });

      // when
      deploy('some/url', data, (err, data) => {

        // then
        expect(err).to.exist;
        expect(err.deploymentName).to.eql(deploymentName);

        expect(data).not.to.exist;

        done();
      });
    });
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
      await deployer.deploy(url, data, (err, data) => {
        // then
        expect(err).to.exist;
        expect(data).not.to.exist;
      });

      expect(fetchSpy).to.not.be.called;

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
