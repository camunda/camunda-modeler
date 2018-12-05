'use strict';

const sinon = require('sinon');

const createDeployer = require('../../lib/createDeployer');

const fetch = require('../helper/mock/fetch'),
      fs = require('../helper/mock/fs'),
      FormData = require('../helper/mock/form-data');


describe('deploy', function() {

  let fetchSpy;

  beforeEach(() => {
    fetchSpy = sinon.spy(fetch);
  });

  afterEach(sinon.restore);


  it('should deploy with provided parameters', function(done) {

    // given
    const deploy = createDeploy(fetchSpy);

    const data = getDeploymentData({ tenantId: 'someTenantId' });

    const url = 'some/url';

    const expectedForm = new FormData();

    expectedForm.append('deployment-name', data.deploymentName);
    expectedForm.append(data.file.name, fs.createReadStream(data.file.path));
    expectedForm.append('tenant-id', data.tenantId);

    // when
    deploy(url, data, (err, data) => {

      // then
      expect(fetchSpy).to.have.been.calledWith(
        url,
        { body: expectedForm, method: 'POST' }
      );

      expect(err).not.to.exist;
      expect(data).to.eql(fetch.RESPONSE_OK);

      done();
    });

  });


  it('should deploy even without tenant id provided', function(done) {

    // given
    const deploy = createDeploy(fetchSpy);

    const data = getDeploymentData();

    const url = 'some/url';

    const expectedForm = new FormData();

    expectedForm.append('deployment-name', data.deploymentName);
    expectedForm.append(data.file.name, fs.createReadStream(data.file.path));

    // when
    deploy(url, data, (err, data) => {

      // then
      expect(fetchSpy).to.have.been.calledWith(
        url,
        { body: expectedForm, method: 'POST' }
      );

      expect(err).not.to.exist;
      expect(data).to.eql(fetch.RESPONSE_OK);

      done();
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
    const deploy = createDeploy(fetchResolvingToText);

    const data = getDeploymentData();

    // when
    deploy('some/url', data, (err, data) => {

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
    const deploy = createDeploy(failingFetch);

    const data = getDeploymentData();

    // when
    deploy('some/url', data, (err, data) => {

      // then
      expect(err).to.exist;
      expect(err.message).to.eql(fetchError);

      expect(data).not.to.exist;

      done();
    });
  });


  it('should return error with status, statusText and url for backend error', function(done) {

    // given
    const url = 'some/url',
          errorStatus = 500,
          errorStatusText = 'INTERNAL SERVER ERROR';

    function failingFetch() {
      return Promise.resolve({
        url,
        ok: false,
        status: errorStatus,
        statusText: errorStatusText,
        json() {
          return Promise.reject(new Error('fail on json parse'));
        }
      });
    }

    // given
    const deploy = createDeploy(failingFetch);

    const data = getDeploymentData();

    // when
    deploy(url, data, (err, data) => {

      // then
      expect(err).to.exist;
      expect(err.status).to.eql(errorStatus);
      expect(err.statusText).to.eql(errorStatusText);
      expect(err.url).to.eql(url);

      expect(data).not.to.exist;

      done();
    });
  });


  it('should attach deployment name to error', function(done) {

    // given
    const deploymentName = 'deploymentName';

    function failingFetch() {
      return Promise.reject(new Error());
    }

    const deploy = createDeploy(failingFetch);

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



// helpers /////////
function createDeploy(fetch) {
  return createDeployer({
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
