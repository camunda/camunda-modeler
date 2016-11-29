'use strict';

var map = require('lodash/collection/map'),
    forEach = require('lodash/collection/forEach');

var namespace = require('app/util/namespace');

var files = {
  activiti: require('test/fixtures/activiti.xml'),
  activitiExpected: require('test/fixtures/activitiExpected.xml'),
  activitiComplex: require('test/fixtures/activitiComplex.xml'),
  activitiComplexExpected: require('test/fixtures/activitiComplexExpected.xml')
};

function getFile(type) {
  return files[type];
}

describe('util - namespace', function() {

  describe('#hasExtension', function() {

    it('should identify an extension', function() {
      // given
      var filePath = '/app/bar.foo';

      // when
      var hasExtension = namespace.hasExtension(filePath);

      // then
      expect(hasExtension).to.be.true;
    });

    it('should NOT identify an extension', function() {
      // given
      var filePath = '/app/bar';

      // when
      var hasExtension = namespace.hasExtension(filePath);

      // then
      expect(hasExtension).to.be.false;
    });

  });

  function expectCollection(collection, assertion) {
    return forEach(collection, function(element) {
      expect(element).to.equal(assertion);
    });
  }

  function testCollection(collection, fn, optional) {
    return map(collection, function(element) {
      return fn(element, optional);
    });
  }

  describe('activiti namespace', function() {

    var activitiFixtures = [ 'activiti', 'activitiComplex' ];

    before(function() {
      activitiFixtures = map(activitiFixtures, function(filePath) {
        return getFile(filePath);
      });
    });

    it('should find Activiti namespace URL', function() {
      // when
      var results = testCollection(activitiFixtures, namespace.hasOldNamespace);

      // then
      expectCollection(results, true);
    });


    it('should replace Activiti namespace URL with Camunda\'s', function() {
      // when
      var camundaNamespaced = testCollection(activitiFixtures, namespace.replace, 'bpmn');

      var results = testCollection(camundaNamespaced, namespace.hasOldNamespace);

      // then
      expectCollection(results, false);
    });


    it('should grab Activiti namespace', function() {
      // when
      var results = testCollection(activitiFixtures, namespace.grabNamespacePrefix);

      // then
      expectCollection(results, 'activiti');
    });


    it('should grab Activiti namespace complex', function() {
      // given
      var xml = 'xmlns:activiti-bkw.d2="http://activiti.org/bpmn"';

      // when
      var result = namespace.grabNamespacePrefix(xml);

      // then
      expect(result).to.equal('activiti-bkw.d2');
    });


    it('should replace Activiti namespace with camunda', function() {
      // given
      var activitiExpected = getFile('activitiExpected'),
          activitiComplexExpected = getFile('activitiComplexExpected');

      // when
      var results = testCollection(activitiFixtures, namespace.replace, 'bpmn');

      // then
      expect(results[0]).to.equal(activitiExpected);
      expect(results[1]).to.equal(activitiComplexExpected);
    });


    it('should replace Activiti namespace with camunda complex', function() {
      // given
      var xml = [
        'xmlns:activiti-bkw.d2="http://activiti.org/bpmn"',
        '<activiti-bkw.d2:bar.-2 a="B"/>',
        '<activiti-bkw.d2:foo></activiti-bkw.d2:foo.-3>'
      ].join('\n');

      // when
      var result = namespace.replace(xml, 'bpmn');

      // then
      expect(result).to.equal([
        'xmlns:camunda="http://camunda.org/schema/1.0/bpmn"',
        '<camunda:bar.-2 a="B"/>',
        '<camunda:foo></camunda:foo.-3>'
      ].join('\n'));
    });

  });

});
