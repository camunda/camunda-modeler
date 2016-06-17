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
  otherXML: otherXML
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
