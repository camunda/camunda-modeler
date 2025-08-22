const sinon = require('sinon');

/**
 * Helper function to set up a platform stub for tests.
 *
 * TODO(barmac): remove when system keychain certificates are tested
 */
module.exports.setupPlatformStub = function() {
  let platformStub;

  // eslint-disable-next-line mocha/no-top-level-hooks
  before(function() {
    platformStub = sinon.stub(process, 'platform').value('CI');
  });

  // eslint-disable-next-line mocha/no-top-level-hooks
  after(function() {
    platformStub.restore();
  });
};