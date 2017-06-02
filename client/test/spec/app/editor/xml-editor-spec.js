'use strict';

var describeEditor = require('./commons').describeEditor;

var XMLEditor = require('app/editor/xml-editor');

var initialXML = require('app/tabs/bpmn/initial.bpmn'),
    otherXML = require('test/fixtures/other.bpmn');

function createEditor() {
  return new XMLEditor({});
}


describeEditor('XMLEditor', {
  createEditor: createEditor,
  initialXML: initialXML,
  otherXML: otherXML,
  globalUndo: true,
  isDiagramEditor: false
});


describe('XMLEditor', function() {

  var editor;

  beforeEach(function() {
    editor = new XMLEditor({});
  });


  it('should initialize codemirror', function(done) {

    // given
    var $el = document.createElement('div');

    editor.once('shown', function() {

      // then
      // codemirror got initialized
      expect(editor.codemirror).to.exist;

      done();
    });

    // when
    editor.mountEditor($el);
  });


  describe('history', function() {

    function getXML(editor) {
      return editor.codemirror.getValue();
    }


    it('should append to history on new XML', function(done) {

      // given
      var newXML = otherXML;

      var $el = document.createElement('div');

      // when
      editor.once('shown', function() {

        editor.once('updated', function(context) {

          // when
          // shouldn't change beyond first import
          // (beginning of history)
          editor.triggerAction('undo');
          editor.triggerAction('undo');
          editor.triggerAction('undo');

          // then
          expect(getXML(editor)).to.equal(initialXML);

          // when
          editor.triggerAction('redo');

          // then
          expect(getXML(editor)).to.equal(newXML);

          done();
        });

        // updating to new file
        editor.setXML(newXML);
      });

      editor.setXML(initialXML);
      editor.mountEditor($el);
    });

  });

});
