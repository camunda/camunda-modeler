'use strict';

var sinon = require('sinon');

var got = require('../helper/mock/got'),
    fs  = require('../helper/mock/fs'),
    FormData = require('../helper/mock/form-data');

var deploy = require('../../lib/createDeployer')({ got, fs, FormData });

describe('deploy', function() {

  var postSpy;

  before(() => {
    postSpy = sinon.spy(got, 'post');
  });


  it('should deploy with provided parameters', function(done) {

    //given
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

    //when
    deploy(url, data, () => {

      //then
      expect(postSpy).to.have.been.calledWith(url, { body: expectedForm });

      done();
    });

  });


  it('should not add empty tenant id to deployment', function(done) {

    //given
    const data = {
      deploymentName: 'some deployment name',
      tenantId: undefined,
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

    //when
    deploy(url, data, () => {

      //then
      expect(postSpy).to.have.been.calledWith(url, { body: expectedForm });

      done();
    });
  });

});
