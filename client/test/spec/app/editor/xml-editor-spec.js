'use strict';

var XMLEditor = require('app/editor/xml-editor');

var initialXML = require('app/tabs/bpmn/initial.bpmn');

var spy = require('test/helper/util/spy');


describe('XMLEditor', function() {

  var editor;

  beforeEach(function() {
    editor = new XMLEditor({});
  });


  it('should mount editor', function(done) {

    // given
    var $el = document.createElement('div');

    editor.once('mounted', function() {

      // then
      // editor got mounted
      expect($el.childNodes.length).to.eql(1);

      done();
    });

    // when
    editor.mountEditor($el);
  });


  it('should unmount editor', function(done) {

    // given
    var $el = document.createElement('div');

    editor.mountEditor($el);

    editor.once('unmounted', function() {

      // then
      // editor got unmounted
      expect($el.childNodes).to.have.length(0);

      done();
    });

    // when
    editor.unmountEditor($el);
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


  describe('events', function() {

    it('should emit <shown> without XML', function(done) {

      // given
      var $el = document.createElement('div');

      // wait for diagram shown / imported
      editor.on('shown', function(context) {

        expect(context).to.exist;
        done();
      });

      // when
      editor.mountEditor($el);
    });


    it('should emit <shown> with XML', function(done) {

      // given
      var $el = document.createElement('div');

      // wait for diagram shown / imported
      editor.on('shown', function(context) {

        expect(context).to.exist;
        done();
      });

      // when
      editor.setXML(initialXML);

      editor.mountEditor($el);
    });


    it('should emit <state-updated> before <shown>', function(done) {

      // given
      var $el = document.createElement('div');

      var eventSequence = [];

      editor.on('state-updated', function() {
        eventSequence.push('state-updated');
      });

      // wait for diagram shown / imported
      editor.on('shown', function() {
        eventSequence.push('shown');

        expect(eventSequence).to.eql([ 'state-updated', 'shown' ]);

        done();
      });

      // when
      editor.mountEditor($el);
    });

  });


  describe('importing', function() {

    it('should not import new XML if unmounted');


    it('should import new XML on mount', function(done) {

      // given
      var $el = document.createElement('div');

      editor.once('imported', function(context) {
        // then
        expect(context).to.exist;

        done();
      });

      // when
      editor.setXML(initialXML);

      editor.mountEditor($el);
    });


    it('should import new XML if already mounted', function(done) {

      // given
      var $el = document.createElement('div');

      editor.once('shown', function(context) {

        editor.once('imported', function(context) {

          // then
          expect(context).to.exist;

          done();
        });

        // when
        editor.setXML(initialXML + '    ');
      });

      editor.setXML(initialXML);
      editor.mountEditor($el);
    });


    it('should not reimport same XML', function(done) {

      // given
      var $el = document.createElement('div');

      var reimportSpy = spy(function() { });

      editor.once('shown', function(context) {

        editor.once('imported', reimportSpy);

        editor.once('shown', function(context) {

          // then
          expect(reimportSpy).not.to.have.been.called;

          done();
        });

        // when
        editor.setXML(initialXML);
      });

      editor.setXML(initialXML);
      editor.mountEditor($el);
    });


    it('should not import without XML');

  });


  describe('editor state', function() {

    it('should update on import', function(done) {

      // given
      var $el = document.createElement('div');

      // wait for diagram shown / imported
      editor.once('state-updated', function(context) {

        // then
        expect(context).to.eql({
          undo: false,
          redo: false,
          dirty: false
        });

        done();
      });

      // when
      editor.setXML(initialXML, {});

      editor.mountEditor($el);
    });


    it('should update on re-mount', function(done) {

      // given
      var $el = document.createElement('div');

      // when
      // mount -> unmount -> remount

      // (1.1) mounted
      editor.once('shown', function() {

        // (2) unmount
        editor.unmountEditor($el);

        editor.once('state-updated', function(context) {

          // then
          expect(context).to.eql({
            undo: false,
            redo: false,
            dirty: false
          });

          done();
        });

        // (3) remount
        editor.mountEditor($el);
      });

      // (1) mount
      editor.setXML(initialXML, {});

      editor.mountEditor($el);
    });


    it('should update on new XML', function(done) {

      // given
      var newXML = require('test/fixtures/other.bpmn');

      var $el = document.createElement('div');

      // when
      editor.once('shown', function() {

        editor.once('state-updated', function(context) {

          // then
          expect(context).to.eql({
            undo: true,
            redo: false,
            dirty: true
          });

          done();
        });

        // when
        // updating to new file
        editor.setXML(newXML);

      });

      editor.setXML(initialXML, {});
      editor.mountEditor($el);
    });


    it('should reflect initial dirty state', function(done) {

      // given
      var $el = document.createElement('div');

      // wait for diagram shown / imported
      editor.once('state-updated', function(context) {

        // then
        expect(context).to.eql({
          undo: false,
          redo: false,
          dirty: true
        });

        done();
      });

      // when
      editor.setXML(initialXML, { dirty: true });

      editor.mountEditor($el);
    });

  });


  describe('history', function() {

    function getXML(editor) {
      return editor.codemirror.getValue();
    }


    it('should append to history on new XML', function(done) {

      // given
      var newXML = require('test/fixtures/other.bpmn');

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
