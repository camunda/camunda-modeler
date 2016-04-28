'use strict';

var describeEditor = require('./commons').describeEditor;

var BpmnEditor = require('app/editor/bpmn-editor');

var Config = require('test/helper/mock/config');

var select = require('test/helper/vdom').select,
    render = require('test/helper/vdom').render,
    simulateEvent = require('test/helper/vdom').simulateEvent;

var initialXML = require('app/tabs/bpmn/initial.bpmn'),
    otherXML = require('test/fixtures/other.bpmn');

var spy = require('test/helper/util/spy');

function createEditor() {
  return new BpmnEditor({
    config: new Config(),
    layout: {
      propertiesPanel: {}
    }
  });
}

describeEditor('BpmnEditor', {
  createEditor: createEditor,
  initialXML: initialXML,
  otherXML: otherXML
});


describe('BpmnEditor', function() {

  var editor;

  beforeEach(function() {
    editor = createEditor();
  });


  describe('custom events', function(done) {

    var trigger;

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


  it('should load element templates', function(done) {

    // given
    editor.config.set('bpmn.elementTemplates', [
      {
        label: 'FOO',
        id: 'foo',
        appliesTo: [
          'bpmn:ServiceTask'
        ],
        properties: []
      }
    ]);

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
        layout: layout
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
      simulateEvent(element, 'dragstart', { screenX: 0, screenY: 0 });
      simulateEvent(element, 'drag', { screenX: 50, screenY: 0 });

    });

  });


  describe('import warnings overlay', function() {

    it('should hide without import information', function() {

      // given
      editor.lastImport = null;

      // when
      var tree = render(editor);

      // then
      expect(select('[ref=warnings-overlay]', tree)).not.to.exist;
    });


    it('should hide if no warnings', function() {

      // given
      editor.lastImport = {
        warnings: []
      };

      // when
      var tree = render(editor);

      // then
      expect(select('[ref=warnings-overlay]', tree)).not.to.exist;
    });


    it('should show if warnings', function() {

      // given
      editor.lastImport = {
        warnings: [
          new Error('foo bar')
        ]
      };

      // when
      var tree = render(editor);

      // then
      expect(select('[ref=warnings-overlay]', tree)).to.exist;
    });


    it('should hide', function() {

      // given
      editor.lastImport = {
        warnings: [
          new Error('foo bar')
        ]
      };

      // when
      var tree = render(editor);

      var hideWarningsElement = select('[ref=warnings-hide-link]', tree);

      simulateEvent(hideWarningsElement, 'click');

      // then
      // we simply discard the last import information
      expect(editor.lastImport).not.to.exist;
    });


    it('should show details', function(done) {

      // given
      editor.lastImport = {
        warnings: [
          new Error('foo bar'),
          new Error('foo BABA')
        ]
      };

      editor.once('log:toggle', function(state) {

        // then
        expect(state.open).to.be.true;

        done();
      });

      // when
      var tree = render(editor);

      var showDetailsElement = select('[ref=warnings-details-link]', tree);

      simulateEvent(showDetailsElement, 'click');
    });

  });


  describe('saveXML', function() {

    var testXML = require('./process-missing-executable.bpmn');


    it('should serialize isExecutable', function(done) {

      // given
      var $el = document.createElement('div');

      editor.once('shown', function() {

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

  });

});
