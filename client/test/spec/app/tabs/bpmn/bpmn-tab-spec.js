'use strict';

var Events = require('test/helper/mock/events'),
    Logger = require('test/helper/mock/logger');

var BpmnTab = require('app/tabs/bpmn/bpmn-tab');

var select = require('test/helper/vdom').select,
    render = require('test/helper/vdom').render,
    simulateEvent = require('test/helper/vdom').simulateEvent;

var initialXML = require('app/tabs/bpmn/initial.bpmn');

var spy = require('test/helper/util/spy'),
    delay = require('test/helper/util/delay');


function createFile(options) {

  options = options || {};

  return {
    name: 'diagram_1.bpmn',
    path: options.path || 'diagram_1.bpmn',
    contents: options.contents || initialXML,
    fileType: 'bpmn'
  };
}


describe('BpmnTab', function() {

  var events, logger;

  // var unsavedFile = { path: '[unsaved]' };

  beforeEach(function() {
    events = new Events();
    logger = new Logger();
  });

  function createBpmnTab(id, file) {
    var options = {
      closable: true,
      dirty: true,
      id: id,
      events: events,
      file: file || createFile(),
      layout: {
        propertiesPanel: {}
      },
      logger: logger
    };

    return new BpmnTab(options);
  }

  describe('render', function () {

    it('should render a tab -> show diagram', function() {
      // given
      var tab = createBpmnTab('diagram_1');

      // when
      var tree = render(tab);

      // then
      expect(select('.diagram-tab', tree)).to.exist;
      expect(select('.bpmn-editor', tree)).to.exist;

      expect(select('.xml-editor', tree)).to.not.exist;
    });


    it('should render a tab -> show xml', function() {
      // given
      var tab = createBpmnTab('diagram_1'),
          tree;

      // when
      tab.activeView = tab.getView('xml');

      tree = render(tab);

      // then
      expect(select('.diagram-tab', tree)).to.exist;
      expect(select('.xml-editor', tree)).to.exist;

      expect(select('.bpmn-editor', tree)).to.not.exist;
    });

  });

  describe.only('integration', function () {
    var tab, xmlEditor, bpmnEditor;

    beforeEach(function() {
      tab = createBpmnTab('diagram_1');

      bpmnEditor = tab.getView('diagram');
      xmlEditor = tab.getView('xml');
    });

    it('should switch from diagram view to xml view', function() {
      // when
      tab.showView('xml');

      // then
      expect(tab.activeView).to.equal(xmlEditor);

      expect(xmlEditor.newXML).to.equal(initialXML);
    });


    it('should share same XML between xml -> diagram', function() {
      // given
      var otherXML = require('test/fixtures/other.bpmn');

      // when
      tab.showView('xml');

      xmlEditor.setXML(otherXML);

      tab.showView('diagram');

      // then
      expect(tab.activeView).to.equal(xmlEditor);

      expect(bpmnEditor.newXML).to.equal(otherXML);
    });


    it.skip('should NOT switch to diagram with xml view errors', function() {
      // given
      bpmnEditor.saveXml = function(done) {
        done(null, initialXML);
      };

      bpmnEditor.loadXml = function(xml, opts, done) {
        done(new Error('cannot load xml'));
      };

      tab.showView('xml');

      // when
      tab.showView('diagram');

      // then
      expect(tab.activeView.id).to.equal(xmlEditor.id);
    });

  });

  describe('warnings', function () {
    var tab, xmlEditor, bpmnEditor;

    beforeEach(function() {
      tab = createBpmnTab('diagram_1');

      bpmnEditor = tab.getView('diagram');
      xmlEditor = tab.getView('xml');

      xmlEditor.mountEditor(document.createElement('div'));
    });

    it('should show warnings', function() {
      // given
      bpmnEditor.saveXml = function(done) {
        done(null, initialXML);
      };

      // when
      tab.showView('xml');

      bpmnEditor.loadXml = function(xml, opts, done) {
        bpmnEditor.warnings = { warnings: [ 'foo', 'bar' ]};

        done(null);
      };

      tab.showView('diagram');

      var tree = render(tab);

      // then
      expect(bpmnEditor.warnings).to.exist;
      expect(select('.bpmn-warnings', tree)).to.exist;
    });


    it('should STILL show warnings', function() {
      // given
      bpmnEditor.saveXml = function(done) {
        done(null, initialXML);
      };

      // when
      tab.showView('xml');

      bpmnEditor.loadXml = function(xml, opts, done) {
        bpmnEditor.warnings = { warnings: [ 'foo', 'bar' ]};

        done(null);
      };

      tab.showView('diagram');

      var tree = render(tab);

      // then
      expect(bpmnEditor.warnings).to.exist;
      expect(select('.bpmn-warnings', tree)).to.exist;
    });


    it('should close warnings overlay', function() {
      var tree;

      // given
      bpmnEditor.saveXml = function(done) {
        done(null, initialXML);
      };

      // when
      tab.showView('xml');

      bpmnEditor.loadXml = function(xml, opts, done) {
        bpmnEditor.warnings = { warnings: [ 'foo', 'bar' ]};

        done(null);
      };

      tab.showView('diagram');

      // when
      bpmnEditor.closeWarningsOverlay();

      tree = render(tab);

      // then
      expect(bpmnEditor.warnings).to.not.exist;
      expect(select('.bpmn-warnings', tree)).to.not.exist;
    });

  });

});
