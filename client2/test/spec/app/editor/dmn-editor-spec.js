'use strict';

var describeEditor = require('./commons').describeEditor;

var DmnEditor = require('app/editor/dmn-editor');

var Config = require('test/helper/mock/config');

var select = require('test/helper/vdom').select,
    render = require('test/helper/vdom').render,
    simulateEvent = require('test/helper/vdom').simulateEvent;

var initialXML = require('app/tabs/dmn/table.dmn'),
    otherXML = require('./other.dmn');

var spy = require('test/helper/util/spy');


function createEditor() {
  return new DmnEditor({
    layout: {
      propertiesPanel: {}
    }
  });
}

describeEditor('DmnEditor', {
  createEditor: createEditor,
  initialXML: initialXML,
  otherXML: otherXML,
  isDiagramEditor: true
});


describe('DmnEditor', function() {

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
      return new DmnEditor({
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
      return new DmnEditor({
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


    describe('drd', function() {

      it('should open via toggle', function(done) {

        // given
        var editor = createEditorWithLayout({
          propertiesPanel: {
            open: false,
            width: 150
          }
        });

        // simulate activeEditor=drd
        editor.getActiveEditorName = function() {
          return 'drd';
        };

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

        // simulate activeEditor=drd
        editor.getActiveEditorName = function() {
          return 'drd';
        };

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

      targetMock.className = 'dmn-editor';

      var inputMock = document.createElement('input');

      targetMock.appendChild(inputMock);

      // when
      editor.emit('input:focused', { target: inputMock });

      // then
      expect(stateSpy).to.have.been.called;
    });

  });

});
