'use strict';

var Events = require('test/helper/mock/events'),
    Logger = require('base/logger'),
    Dialog = require('test/helper/mock/dialog');

var BpmnTab = require('app/tabs/bpmn/bpmn-tab');

var select = require('test/helper/vdom').select,
    render = require('test/helper/vdom').render,
    simulateEvent = require('test/helper/vdom').simulateEvent;

var initialXML = require('app/tabs/bpmn/initial.bpmn');

var spy = require('test/helper/util/spy');


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

  var events, logger, dialog;

  beforeEach(function() {
    events = new Events();
    logger = new Logger();
    dialog = new Dialog();
  });

  function createBpmnTab(id, file) {
    var options = {
      closable: true,
      dirty: true,
      id: id,
      events: events,
      dialog: dialog,
      file: file || createFile(),
      layout: {
        propertiesPanel: {}
      },
      logger: logger
    };

    return new BpmnTab(options);
  }


  describe('render', function () {

    it('should render view <diagram>', function() {

      // given
      var tab = createBpmnTab('diagram_1');

      // when
      var tree = render(tab);

      // then
      expect(select('.multi-editor-tab', tree)).to.exist;
      expect(select('.bpmn-editor', tree)).to.exist;

      expect(select('.xml-editor', tree)).to.not.exist;
    });


    it('should render view <xml>', function() {

      // given
      var tab = createBpmnTab('diagram_1');

      // when
      tab.setEditor(tab.getEditor('xml'));

      var tree = render(tab);

      // then
      expect(select('.multi-editor-tab', tree)).to.exist;
      expect(select('.xml-editor', tree)).to.exist;

      expect(select('.bpmn-editor', tree)).to.not.exist;
    });


    it('should switch view', function() {

      // given
      var tab = createBpmnTab('diagram_1');

      var showEditor = spy(tab, 'showEditor');

      var tree = render(tab);

      // when
      var xmlSwitch = select('[ref=xml-switch]', tree);
      simulateEvent(xmlSwitch, 'click');

      // then
      expect(showEditor).to.have.been.called;
    });

  });


  describe('views', function () {

    var otherXML = require('test/fixtures/other.bpmn');


    var tab, xmlEditor, bpmnEditor;

    beforeEach(function() {
      tab = createBpmnTab('diagram_1');

      bpmnEditor = tab.getEditor('diagram');
      xmlEditor = tab.getEditor('xml');
    });


    it('should switch from <diagram> to <xml> view', function() {

      // given
      bpmnEditor.saveXML = function(done) {
        done(null, initialXML);
      };

      var setXML = spy(xmlEditor, 'setXML');

      // when
      tab.showEditor('xml');

      // then
      expect(tab.activeEditor).to.equal(xmlEditor);

      expect(setXML).to.have.been.calledWith(initialXML);
    });


    it('should switch from <xml> to <diagram> view', function() {

      // given
      tab.activeEditor = xmlEditor;

      xmlEditor.saveXML = function(done) {
        done(null, otherXML);
      };

      var setXML = spy(bpmnEditor, 'setXML');

      // when
      tab.showEditor('diagram');

      // then
      expect(tab.activeEditor).to.equal(bpmnEditor);

      expect(setXML).to.have.been.calledWith(otherXML);
    });


    it('should handle export errors', function() {

      // given
      var exportError = new Error('could not save');

      bpmnEditor.saveXML = function(done) {
        done(exportError);
      };

      // when
      tab.showEditor('xml');

      // then
      expect(tab.activeEditor).to.equal(bpmnEditor);

      expect(dialog.exportError).to.have.been.calledWith(exportError);
    });


    it('should handle view import errors and switch back', function() {

      // given
      var importError = new Error('could not open');

      tab.activeEditor = xmlEditor;

      xmlEditor.saveXML = function(done) {
        done(null, otherXML);
      };

      bpmnEditor.setXML = function(xml) {
        // trigger shown with import error
        this.emit('shown', { error: importError });
      };

      // when
      tab.showEditor('diagram');

      // then
      expect(tab.activeEditor).to.equal(xmlEditor);

      expect(dialog.importError).to.have.been.calledWith(importError);
    });

  });

});
