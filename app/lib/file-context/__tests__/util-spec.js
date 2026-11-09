/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const { getFileExtension } = require('../util');


describe('file-context/util', function() {

  describe('getFileExtension', function() {

    it('should get extension', function() {
      expect(getFileExtension('/foo/bar.bpmn')).to.eql('.bpmn');
      expect(getFileExtension('/foo/bar.form')).to.eql('.form');
      expect(getFileExtension('/foo/bar')).to.eql('');
    });


    it('should get extension of dot-prefixed file', function() {
      expect(getFileExtension('/foo/.hidden.bpmn')).to.eql('.bpmn');
    });


    it('should get dot-prefixed name without extension as extension', function() {
      expect(getFileExtension('/foo/.process-application')).to.eql('.process-application');
      expect(getFileExtension('/foo/.c8ignore')).to.eql('.c8ignore');
    });


    it('should get extension lower case', function() {
      expect(getFileExtension('/foo/BAR.BPMN')).to.eql('.bpmn');
      expect(getFileExtension('/foo/bar.Dmn')).to.eql('.dmn');
    });

  });

});
