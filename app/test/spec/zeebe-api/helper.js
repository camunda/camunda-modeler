const sinon = require('sinon');
const tls = require('node:tls');

/**
 * Helper function to stub system certificates for tests.
 *
 * TODO(barmac): remove when system certificates are tested
 */
module.exports.setupSystemCertificatesStub = function() {
  let certificatesStub;

  // eslint-disable-next-line mocha/no-top-level-hooks
  before(function() {
    certificatesStub = sinon.stub(tls, 'getCACertificates').returns([]);
  });

  // eslint-disable-next-line mocha/no-top-level-hooks
  after(function() {
    certificatesStub.restore();
  });
};
