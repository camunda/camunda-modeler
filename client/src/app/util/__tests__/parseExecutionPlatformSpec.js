/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import parseExecutionPlatform from '../parseExecutionPlatform';

const files = {
  bpmnWithPlatform: require('./execution-platform/with-platform.bpmn20.xml'),
  bpmnWithoutPlatform: require('./execution-platform/without-platform.bpmn20.xml'),
  bpmnWithoutVersion: require('./execution-platform/without-version.bpmn20.xml'),
  bpmnWithChangedPrefix: require('./execution-platform/changed-prefix.bpmn20.xml'),
  withoutPrefix: require('./execution-platform/without-prefix.bpmn20.xml'),
  dmnWithPlatform: require('./execution-platform/with-platform.dmn11.xml'),
  nyan: require('./execution-platform/nyan_cat.png'),
  random: require('./execution-platform/random.xml'),
  noNs: require('./execution-platform/no-ns.xml')
};

function getFile(type) {
  return files[type];
}


describe('util - parseExecutionPlatform', function() {

  it('should return executionPlatform and executionPlatformVersion for BPMN diagram', function() {

    // given
    const bpmnFile = getFile('bpmnWithPlatform');

    // when
    const meta = parseExecutionPlatform(bpmnFile);

    // then
    expect(meta).to.exist;
    expect(meta).to.have.property('executionPlatform').equal('Camunda Platform');
    expect(meta).to.have.property('executionPlatformVersion').equal('7.15.0');
  });


  it('should return null if executionPlatform is missing', function() {

    // given
    const bpmnFile = getFile('bpmnWithoutPlatform');

    // when
    const meta = parseExecutionPlatform(bpmnFile);

    // then
    expect(meta).to.be.null;
  });


  it('should return executionPlatformVersion=null if missing', function() {

    // given
    const bpmnFile = getFile('bpmnWithoutVersion');

    // when
    const meta = parseExecutionPlatform(bpmnFile);

    // then
    expect(meta).to.exist;
    expect(meta).to.have.property('executionPlatform').equal('Camunda Platform');
    expect(meta).to.have.property('executionPlatformVersion').equal(null);
  });


  it('should return executionPlatform and executionPlatformVersion even if prefix is changed',
    function() {

      // given
      const bpmnFile = getFile('bpmnWithChangedPrefix');

      // when
      const meta = parseExecutionPlatform(bpmnFile);

      // then
      expect(meta).to.exist;
      expect(meta).to.have.property('executionPlatform').equal('Camunda Platform');
      expect(meta).to.have.property('executionPlatformVersion').equal('7.15.0');
    }
  );


  it('should return executionPlatform and executionPlatformVersion even if there is no prefix',
    function() {

      // given
      const bpmnFile = getFile('withoutPrefix');

      // when
      const meta = parseExecutionPlatform(bpmnFile);

      // then
      expect(meta).to.exist;
      expect(meta).to.have.property('executionPlatform').equal('Camunda Platform');
      expect(meta).to.have.property('executionPlatformVersion').equal('7.15.0');
    }
  );


  it('should return executionPlatform and executionPlatformVersion for DMN diagram', function() {

    // given
    const bpmnFile = getFile('dmnWithPlatform');

    // when
    const meta = parseExecutionPlatform(bpmnFile);

    // then
    expect(meta).to.exist;
    expect(meta).to.have.property('executionPlatform').equal('Camunda Platform');
    expect(meta).to.have.property('executionPlatformVersion').equal('7.15.0');
  });


  it('should return null on random xml file', function() {

    // given
    const randomFile = getFile('random');

    // when
    const meta = parseExecutionPlatform(randomFile);

    // then
    expect(meta).to.equal(null);
  });


  it('should return null on empty file', function() {

    // when
    const meta = parseExecutionPlatform('');

    // then
    expect(meta).to.equal(null);
  });


  it('should return null on no-ns file', function() {

    // given
    const contents = getFile('noNs');

    // when
    const meta = parseExecutionPlatform(contents);

    // then
    expect(meta).to.equal(null);
  });


  it('should return null on nyan cat image', function() {

    // given
    const nyanCatImage = getFile('nyan');

    // when
    const meta = parseExecutionPlatform(nyanCatImage);

    // then
    expect(meta).to.equal(null);
  });


  it('should return null on no content', function() {

    // when
    const meta = parseExecutionPlatform();

    // then
    expect(meta).to.equal(null);
  });
});
