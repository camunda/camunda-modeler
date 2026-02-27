/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import {
  getGRPCErrorCode,
  isC8RunConnection
} from '../util';

describe('util', function() {

  describe('getGRPCErrorCode', function() {

    it('should return code from error response', function() {

      // given
      const errorResponse = {
        code: 3,
        message: 'foo',
        details: 'bar'
      };

      // when
      const code = getGRPCErrorCode(errorResponse);

      // then
      expect(code).to.eql('INVALID_ARGUMENT');
    });


    it('should return default code', function() {

      // given
      const errorResponse = {
        message: 'foo',
        details: 'bar'
      };

      // when
      const code = getGRPCErrorCode(errorResponse);

      // then
      expect(code).to.eql('UNKNOWN');
    });

  });


  describe('isC8RunConnection', function() {

    it('should return true for valid c8run connection', function() {

      // given
      const connection = {
        id: 'test-id',
        name: 'c8run (local)',
        contactPoint: 'http://localhost:8080/v2'
      };

      // when
      const result = isC8RunConnection(connection);

      // then
      expect(result).to.be.true;
    });


    it('should match case-insensitively', function() {

      // given
      const connection = {
        name: 'C8RUN (Local)',
        contactPoint: 'HTTP://LOCALHOST:8080/v2'
      };

      // when
      const result = isC8RunConnection(connection);

      // then
      expect(result).to.be.true;
    });


    it('should NOT match HTTPS URLs', function() {

      // given
      const connection = {
        name: 'c8run (local)',
        contactPoint: 'https://localhost:8080/v2'
      };

      // when
      const result = isC8RunConnection(connection);

      // then
      expect(result).to.be.false;
    });


    it('should NOT match different ports', function() {

      // given
      const connection = {
        name: 'c8run (local)',
        contactPoint: 'http://localhost:8081/v2'
      };

      // when
      const result = isC8RunConnection(connection);

      // then
      expect(result).to.be.false;
    });


    it('should NOT match different hosts', function() {

      // given
      const connection = {
        name: 'c8run (local)',
        contactPoint: 'http://example.com:8080/v2'
      };

      // when
      const result = isC8RunConnection(connection);

      // then
      expect(result).to.be.false;
    });


    it('should NOT match when name does not start with c8run', function() {

      // given
      const connection = {
        name: 'my c8run setup',
        contactPoint: 'http://localhost:8080/v2'
      };

      // when
      const result = isC8RunConnection(connection);

      // then
      expect(result).to.be.false;
    });


    it('should require BOTH URL and name to match', function() {

      // when - only URL matches
      const urlOnlyResult = isC8RunConnection({
        name: 'Production',
        contactPoint: 'http://localhost:8080/v2'
      });

      // then
      expect(urlOnlyResult).to.be.false;

      // when - only name matches
      const nameOnlyResult = isC8RunConnection({
        name: 'c8run (local)',
        contactPoint: 'https://example.com'
      });

      // then
      expect(nameOnlyResult).to.be.false;
    });


    it('should handle invalid inputs gracefully', function() {

      // then
      expect(isC8RunConnection(null)).to.be.false;
      expect(isC8RunConnection(undefined)).to.be.false;
      expect(isC8RunConnection({})).to.be.false;
      expect(isC8RunConnection({ name: 'c8run' })).to.be.false;
      expect(isC8RunConnection({ contactPoint: 'http://localhost:8080' })).to.be.false;
    });

  });

});
