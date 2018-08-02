'use strict';

var Events = require('base/events'),
    Dialog = require('test/helper/mock/dialog');

var MultiEditorTab = require('app/tabs/multi-editor-tab');

var TestEditor = require('./test-editor');

import {
  assign
} from 'min-dash';

function createFile(overrides) {

  return assign({
    name: 'file.txt',
    path: 'file.txt',
    contents: 'FOO BAR',
    fileType: 'txt'
  }, overrides);
}

var SAVED_FILE = createFile(),
    UNSAVED_FILE = createFile({ path: '', isUnsaved: true });


describe('MultiEditorTab', function() {

  var events, dialog, tab;

  beforeEach(function() {
    events = new Events();
    dialog = new Dialog();
  });


  function createTab(file) {
    var options = {
      id: 'foo',
      events: events,
      dialog: dialog,
      file: file || SAVED_FILE,
      editorDefinitions: [
        { id: 'foo', label: 'FOO', component: TestEditor },
        { id: 'bar', label: 'BAR', component: TestEditor }
      ]
    };

    return new MultiEditorTab(options);
  }


  describe('editors', function() {

    it('should instantiate', function() {

      // when
      tab = createTab();

      // then
      expect(tab.editors).to.have.length(2);
      expect(tab.editors[0]).to.be.an.instanceof(TestEditor);
    });


    it('should assign active editor', function() {

      // when
      tab = createTab();

      // then
      expect(tab.activeEditor).to.eql(tab.editors[0]);
    });

  });


  describe('dirty state', function() {


    it('should initialize dirty (unsaved file)', function() {

      // when
      tab = createTab(UNSAVED_FILE);

      // then
      expect(tab.dirty).to.be.true;
    });


    it('should initialize clean (saved file)', function() {

      // when
      tab = createTab(SAVED_FILE);

      // then
      expect(tab.dirty).to.be.false;
    });


    it('should set dirty (unsaved file)', function() {

      // given
      tab = createTab(UNSAVED_FILE);

      // when
      tab.setFile(SAVED_FILE);

      // then
      expect(tab.dirty).to.be.false;
    });


    it('should set clean (saved file)', function() {

      // given
      tab = createTab(SAVED_FILE);

      // when
      tab.setFile(UNSAVED_FILE);

      // then
      expect(tab.dirty).to.be.true;
    });


    it('should keep dirty (unsaved file / editor update reports { dirty: false })', function() {

      // given
      tab = createTab(UNSAVED_FILE);

      // when
      tab.activeEditor.emit('state-updated', {
        dirty: false
      });

      // then
      expect(tab.dirty).to.be.true;
    });


    it('should become dirty (saved file / editor update reports { dirty: true }', function() {

      // given
      tab = createTab(SAVED_FILE);

      // when
      tab.activeEditor.emit('state-updated', {
        dirty: true
      });

      // then
      expect(tab.dirty).to.be.true;
    });

  });

});
