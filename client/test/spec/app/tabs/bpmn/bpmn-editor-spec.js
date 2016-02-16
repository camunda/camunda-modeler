'use strict';

var Events = require('test/helper/mock/events'),
    Logger = require('test/helper/mock/logger');

var BpmnEditor = require('app/tabs/bpmn/bpmn-editor');

var select = require('test/helper/vdom').select,
    render = require('test/helper/vdom').render,
    simulateEvent = require('test/helper/vdom').simulateEvent;

var initialXML = require('app/tabs/bpmn/initial.bpmn');

var spy = require('test/helper/util/spy'),
    delay = require('test/helper/util/delay');


function findPropertiesToggle(tree) {
  return select('[ref=properties-toggle]', tree);
}

function createFile(options) {

  options = options || {};

  return {
    name: 'diagram_1.bpmn',
    path: options.path || 'diagram_1.bpmn',
    contents: options.contents || initialXML,
    fileType: 'bpmn'
  };
}


describe('BpmnEditor', function() {

  var events, tab;

  var unsavedFile = { path: '[unsaved]' };

  beforeEach(function() {
    events = new Events();

    tab = {
      updateState: spy(function() {})
    };
  });


  function createEditor(fileData) {

    var file = createFile(fileData);

    return new BpmnEditor({
      file: file,
      events: events,
      logger: new Logger(),
      tab: tab,
      layout: {
        propertiesPanel: {}
      }
    });
  }


  it('should mount canvas', function() {

    // given
    var editor = createEditor();
    var $el = document.createElement('div');

    // when
    editor.mountCanvas($el);

    // then
    // modeler got mounted...
    expect($el.childNodes.length).to.eql(1);
  });


  describe('editor state', function() {

    function clearStateUpdated() {
      tab.updateState.reset();
    }

    function verifyStateUpdated(newState) {

      var spy = tab.updateState;

      expect(spy.calledOnce).to.be.true;
      expect(spy).to.have.been.calledWith(newState);

      clearStateUpdated();
    }


    describe('if mounted', function() {

      it('should update importing saved file', function(done) {

        // given
        var editor = createEditor();
        var $el = document.createElement('div');

        // when
        editor.mountCanvas($el);

        // TODO(nre): change to events instead of random delay
        delay(function() {

          // then
          verifyStateUpdated({
            undo: false,
            redo: false,
            dirty: false
          });

          done();
        }, 300);
      });


      it('should update importing unsaved file', function(done) {

        // given
        var editor = createEditor(unsavedFile);
        var $el = document.createElement('div');

        // when
        editor.mountCanvas($el);

        // bpmn-js loads file asynchronously
        delay(function() {

          // then
          verifyStateUpdated({
            undo: false,
            redo: false,
            dirty: true
          });

          done();

        }, 300);

      });


      it('should update reopening file', function(done) {

        // given
        var editor = createEditor(unsavedFile);
        var $el = document.createElement('div');

        editor.mountCanvas($el);

        delay(function() {
          clearStateUpdated();
        }, 300);

        // when
        // reopen
        delay(function() {
          editor.unmountCanvas($el);
          editor.mountCanvas($el);
        }, 400);

        // then
        delay(function() {

          verifyStateUpdated({
            undo: false,
            redo: false,
            dirty: true
          });

          done();
        }, 500);

      });


      it('should update setting new file', function(done) {

        // given
        var newFile = createFile({
          contents: require('./other.bpmn'),
          path: '[unsaved]'
        });

        var editor = createEditor();
        var $el = document.createElement('div');

        editor.mountCanvas($el);

        // when
        delay(function() {
          clearStateUpdated();

          // updating to new file
          editor.setFile(newFile);
        }, 300);

        // then
        delay(function() {

          // update got called properly
          verifyStateUpdated({
            undo: false,
            redo: false,
            dirty: true
          });

          done();
        }, 600);

      });


      it('should update setting same file', function(done) {

        // given
        var editor = createEditor();
        var $el = document.createElement('div');

        editor.mountCanvas($el);

        // when
        delay(function() {
          clearStateUpdated();

          // updating with existing file
          editor.setFile(editor.file);
        }, 300);

        // then
        delay(function() {

          // update got called regardless
          verifyStateUpdated({
            undo: false,
            redo: false,
            dirty: false
          });

          done();
        }, 600);

      });

    });


    describe('if unmounted', function() {

      it('should not update on create', function() {

        // when
        var editor = createEditor();

        // then
        expect(editor.tab.updateState).not.to.have.been.called;
      });


      it('should not update on file change', function() {

        // given
        var editor = createEditor(),
            newFile = createFile({
              contents: require('./other.bpmn')
            });

        // when
        editor.setFile(newFile);

        // then
        expect(editor.tab.updateState).not.to.have.been.called;
      });

    });

  });


  describe('properties panel', function() {

    var events;

    beforeEach(function() {
      events = new Events();
    });


    it('should close', function() {

      // given
      var editor = new BpmnEditor({
        file: createFile(initialXML),
        events: events,
        logger: new Logger(),
        layout: {
          propertiesPanel: {
            open: true,
            width: 150
          }
        }
      });

      var tree = render(editor);

      var element = findPropertiesToggle(tree);

      // when close toggle
      simulateEvent(element, 'click');

      // then
      expect(events.recordedEvents).to.eql([
        [
          'layout:update',
          {
            propertiesPanel: {
              open: false,
              width: 150
            }
          }
        ]
      ]);
    });


    it('should open', function() {

      // given
      var editor = new BpmnEditor({
        file: createFile(initialXML),
        events: events,
        logger: new Logger(),
        layout: {
          propertiesPanel: {
            open: false,
            width: 150
          }
        }
      });

      var tree = render(editor);

      var element = findPropertiesToggle(tree);

      // when close toggle
      simulateEvent(element, 'click');

      // then
      expect(events.recordedEvents).to.eql([
        [
          'layout:update',
          {
            propertiesPanel: {
              open: true,
              width: 150
            }
          }
        ]
      ]);
    });


    it('should resize', function() {

      // given
      var editor = new BpmnEditor({
        file: createFile(initialXML),
        events: events,
        logger: new Logger(),
        layout: {
          propertiesPanel: {
            open: true,
            width: 150
          }
        }
      });

      var tree = render(editor);

      var element = findPropertiesToggle(tree);

      // when dragging
      simulateEvent(element, 'dragstart', { screenX: 0, screenY: 0 });
      simulateEvent(element, 'drag', { screenX: 50, screenY: 0 });

      // then
      expect(events.recordedEvents).to.eql([
        [
          'layout:update',
          {
            propertiesPanel: {
              open: true,
              width: 100
            }
          }
        ]
      ]);

    });

  });

});