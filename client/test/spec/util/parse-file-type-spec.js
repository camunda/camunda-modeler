'use strict';


var parseFileType = require('app/util/parse-file-type');

var files = {
  bpmn: require('test/fixtures/basic.bpmn20.xml'),
  bpmnWithDmnUri: require('test/fixtures/bpmnWithDmnUri.xml'),
  cmmn: require('test/fixtures/basic.cmmn11.xml'),
  dmn: require('test/fixtures/basic.dmn11.xml'),
  nyan: require('test/fixtures/nyan_cat.png'),
  random: require('test/fixtures/random.xml'),
  noNs: require('test/fixtures/no-ns.xml')
};

function getFile(type) {
  return files[type];
}


describe('util - parse file type', function() {

  it('should identify bpmn file', function() {
    // given
    var bpmnFile = getFile('bpmn');

    // when
    var notation = parseFileType({ contents: bpmnFile });

    // then
    expect(notation).to.equal('bpmn');
  });


  it('should identify bpmn file regardless of dmn uri', function() {
    // given
    var bpmnFile = getFile('bpmnWithDmnUri');

    // when
    var notation = parseFileType({ contents: bpmnFile });

    // then
    expect(notation).to.equal('bpmn');
  });


  it('should identify cmmn file', function() {
    // given
    var dmnFile = getFile('cmmn');

    // when
    var notation = parseFileType({ contents: dmnFile });

    // then
    expect(notation).to.equal('cmmn');
  });


  it('should identify dmn file', function() {
    // given
    var dmnFile = getFile('dmn');

    // when
    var notation = parseFileType({ contents: dmnFile });

    // then
    expect(notation).to.equal('dmn');
  });


  it('should return null on random xml file', function() {
    // given
    var randomFile = getFile('random');

    // when
    var notation = parseFileType({ contents: randomFile });

    // then
    expect(notation).to.equal(null);
  });


  it('should return null on empty ile', function() {
    // when
    var notation = parseFileType({ contents: '' });

    // then
    expect(notation).to.equal(null);
  });


  it('should return null on no-ns file', function() {
    // given
    var contents = getFile('noNs');

    // when
    var notation = parseFileType({ contents: contents });

    // then
    expect(notation).to.equal(null);
  });


  it('should return null on nyan cat image', function() {
    // given
    var nyanCatImage = getFile('nyan');

    // when
    var notation = parseFileType({ contents: nyanCatImage });

    // then
    expect(notation).to.equal(null);
  });

});
