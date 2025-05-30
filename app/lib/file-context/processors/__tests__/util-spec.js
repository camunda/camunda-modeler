/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const fs = require('fs');
const path = require('path');

const {
  isCamunda8BPMN,
  isCamunda8DMN,
  isCamunda8Form
} = require('../util');

describe('util', function() {

  describe('isCamunda8', function() {

    it('should return true for Camunda 8 BPMN file', function() {

      // given
      const file = fs.readFileSync(path.resolve(__dirname, './fixtures/camunda8.bpmn'), 'utf8');

      // when
      const result = isCamunda8BPMN(file);

      expect(result).to.be.true;
    });


    it('should return false for Camunda 7 BPMN file', function() {

      // given
      const file = fs.readFileSync(path.resolve(__dirname, './fixtures/camunda7.bpmn'), 'utf8');

      // when
      const result = isCamunda8BPMN(file);

      expect(result).to.be.false;
    });


    it('should return true for Camunda 8 DMN file', function() {

      // given
      const file = fs.readFileSync(path.resolve(__dirname, './fixtures/camunda8.dmn'), 'utf8');

      // when
      const result = isCamunda8DMN(file);

      expect(result).to.be.true;
    });


    it('should return false for Camunda 7 DMN file', function() {

      // given
      const file = fs.readFileSync(path.resolve(__dirname, './fixtures/camunda7.dmn'), 'utf8');

      // when
      const result = isCamunda8DMN(file);

      expect(result).to.be.false;
    });


    it('should return true for Camunda 8 form file', function() {

      // given
      const file = fs.readFileSync(path.resolve(__dirname, './fixtures/camunda8.form'), 'utf8');

      // when
      const result = isCamunda8Form(file);

      expect(result).to.be.true;
    });


    it('should return false for Camunda 7 form file', function() {

      // given
      const file = fs.readFileSync(path.resolve(__dirname, './fixtures/camunda7.form'), 'utf8');

      // when
      const result = isCamunda8Form(file);

      expect(result).to.be.false;
    });

  });

});