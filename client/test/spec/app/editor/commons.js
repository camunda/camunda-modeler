'use strict';

var ensureOpts = require('util/ensure-opts');

var spy = require('test/helper/util/spy');


function describeEditor(name, options) {

  ensureOpts([
    'createEditor',
    'initialXML',
    'otherXML'
  ], options);

  var createEditor = options.createEditor;

  var initialXML = options.initialXML;

  var otherXML = options.otherXML;

  var describeFn = options.only ? describe.only : describe;

  var hasGlobalUndo = !!options.globalUndo;


  /**
   * A common describe for all mountable editors
   */
  describeFn(name + ' - base -', function() {

    var editor;

    beforeEach(function() {
      editor = createEditor();
    });


    it('should mount editor', function(done) {

      // given
      var $el = document.createElement('div');

      editor.once('mounted', function() {

        // then
        // editor got mounted
        expect($el.childNodes).to.have.length(1);

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


    describe('events', function() {

      it('should emit <shown> without XML', function(done) {

        // given
        var $el = document.createElement('div');

        // wait for diagram shown / imported
        editor.on('shown', function(context) {
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
          editor.setXML(otherXML);
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
        var newXML = otherXML;

        var $el = document.createElement('div');

        // when
        editor.once('shown', function() {

          editor.once('state-updated', function(context) {

            // then
            expect(context).to.eql({
              undo: hasGlobalUndo,
              redo: false,
              dirty: true
            });

            done();
          });

          // when
          // updating to new file
          editor.setXML(newXML);

        }, 300);

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

  });

}

module.exports.describeEditor = describeEditor;

module.exports.describeEditor.only = function(name, options) {
  options.only = true;

  return describeEditor(name, options);
};