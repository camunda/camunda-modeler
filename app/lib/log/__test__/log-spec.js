/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const sinon = require('sinon');

const createLog = require('../log');


describe('log', function() {

  describe('instantiating', function() {

    it('should create a log instance', function() {

      // when
      const log = createLog('namespace');

      // then
      expect(log).to.exist;

      expect(log.info).to.exist;
      expect(log.warn).to.exist;
      expect(log.error).to.exist;
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
        warn() {},
        error() {}
      });

      // then
      expect(() => createLog.addTransports(transport)).to.not.throw();
    });

  });

});
