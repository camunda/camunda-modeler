const {
  isGrpcSaasUrl,
  isRestSaasUrl,
  isSaasUrl,
  sanitizeCamundaClientOptions,
  sanitizeConfigWithEndpoint,
  removeV2OrSlashes
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


  describe('#removeV2OrSlashes', function() {
    function validateRemoveV2OrSlashes(url, expected) {
      expect(removeV2OrSlashes(url)).to.equal(expected);
    }


    it('should keep base URL (no trailing slash)', function() {
      validateRemoveV2OrSlashes('https://example.com', 'https://example.com');
    });


    it('should remove single trailing slash from base URL', function() {
      validateRemoveV2OrSlashes('https://example.com/', 'https://example.com');
    });


    it('should remove trailing /v2', function() {
      validateRemoveV2OrSlashes('https://example.com/v2', 'https://example.com');
    });


    it('should remove trailing /v2/', function() {
      validateRemoveV2OrSlashes('https://example.com/v2/', 'https://example.com');
    });


    it('should keep first /v2 if double specified', function() {
      validateRemoveV2OrSlashes('https://example.com/v2/v2', 'https://example.com/v2');
    });


    it('should preserve query string and hash', function() {
      validateRemoveV2OrSlashes('https://example.com/v2?a=1#top', 'https://example.com?a=1#top');
    });


    it('should not remove mid-path v2', function() {
      validateRemoveV2OrSlashes('https://example.com/api/v2/resources', 'https://example.com/api/v2/resources');
    });


    it('should remove trailing slashes', function() {
      validateRemoveV2OrSlashes('https://example.com/api/', 'https://example.com/api');
    });


    it('should preserve port', function() {
      validateRemoveV2OrSlashes('https://example.com:8080/v2', 'https://example.com:8080');
    });


    it('should support localhost', function() {
      validateRemoveV2OrSlashes('https://localhost:8080/v2', 'https://localhost:8080');
    });

  });

});
