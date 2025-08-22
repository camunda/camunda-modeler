const {
  isGrpcSaasUrl,
  isRestSaasUrl,
  isSaasUrl
} = require('../../../lib/zeebe-api/utils');

describe('utils', function() {

  describe('#isSaasUrl', function() {

    it('should return true for SaaS URLs', function() {
      expect(isSaasUrl('https://foo.jfk-1.zeebe.camunda.io:443/')).to.be.true;
      expect(isSaasUrl('https://foo.jfk-1.zeebe.camunda.io')).to.be.true;
      expect(isSaasUrl('grpcs://foo.jfk-1.zeebe.camunda.io')).to.be.true;
      expect(isSaasUrl('https://jfk-1.zeebe.camunda.io:443/foo')).to.be.true;
      expect(isSaasUrl('https://jfk-1.zeebe.camunda.io/foo')).to.be.true;
    });

    it('should return false for non-SaaS URLs', function() {
      expect(isSaasUrl('https://foo.zeebe.camunda.com:443')).to.be.false;
      expect(isSaasUrl('https://foo.zeebe.camunda.io:443/bpmn')).to.be.false;
      expect(isSaasUrl('https://jfk-1.zeebe.camunda.io:443/')).to.be.false;
      expect(isSaasUrl('https://bar.zeebe.camunda.io:443/foo')).to.be.false;
    });

  });


  describe('#isGrpcSaasUrl', function() {

    it('should return true for SaaS URLs', function() {
      expect(isGrpcSaasUrl('https://foo.jfk-1.zeebe.camunda.io:443/')).to.be.true;
      expect(isGrpcSaasUrl('https://foo.jfk-1.zeebe.camunda.io')).to.be.true;
      expect(isGrpcSaasUrl('grpcs://foo.jfk-1.zeebe.camunda.io')).to.be.true;
    });


    it('should return false for non-SaaS URLs', function() {
      expect(isGrpcSaasUrl('https://foo.zeebe.camunda.com:443')).to.be.false;
      expect(isGrpcSaasUrl('https://foo.zeebe.camunda.io:443/bpmn')).to.be.false;
    });

  });


  describe('#isRestSaasUrl', function() {

    it('should return true for SaaS URLs', function() {
      expect(isRestSaasUrl('https://jfk-1.zeebe.camunda.io:443/foo')).to.be.true;
      expect(isRestSaasUrl('https://jfk-1.zeebe.camunda.io/foo')).to.be.true;
    });

    it('should return false for non-SaaS URLs', function() {
      expect(isRestSaasUrl('https://jfk-1.zeebe.camunda.io:443/')).to.be.false;
      expect(isRestSaasUrl('https://bar.zeebe.camunda.io:443/foo')).to.be.false;
    });

  });

});