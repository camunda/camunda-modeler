'use strict';

var chai = require('chai'),
    expect = chai.expect;

var fs = require('fs'),
    path = require('path');

var parse = require('../../app/util/parse');

var FIXTURES_PATH = path.join(__dirname, '../fixtures');

var filesPath = {
  bpmn: path.join(FIXTURES_PATH, 'basic.bpmn20.xml'),
  dmn: path.join(FIXTURES_PATH, 'basic.dmn11.xml'),
  nyan: path.join(FIXTURES_PATH, 'nyan_cat.png'),
  random: path.join(FIXTURES_PATH, 'random.xml')
};

function loadFile(type) {
  var filePath = filesPath[type],
      encoding = { encoding: 'utf8' };

  return fs.readFileSync(filePath, encoding);
}

describe('app/util - parse', function() {

  describe("#extractNotation", function () {

    it('should identify bpmn file', function () {
      // given
      var bpmnFile = loadFile('bpmn');

      // when
      var notation = parse.extractNotation(bpmnFile);

      // then
      expect(notation).to.equal('bpmn');
    });

    it('should identify dmn file', function () {
      // given
      var dmnFile = loadFile('dmn');

      // when
      var notation = parse.extractNotation(dmnFile);

      // then
      expect(notation).to.equal('dmn');
    });

    it('should return null on random xml file', function () {
      // given
      var randomFile = loadFile('random');

      // when
      var notation = parse.extractNotation(randomFile);

      // then
      expect(notation).to.equal(null);
    });

    it('should return null on nyan cat image', function () {
      // given
      var nyanCatImage = loadFile('nyan');

      // when
      var notation = parse.extractNotation(nyanCatImage);

      // then
      expect(notation).to.equal(null);
    });

  });

  describe('#hasExtension', function () {

    it('should identify an extension', function() {
      // given
      var filePath = '/app/bar.foo';

      // when
      var hasExtension = parse.hasExtension(filePath);

      // then
      expect(hasExtension).to.be.true;
    });

    it('should NOT identify an extension', function() {
      // given
      var filePath = '/app/bar';

      // when
      var hasExtension = parse.hasExtension(filePath);

      // then
      expect(hasExtension).to.be.false;
    });

  });

});
