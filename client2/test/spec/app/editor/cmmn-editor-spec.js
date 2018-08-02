'use strict';

var describeEditor = require('./commons').describeEditor;

var CmmnEditor = require('app/editor/cmmn-editor');

var Config = require('test/helper/mock/config');

var select = require('test/helper/vdom').select,
    render = require('test/helper/vdom').render,
    simulateEvent = require('test/helper/vdom').simulateEvent;

var initialXML = require('app/tabs/cmmn/initial.cmmn'),
    otherXML = require('test/fixtures/other.cmmn');

var spy = require('test/helper/util/spy');

function createEditor() {
  return new CmmnEditor({
    config: new Config(),
    layout: {
      propertiesPanel: {}
    },
    metaData: {
      version: '1.2.3',
      name: 'Camunda Modeler FTW'
    }
  });
}

describeEditor('CmmnEditor', {
  createEditor: createEditor,
  initialXML: initialXML,
  otherXML: otherXML,
  isDiagramEditor: true
});


describe('CmmnEditor', function() {

  var editor;

  beforeEach(function() {
    editor = createEditor();
  });

  it('should initialize modeler', function(done) {

    // given
    var $el = document.createElement('div');

    editor.once('imported', function() {

      // then

      // modeler got initialized
      expect(editor.modeler).to.exist;

      done();
    });

    // when
    editor.setXML(initialXML);

    editor.mountEditor($el);
  });


  describe('custom events', function() {

    function createEditorWithLayout(layout) {
      return new CmmnEditor({
        config: new Config(),
        layout: layout,
        metaData: {}
      });
    }

    it('"toggleProperties" should toggle properties panel', function(done) {

      // given
      var editor = createEditorWithLayout({
        propertiesPanel: {
          open: true,
          width: 250
        }
      });

      render(editor);

      editor.once('layout:changed', function(newLayout) {

        // then
        expect(newLayout).to.eql({
          propertiesPanel: {
            open: false
          }
        });

        done();
      });

      // when
      editor.triggerAction('toggleProperties');
    });


    it('"resetProperties" should reset properties panel', function(done) {

      // given
      var editor = createEditorWithLayout({
        propertiesPanel: {
          open: true,
          width: 500
        }
      });

      render(editor);

      editor.once('layout:changed', function(newLayout) {

        // then
        expect(newLayout).to.eql({
          propertiesPanel: {
            open: false,
            width: 250
          }
        });

        done();
      });

      // when
      editor.triggerAction('resetProperties');
    });

  });


  describe('properties panel', function() {

    function selectPropertiesToggle(tree) {
      return select('[ref=properties-toggle]', tree);
    }

    function createEditorWithLayout(layout) {
      return new CmmnEditor({
        config: new Config(),
        layout: layout,
        metaData: {}
      });
    }

    it('should close', function(done) {

      // given
      var editor = createEditorWithLayout({
        propertiesPanel: {
          open: true,
          width: 150
        }
      });

      var tree = render(editor);

      var element = selectPropertiesToggle(tree);

      editor.once('layout:changed', function(newLayout) {

        // then
        expect(newLayout).to.eql({
          propertiesPanel: {
            open: false,
            width: 150
          }
        });

        done();
      });

      // when
      // close toggle
      simulateEvent(element, 'click');
    });


    it('should open', function(done) {

      // given
      var editor = createEditorWithLayout({
        propertiesPanel: {
          open: false,
          width: 150
        }
      });

      var tree = render(editor);

      var element = selectPropertiesToggle(tree);

      editor.once('layout:changed', function(newLayout) {

        // then
        expect(newLayout).to.eql({
          propertiesPanel: {
            open: true,
            width: 150
          }
        });

        done();
      });

      // when
      // open toggle
      simulateEvent(element, 'click');
    });


    it('should notify modeler about change', function() {

      // given
      var editor = createEditorWithLayout({
        propertiesPanel: {
          open: false,
          width: 150
        }
      });

      var tree = render(editor);

      var element = selectPropertiesToggle(tree);

      // mock for sake of testing
      var notifySpy = spy(editor, 'notifyModeler');

      // when
      // open toggle
      simulateEvent(element, 'click');

      // then
      expect(notifySpy).to.have.been.calledWith('propertiesPanel.resized');
    });


    it('should resize', function(done) {

      // given
      var editor = createEditorWithLayout({
        propertiesPanel: {
          open: true,
          width: 150
        }
      });

      var tree = render(editor);

      var element = selectPropertiesToggle(tree);


      editor.once('layout:changed', function(newLayout) {

        // then
        expect(newLayout).to.eql({
          propertiesPanel: {
            open: true,
            width: 100
          }
        });

        done();
      });

      // when
      // dragging toggle
      simulateEvent(element, 'dragstart', { clientX: 0, clientY: 0 });
      simulateEvent(element, 'drag', { clientX: 50, clientY: 0 });

    });


    it('should call state if input is active', function() {

      // given
      var stateSpy = spy(editor, 'updateState');

      var targetMock = document.createElement('div');

      targetMock.className = 'cmmn-editor';

      var inputMock = document.createElement('input');

      targetMock.appendChild(inputMock);

      // when
      editor.emit('input:focused', { target: inputMock });

      // then
      expect(stateSpy).to.have.been.called;
    });

  });


  describe('saveXML', function() {

    var testXML = require('./exporter.cmmn');

    it('should set "exported" & "exporterVersion" attributes', function(done) {
      // given
      var $el = document.createElement('div');

      editor.once('shown', function() {
        // make sure diagram is dirty, so it is exported with 'saveXML'
        editor.initialState.stackIndex = 0;

        editor.saveXML(function(err, xml) {

          // then
          // make sure we serialize isExecutable, even if false
          expect(xml).to.contain('exporter="Camunda Modeler FTW"');
          expect(xml).to.contain('exporterVersion="1.2.3"');

          done();
        });
      });

      // when
      editor.setXML(testXML);

      // make sure diagram is dirty, so it is exported with 'saveXML'
      editor.dirty = true;

      editor.mountEditor($el);
    });

  });

});
