'use strict';

var sinon = require('sinon');

var createDeployer = require('../../lib/createDeployer');

var fetch = require('../helper/mock/fetch'),
    fs = require('../helper/mock/fs'),
    FormData = require('../helper/mock/form-data');


describe('deploy', function() {

  var fetchSpy;

  beforeEach(() => {
    fetchSpy = sinon.spy(fetch);
  });


  it('should deploy with provided parameters', function(done) {

    // given
    var deploy = createDeploy(fetchSpy);

    const data = {
      deploymentName: 'some deployment name',
      tenantId: 'some tenant id',
      file: {
        name: 'some name',
        fileType: 'bpmn',
        path: 'some/path'
      }
    };

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


  it('should handle backend error', function(done) {

    // given
    function failingFetch(url) {
      return Promise.reject(new Error('backend unavailable'));
    }

    // given
    var deploy = createDeploy(failingFetch);

    const data = {
      deploymentName: 'some deployment name',
      tenantId: undefined,
      file: {
        name: 'some name',
        fileType: 'bpmn',
        path: 'some/path'
      }
    };

    // when
    deploy('some/url', data, (err, data) => {

      // then
      expect(err).to.exist;
      expect(err.message).to.eql('backend unavailable');

      expect(data).not.to.exist;

      done();
    });
  });

});


function createDeploy(fetch) {
  return createDeployer({
    fetch,
    fs,
    FormData
  });
}