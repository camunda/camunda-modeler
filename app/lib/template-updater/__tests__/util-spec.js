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
      const id = 'foo';

      const templateMetadata = {
        ref: 'foo.com',
        version: 1
      };

      const cachedRefs = {
        foo: {
          1: templateMetadata.ref
        }
      };

      // when
      const result = isCachedRef(id, templateMetadata, cachedRefs);

      // then
      expect(result).to.be.true;
    });


    it('should return false if cached ref matches', function() {

      // given
      const id = 'foo';

      const templateMetadata = {
        ref: 'foo.com',
        version: 1
      };

      const cachedRefs = {
        bar: {
          1: templateMetadata.ref
        }
      };

      // when
      const result = isCachedRef(id, templateMetadata, cachedRefs);

      // then
      expect(result).to.be.false;
    });

  });


  describe('#cacheRef', function() {

    it('should cache ref', function() {

      // given
      const id = 'foo';

      const templateMetadata = {
        ref: 'foo.com',
        version: 1
      };

      const cachedRefs = {
        foo: {
          1: templateMetadata.ref
        }
      };

      // when
      cacheRef(id, templateMetadata, cachedRefs);

      // then
      expect(cachedRefs).to.deep.equal({ foo: { 1: 'foo.com' } });
    });

  });

});