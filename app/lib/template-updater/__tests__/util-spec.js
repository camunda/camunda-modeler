/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const {
  cacheRef,
  isCachedRef,
  isTemplateCompatible
} = require('../util');

describe('util', function() {

  describe('#isTemplateCompatible', function() {

    it('should return true (8.8 === 8.8)', function() {

      // given
      const templateMetadata = {
        engine: {
          camunda: '^8.8'
        }
      };

      // when
      const result = isTemplateCompatible(templateMetadata, '8.8');

      // then
      expect(result).to.be.true;
    });


    it('should return true (8.8 > 8.7)', function() {

      // given
      const templateMetadata = {
        engine: {
          camunda: '^8.7'
        }
      };

      // when
      const result = isTemplateCompatible(templateMetadata, '8.8');

      // then
      expect(result).to.be.true;
    });


    it('should return false (8.7 < 8.8)', function() {

      // given
      const templateMetadata = {
        engine: {
          camunda: '^8.8'
        }
      };

      // when
      const result = isTemplateCompatible(templateMetadata, '8.7');

      // then
      expect(result).to.be.false;
    });


    it('should return true (camunda engine missing)', function() {

      // given
      const templateMetadata = {
        engine: {
          foobar: '^8.8'
        }
      };

      // when
      const result = isTemplateCompatible(templateMetadata, '8.8');

      // then
      expect(result).to.be.true;
    });


    it('should return true (engine missing)', function() {

      // given
      const templateMetadata = {};

      // when
      const result = isTemplateCompatible(templateMetadata, '8.8');

      // then
      expect(result).to.be.true;
    });

  });


  describe('#isCachedRef', function() {

    it('should return true if cached ref matches', function() {

      // given
      const template = {
        id: 'foo',
        version: 1,
        metadata: {
          upstreamRef: 'foo.com'
        }
      };

      const templateMetadata = {
        ref: 'foo.com',
        version: 1
      };

      // when
      const result = isCachedRef(template, templateMetadata);

      // then
      expect(result).to.be.true;
    });


    it('should return false if cached ref does not match', function() {

      // given
      const template = {
        id: 'foo',
        version: 1,
        metadata: {
          upstreamRef: 'bar.com'
        }
      };

      const templateMetadata = {
        ref: 'foo.com',
        version: 1
      };

      // when
      const result = isCachedRef(template, templateMetadata);

      // then
      expect(result).to.be.false;
    });


    it('should return false if no cached ref', function() {

      // given
      const template = {
        id: 'foo',
        version: 1
      };

      const templateMetadata = {
        ref: 'foo.com',
        version: 1
      };

      // when
      const result = isCachedRef(template, templateMetadata);

      // then
      expect(result).to.be.false;
    });

  });


  describe('#cacheRef', function() {

    it('should cache ref', function() {

      // given
      const template = {
        id: 'foo',
        version: 1
      };

      const templateMetadata = {
        ref: 'foo.com',
        version: 1
      };

      // when
      cacheRef(template, templateMetadata);

      // then
      expect(template).to.deep.equal({
        id: 'foo',
        version: 1,
        metadata: {
          upstreamRef: 'foo.com'
        }
      });
    });

  });

});