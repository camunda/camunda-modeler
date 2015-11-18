'use strict';

var chai = require('chai'),
    expect = chai.expect;

var fs = require('fs'),
    path = require('path');

var map = require('lodash/collection/map'),
    forEach = require('lodash/collection/forEach');

var parse = require('../../app/util/parse');

var FIXTURES_PATH = path.join(__dirname, '../fixtures');

var filesPath = {
  bpmn: path.join(FIXTURES_PATH, 'basic.bpmn20.xml'),
  dmn: path.join(FIXTURES_PATH, 'basic.dmn11.xml'),
  nyan: path.join(FIXTURES_PATH, 'nyan_cat.png'),
  random: path.join(FIXTURES_PATH, 'random.xml'),
  activiti: path.join(FIXTURES_PATH, 'activiti.xml'),
  activitiExpected: path.join(FIXTURES_PATH, 'activitiExpected.xml'),
  activitiComplex: path.join(FIXTURES_PATH, 'activitiComplex.xml'),
  activitiComplexExpected: path.join(FIXTURES_PATH, 'activitiComplexExpected.xml')
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

  function expectCollection(collection, assertion) {
    return forEach(collection, function(element) {
      expect(element).to.equal(assertion);
    });
  }

  function testCollection(collection, fn) {
    return map(collection, function(element) {
      return fn(element);
    });
  }

  describe('activiti namespace', function () {

    var activitiFixtures = [ 'activiti', 'activitiComplex' ];

    before(function() {
      activitiFixtures = map(activitiFixtures, function(filePath) {
        return loadFile(filePath);
      });
    });

    it('should find Activiti namespace URL', function() {
      // when
      var results = testCollection(activitiFixtures, parse.hasActivitiURL);

      // then
      expectCollection(results, true);
    });


    it('should replace Activiti namespace URL with Camunda\'s', function() {
      // when
      var camundaNamespaced = testCollection(activitiFixtures, parse.replaceActivitiURL);

      var results = testCollection(camundaNamespaced, parse.hasActivitiURL);

      // then
      expectCollection(results, false);
    });


    it('should grab Activiti namespace', function() {
      // when
      var results = testCollection(activitiFixtures, parse.grabNamespacePrefix);

      // then
      expectCollection(results, 'activiti');
    });


    it('should grab Activiti namespace complex', function() {
      // given
      var xml = 'xmlns:activiti-bkw.d2="http://activiti.org/bpmn"';

      // when
      var result = parse.grabNamespacePrefix(xml);

      // then
      expect(result).to.equal('activiti-bkw.d2');
    });


    it('should replace Activiti namespace with camunda', function () {
      // given
      var activitiExpected = loadFile('activitiExpected'),
          activitiComplexExpected = loadFile('activitiComplexExpected');

      // when
      var results = testCollection(activitiFixtures, parse.replaceNamespace);

      // then
      expect(results[0]).to.equal(activitiExpected);
      expect(results[1]).to.equal(activitiComplexExpected);
    });


    it('should replace Activiti namespace with camunda complex', function () {
      // given
      var xml = [
        'xmlns:activiti-bkw.d2="http://activiti.org/bpmn"',
        '<activiti-bkw.d2:bar.-2 a="B"/>',
        '<activiti-bkw.d2:foo></activiti-bkw.d2:foo.-3>'
      ].join('\n');

      // when
      var result = parse.replaceNamespace(xml);

      // then
      expect(result).to.equal([
        'xmlns:camunda="http://camunda.org/schema/1.0/bpmn"',
        '<camunda:bar.-2 a="B"/>',
        '<camunda:foo></camunda:foo.-3>'
      ].join('\n'));
    });

  });

});
