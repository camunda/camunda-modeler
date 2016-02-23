'use strict';

var describeEditor = require('./commons').describeEditor;

var BpmnEditor = require('app/editor/bpmn-editor');

var select = require('test/helper/vdom').select,
    render = require('test/helper/vdom').render,
    simulateEvent = require('test/helper/vdom').simulateEvent;

var initialXML = require('app/tabs/bpmn/initial.bpmn'),
    otherXML = require('test/fixtures/other.bpmn');

function createEditor() {
  return new BpmnEditor({
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


    it('should close', function(done) {

      // given
      var editor = new BpmnEditor({
        layout: {
          propertiesPanel: {
            open: true,
            width: 150
          }
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
      var editor = new BpmnEditor({
        layout: {
          propertiesPanel: {
            open: false,
            width: 150
          }
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


    it('should resize', function(done) {

      // given
      var editor = new BpmnEditor({
        layout: {
          propertiesPanel: {
            open: true,
            width: 150
          }
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

      editor.once('log', function(messages) {

        // then
        expect(messages).to.eql([
          [ 'warn', ' ' ],
          [ 'warn', 'Imported BPMN diagram with 2 warnings' ],
          [ 'warn', '> foo bar' ],
          [ 'warn', '> foo BABA']
        ]);

        done();
      });

      // when
      var tree = render(editor);

      var showDetailsElement = select('[ref=warnings-details-link]', tree);

      simulateEvent(showDetailsElement, 'click');
    });

  });

});
