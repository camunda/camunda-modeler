const {
  isGrpcSaasUrl,
  isRestSaasUrl,
  isSaasUrl,
  sanitizeCamundaClientOptions,
  sanitizeConfigWithEndpoint
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


  describe('#sanitizeCamundaClientOptions', function() {

    it('should sanitize sensitive fields', function() {

      // given
      const options = {
        ZEEBE_CLIENT_SECRET: 'secret',
        CAMUNDA_CONSOLE_CLIENT_SECRET: 'secret',
        CAMUNDA_BASIC_AUTH_PASSWORD: 'secret',
        CAMUNDA_CUSTOM_ROOT_CERT_STRING: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n'
      };

      // when
      const sanitized = sanitizeCamundaClientOptions(options);

      // then
      expect(sanitized).to.deep.equal({
        ZEEBE_CLIENT_SECRET: '******',
        CAMUNDA_CONSOLE_CLIENT_SECRET: '******',
        CAMUNDA_BASIC_AUTH_PASSWORD: '******',
        CAMUNDA_CUSTOM_ROOT_CERT_STRING: '...'
      });
    });


    it('should not sanitize non-sensitive fields', function() {

      // given
      const options = {
        CAMUNDA_AUTH_STRATEGY: 'OAUTH',
        ZEEBE_CLIENT_ID: 'client-id'
      };

      // when
      const sanitized = sanitizeCamundaClientOptions(options);

      // then
      expect(sanitized).to.deep.equal({
        CAMUNDA_AUTH_STRATEGY: 'OAUTH',
        ZEEBE_CLIENT_ID: 'client-id'
      });
    });

  });


  describe('#sanitizeConfigWithEndpoint', function() {

    it('should sanitize sensitive fields', function() {

      // given
      const endpoint = {
        clientSecret: 'secret',
        basicAuthPassword: 'secret'
      };

      const config = {
        endpoint,
        tenantId: 'tenant-id'
      };

      // when
      const sanitized = sanitizeConfigWithEndpoint(config);

      // then
      expect(sanitized).to.deep.equal({
        endpoint: {
          clientSecret: '******',
          basicAuthPassword: '******'
        },
        tenantId: 'tenant-id'
      });
    });


    it('should not sanitize non-sensitive fields', function() {

      // given
      const endpoint = {
        clientId: 'client-id'
      };

      const config = {
        endpoint,
        tenantId: 'tenant-id'
      };

      // when
      const sanitized = sanitizeConfigWithEndpoint(config);

      // then
      expect(sanitized).to.deep.equal({
        endpoint: {
          clientId: 'client-id'
        },
        tenantId: 'tenant-id'
      });
    });

  });

});
