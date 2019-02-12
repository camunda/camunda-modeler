const sinon = require('sinon');

const createLog = require('../log');

describe('log', function() {

  describe('instantiating', function() {

    it('should create a log instance', function() {
      // when
      const log = createLog('namespace');

      // then
      expect(log).to.exist;
    });

  });

  describe('transports', function() {

    afterEach(function() {
      createLog.transports = [];
    });


    it('should add transports', function() {
      // given
      const transport = sinon.stub({
        info() {},
        error() {}
      });

      // then
      expect(() => createLog.addTransports(transport)).to.not.throw();
    });

  });

});
