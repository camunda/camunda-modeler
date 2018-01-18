'use strict';

var Config = require('test/helper/mock/config'),
    Events = require('base/events'),
    Logger = require('base/logger'),
    Dialog = require('test/helper/mock/dialog');

var CmmnTab = require('app/tabs/cmmn/cmmn-tab');

var select = require('test/helper/vdom').select,
    render = require('test/helper/vdom').render,
    simulateEvent = require('test/helper/vdom').simulateEvent;

var initialXML = require('app/tabs/cmmn/initial.cmmn');

var spy = require('test/helper/util/spy'),
    arg = require('test/helper/util/arg');

var otherXML = require('test/fixtures/other.cmmn');


function createFile(options) {

  options = options || {};

  return {
    name: 'diagram_1.cmmn',
    path: options.path || 'diagram_1.cmmn',
    contents: options.contents || initialXML,
    fileType: 'cmmn'
  };
}


describe('CmmnTab', function() {

  var events, logger, dialog, config;

  beforeEach(function() {
    events = new Events();
    logger = new Logger();
    dialog = new Dialog();
    config = new Config();
  });

  function createCmmnTab(id, file) {
    var options = {
      closable: true,
      dirty: true,
      id: id,
      config: config,
      events: events,
      dialog: dialog,
      file: file || createFile(),
      layout: {
        propertiesPanel: {}
      },
      logger: logger,
      metaData: {}
    };

    return new CmmnTab(options);
  }


  describe('render', function() {

    it('should render view <diagram>', function() {

      // given
      var tab = createCmmnTab('diagram_1');

      // when
      var tree = render(tab);

      // then
      expect(select('.multi-editor-tab', tree)).to.exist;
      expect(select('.cmmn-editor', tree)).to.exist;

      expect(select('.xml-editor', tree)).to.not.exist;
    });


    it('should render view <xml>', function() {

      // given
      var tab = createCmmnTab('diagram_1');

      // when
      tab.setEditor(tab.getEditor('xml'));

      var tree = render(tab);

      // then
      expect(select('.multi-editor-tab', tree)).to.exist;
      expect(select('.xml-editor', tree)).to.exist;

      expect(select('.cmmn-editor', tree)).to.not.exist;
    });


    it('should switch view', function() {

      // given
      var tab = createCmmnTab('diagram_1');

      var showEditor = spy(tab, 'showEditor');

      var tree = render(tab);

      // when
      var xmlSwitch = select('[ref=xml-switch]', tree);
      simulateEvent(xmlSwitch, 'click');

      // then
      expect(showEditor).to.have.been.called;
    });

  });


  describe('views', function() {

    var tab, xmlEditor, cmmnEditor;

    beforeEach(function() {
      tab = createCmmnTab('diagram_1');

      cmmnEditor = tab.getEditor('diagram');
      xmlEditor = tab.getEditor('xml');
    });


    it('should switch from <diagram> to <xml> view', function() {

      // given
      cmmnEditor.saveXML = function(done) {
        done(null, initialXML);
      };

      var setXML = spy(xmlEditor, 'setXML');

      // when
      tab.showEditor('xml');

      // then
      expect(tab.activeEditor).to.equal(xmlEditor);

      expect(setXML).to.have.been.calledWith(initialXML);
    });


    it('should switch from <xml> to <diagram> view', function() {

      // given
      tab.activeEditor = xmlEditor;

      xmlEditor.saveXML = function(done) {
        done(null, otherXML);
      };

      var setXML = spy(cmmnEditor, 'setXML');

      // when
      tab.showEditor('diagram');

      // then
      expect(tab.activeEditor).to.equal(cmmnEditor);

      expect(setXML).to.have.been.calledWith(otherXML);
    });


    describe('error handling', function() {


      it('should log modeler errors', function(done) {

        // given
        var modeler = cmmnEditor.getModeler(),
            eventBus = modeler.get('eventBus');

        var error = new Error('foo BABA');

        cmmnEditor.on('log:toggle', function(options) {

          // then
          expect(logger.entries).to.deep.include({
            category: 'error',
            ref: null,
            message: error.stack
          });

          expect(options.open).to.be.true;

          done();
        });

        // when
        eventBus.fire('error', {
          error: error
        });
      });


      it('should handle export errors', function() {

        // given
        var exportError = new Error('could not save');

        cmmnEditor.saveXML = function(done) {
          done(exportError);
        };

        // when
        tab.showEditor('xml');

        // then
        expect(tab.activeEditor).to.equal(cmmnEditor);

        expect(dialog.exportError).to.have.been.calledWith(exportError);
      });


      it('should switch to fallback editor on import error', function() {

        // given
        var importError = new Error('could not open');

        tab.activeEditor = xmlEditor;

        xmlEditor.saveXML = function(done) {
          done(null, otherXML);
        };

        cmmnEditor.setXML = function(xml) {
          // trigger shown with import error
          this.emit('shown', { error: importError });
        };

        // when
        tab.showEditor('diagram');

        // then
        expect(tab.activeEditor).to.equal(xmlEditor);

        expect(dialog.importError).to.have.been.calledWith(
          'diagram_1.cmmn',
          importError.message,
          arg.any);
      });


      it('should handle fallback editor import error', function() {

        // given
        var importError = new Error('could not open');

        tab.activeEditor = xmlEditor;

        xmlEditor.setXML = function(xml) {
          // trigger shown with import error
          this.emit('shown', { error: importError });
        };

        // when
        xmlEditor.setXML('foo');

        // then
        expect(tab.activeEditor).to.equal(xmlEditor);

        expect(dialog.importError).to.not.have.been.called;
      });

    });

  });


  describe('export as', function() {
    var tab;

    beforeEach(function(done) {
      var cmmnEditor;

      tab = createCmmnTab('diagram_1');

      cmmnEditor = tab.getEditor('diagram');

      cmmnEditor.mountEditor(document.createElement('div'));

      cmmnEditor.on('imported', function() {
        done();
      });
    });

    function expectImage(file, type) {

      expect(file).to.eql({
        contents: 'data:,',
        name: 'diagram_1.' + type,
        path: 'diagram_1.' + type,
        fileType: type
      });
    }


    it('should export a png', function() {

      // when
      tab.exportAs('png', function(err, file) {

        // then
        expectImage(file, 'png');
      });
    });


    it('should export a jpeg', function() {

      // when
      tab.exportAs('jpeg', function(err, file) {

        // then
        expectImage(file, 'jpeg');
      });
    });


    it('should export a svg', function() {

      // when
      tab.exportAs('svg', function(err, file) {

        // then
        expect(file.name).to.eql('diagram_1.svg');
        expect(file.path).to.eql('diagram_1.svg');
        expect(file.fileType).to.eql('svg');
        expect(file.contents).to.contain('http://www.w3.org/2000/svg');
      });
    });


    it('should return an error on unknown type', function() {

      // when
      tab.exportAs('foo', function(err, file) {

        // then
        expect(err.message).to.equal('<foo> is an unknown type for converting svg to image');
      });
    });

  });

});
