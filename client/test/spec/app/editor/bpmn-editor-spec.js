'use strict';

var describeEditor = require('./commons').describeEditor;

var BpmnEditor = require('app/editor/bpmn-editor');

var Config = require('test/helper/mock/config'),
    Plugins = require('test/helper/mock/plugins');

var select = require('test/helper/vdom').select,
    render = require('test/helper/vdom').render,
    simulateEvent = require('test/helper/vdom').simulateEvent;

var initialXML = require('app/tabs/bpmn/initial.bpmn'),
    otherXML = require('test/fixtures/other.bpmn');

var spy = require('test/helper/util/spy');

function createEditor() {
  return new BpmnEditor({
    config: new Config(),
    plugins: new Plugins(),
    layout: {
      propertiesPanel: {},
      minimap: {}
    },
    metaData: {
      version: '1.2.3',
      name: 'Zeebe Modeler FTW'
    }
  });
}

describeEditor('BpmnEditor', {
  createEditor: createEditor,
  initialXML: initialXML,
  otherXML: otherXML,
  isDiagramEditor: true
});


describe('BpmnEditor', function() {

  var editor;

  beforeEach(function() {
    editor = createEditor();
  });

  describe('custom events', function(done) {

    var trigger;

    function createEditorWithLayout(layout) {
      return new BpmnEditor({
        config: new Config(),
        plugins: new Plugins(),
        layout: layout,
        metaData: {}
      });
    }

    beforeEach(function(done) {

      // given
      var $el = document.createElement('div');

      editor.mountEditor($el);

      editor.setXML(initialXML);

      editor.once('imported', function() {
        // editor initialized
        var modeler = editor.getModeler();

        var editorActions = modeler.get('editorActions', false);

        trigger = spy(editorActions, 'trigger');

        done();
      });
    });


    it('"moveCanvas" should have default speed set to "20"', function() {

      // given
      var moveSpeed = 20;

      // when
      editor.triggerAction('moveCanvas', {
        direction: 'up'
      });
      editor.triggerAction('moveCanvas', {
        direction: 'down'
      });
      editor.triggerAction('moveCanvas', {
        direction: 'left'
      });
      editor.triggerAction('moveCanvas', {
        direction: 'right'
      });

      // then
      expect(trigger.getCall(0)).to.have.been.calledWith('moveCanvas', {
        direction: 'up',
        speed: moveSpeed
      });

      expect(trigger.getCall(1)).to.have.been.calledWith('moveCanvas', {
        direction: 'down',
        speed: moveSpeed
      });

      expect(trigger.getCall(2)).to.have.been.calledWith('moveCanvas', {
        direction: 'left',
        speed: moveSpeed
      });

      expect(trigger.getCall(3)).to.have.been.calledWith('moveCanvas', {
        direction: 'right',
        speed: moveSpeed
      });
    });


    it('"zoomIn" should call "stepZoom" event with positive value', function() {

      // when
      editor.triggerAction('zoomIn');

      // then
      expect(trigger).to.have.been.calledWith('stepZoom', {
        value: 1
      });
    });


    it('"zoomOut" should call "stepZoom" event with negative value', function() {

      // when
      editor.triggerAction('zoomOut');

      // then
      expect(trigger).to.have.been.calledWith('stepZoom', {
        value: -1
      });
    });


    it('"zoom" should call "zoom" event with value "1"', function() {

      // when
      editor.triggerAction('zoom');

      // then
      expect(trigger).to.have.been.calledWith('zoom', {
        value: 1
      });
    });


    it('"zoom" should call "zoom" event with value "fit-viewport"', function() {

      // when
      editor.triggerAction('zoomFit');

      // then
      expect(trigger).to.have.been.calledWith('zoom', {
        value: 'fit-viewport'
      });
    });


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


  it('should call state if input is active', function() {
    // given
    var stateSpy = spy(editor, 'updateState');
    var targetMock = document.createElement('div');
    targetMock.className = 'bpmn-editor';
    var inputMock = document.createElement('input');
    targetMock.appendChild(inputMock);

    // when
    editor.emit('input:focused', { target: inputMock });

    // then
    expect(stateSpy).to.have.been.called;
  });


  describe('element templates', function() {

    it('should load', function(done) {

      // given
      editor.config.provide('bpmn.elementTemplates', function(key, diagram, done) {

        var templates = [
          {
            label: 'FOO',
            id: 'foo',
            appliesTo: [
              'bpmn:ServiceTask'
            ],
            properties: []
          }
        ];

        done(null, templates);
      });

      var $el = document.createElement('div');

      editor.once('imported', function(context) {

        var elementTemplates = editor.modeler.get('elementTemplates');

        // then
        expect(elementTemplates).to.exist;
        expect(elementTemplates.get('foo')).to.exist;

        done();
      });

      // when
      editor.setXML(initialXML);

      editor.mountEditor($el);
    });


    it('should log load error', function(done) {

      var templatesLoaded;

      // given
      editor.config.provide('bpmn.elementTemplates', function(key, diagram, done) {
        templatesLoaded = function() {
          done(new Error('foo bar'));
        };
      });

      var $el = document.createElement('div');

      var loggedWarnings;

      editor.once('log', function(entries) {
        loggedWarnings = entries;
      });

      editor.once('imported', function(context) {

        // when
        templatesLoaded();

        // then
        expect(loggedWarnings).to.eql([
          [ 'warning', 'Some element templates could not be parsed' ],
          [ 'warning', '> foo bar' ],
          [ 'warning', '' ]
        ]);

        done();
      });

      editor.setXML(initialXML);

      editor.mountEditor($el);
    });


    it('should apply default templates on import of initial diagram [StartEvent]', function(done) {

      // given
      editor.config.provide('bpmn.elementTemplates', function(key, diagram, done) {

        var templates = [
          {
            label: 'FOO',
            id: 'foo',
            appliesTo: [
              'bpmn:StartEvent'
            ],
            properties: [{
              label: 'Label',
              type: 'Text',
              value: 'bar',
              binding: {
                type: 'property',
                name: 'name'
              }
            }],
            isDefault: true
          }
        ];

        done(null, templates);
      });

      var $el = document.createElement('div');

      editor.once('imported', function(context) {

        var modeler = editor.getModeler();

        var elementRegistry = modeler.get('elementRegistry');

        var startEvent = elementRegistry.get('StartEvent_1').businessObject;

        expect(startEvent.modelerTemplate).to.eql('foo');
        expect(startEvent.name).to.eql('bar');

        done();
      });

      // when
      editor.setFile({ contents: initialXML, isInitial: true });

      editor.mountEditor($el);
    });


    it('should apply default templates on import of initial diagram [Process]', function(done) {

      // given
      editor.config.provide('bpmn.elementTemplates', function(key, diagram, done) {

        var templates = [
          {
            label: 'FOO',
            id: 'foo',
            appliesTo: [
              'bpmn:Process'
            ],
            properties: [{
              label: 'Label',
              type: 'Text',
              value: 'bar',
              binding: {
                type: 'property',
                name: 'name'
              }
            }],
            isDefault: true
          }
        ];

        done(null, templates);
      });

      var $el = document.createElement('div');

      editor.once('imported', function(context) {
        var modeler = editor.getModeler();

        var canvas = modeler.get('canvas');

        var process = canvas.getRootElement().businessObject;

        expect(process.modelerTemplate).to.eql('foo');
        expect(process.name).to.eql('bar');

        done();
      });

      // when
      editor.setFile({ contents: initialXML, isInitial: true });

      editor.mountEditor($el);
    });


    it('should not apply default templates on import of exisiting diagram [Process]', function(done) {

      // given
      editor.config.provide('bpmn.elementTemplates', function(key, diagram, done) {

        var templates = [
          {
            label: 'FOO',
            id: 'foo',
            appliesTo: [
              'bpmn:Process'
            ],
            properties: [],
            isDefault: true
          }
        ];

        done(null, templates);
      });

      var $el = document.createElement('div');

      editor.once('imported', function() {
        var modeler = editor.getModeler();

        var canvas = modeler.get('canvas');

        var process = canvas.getRootElement().businessObject;

        expect(process.modelerTemplate).to.be.undefined;

        done();
      });

      // when
      editor.setFile({ contents: initialXML });

      editor.mountEditor($el);
    });

  });


  it('should keep last import results', function(done) {

    // given
    var $el = document.createElement('div');

    editor.once('imported', function(context) {
      // then
      expect(context).to.exist;

      expect(editor.lastImport).to.exist;
      done();
    });

    // when
    editor.setXML(initialXML);

    editor.mountEditor($el);
  });


  it('should respond with last import results if no XML change', function(done) {

    // given
    var $el = document.createElement('div');

    editor.once('shown', function() {

      var lastImport = editor.lastImport;

      editor.once('shown', function(context) {
        // then
        expect(context).to.equal(lastImport);

        done();
      });

      // when
      // set same XML again
      editor.setXML(initialXML);
    });

    editor.setXML(initialXML);

    editor.mountEditor($el);
  });


  describe('properties panel', function() {

    function selectPropertiesToggle(tree) {
      return select('[ref=properties-toggle]', tree);
    }

    function createEditorWithLayout(layout) {
      return new BpmnEditor({
        config: new Config(),
        plugins: new Plugins(),
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
        },
        minimap: {
          open: true
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

  });


  describe('saveXML', function() {

    var testXML = require('./process-missing-executable.bpmn');


    it('should serialize isExecutable', function(done) {

      // given
      var $el = document.createElement('div');

      editor.once('shown', function() {
        // make sure diagram is dirty, so it is exported with 'saveXML'
        editor.initialState.stackIndex = 0;

        editor.saveXML(function(err, xml) {
          // then
          // make sure we serialize isExecutable, even if false
          expect(xml).to.contain('isExecutable="false"');

          done();
        });
      });

      // when
      editor.setXML(testXML);

      editor.mountEditor($el);
    });


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
