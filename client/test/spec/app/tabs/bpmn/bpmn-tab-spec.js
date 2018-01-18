'use strict';

var Config = require('test/helper/mock/config'),
    Events = require('base/events'),
    Logger = require('base/logger'),
    Dialog = require('test/helper/mock/dialog'),
    Plugins = require('test/helper/mock/plugins');

var BpmnTab = require('app/tabs/bpmn/bpmn-tab');

var select = require('test/helper/vdom').select,
    render = require('test/helper/vdom').render,
    simulateEvent = require('test/helper/vdom').simulateEvent;

var initialXML = require('app/tabs/bpmn/initial.bpmn');

var spy = require('test/helper/util/spy'),
    arg = require('test/helper/util/arg');


function createFile(options) {

  options = options || {};

  return {
    name: 'diagram_1.bpmn',
    path: options.path || 'diagram_1.bpmn',
    contents: options.contents || initialXML,
    fileType: 'bpmn'
  };
}


describe('BpmnTab', function() {

  var events, logger, dialog, config, plugins;

  beforeEach(function() {
    events = new Events();
    logger = new Logger();
    dialog = new Dialog();
    config = new Config();
    plugins = new Plugins();
  });

  function createBpmnTab(id, file) {

    var options = {
      closable: true,
      dirty: true,
      id: id,
      config: config,
      events: events,
      dialog: dialog,
      file: file || createFile(),
      layout: {
        propertiesPanel: {},
        minimap: {}
      },
      logger: logger,
      plugins: plugins,
      metaData: {}
    };

    return new BpmnTab(options);
  }


  describe('render', function() {

    it('should render view <diagram>', function() {

      // given
      var tab = createBpmnTab('diagram_1');

      // when
      var tree = render(tab);

      // then
      expect(select('.multi-editor-tab', tree)).to.exist;
      expect(select('.bpmn-editor', tree)).to.exist;

      expect(select('.xml-editor', tree)).to.not.exist;
    });


    it('should render view <xml>', function() {

      // given
      var tab = createBpmnTab('diagram_1');

      // when
      tab.setEditor(tab.getEditor('xml'));

      var tree = render(tab);

      // then
      expect(select('.multi-editor-tab', tree)).to.exist;
      expect(select('.xml-editor', tree)).to.exist;

      expect(select('.bpmn-editor', tree)).to.not.exist;
    });


    it('should switch view', function() {

      // given
      var tab = createBpmnTab('diagram_1');

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

    var otherXML = require('test/fixtures/other.bpmn');


    var tab, xmlEditor, bpmnEditor;

    beforeEach(function() {
      tab = createBpmnTab('diagram_1');

      bpmnEditor = tab.getEditor('diagram');
      xmlEditor = tab.getEditor('xml');
    });


    it('should switch from <diagram> to <xml> view', function() {

      // given
      bpmnEditor.saveXML = function(done) {
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

      var setXML = spy(bpmnEditor, 'setXML');

      // when
      tab.showEditor('diagram');

      // then
      expect(tab.activeEditor).to.equal(bpmnEditor);

      expect(setXML).to.have.been.calledWith(otherXML);
    });


    describe('switching state', function() {

      it('should update when switching views', function(done) {

        tab.activeEditor = bpmnEditor;

        bpmnEditor.saveXML = function(done) {
          done(null, initialXML);
        };

        // wait for diagram shown / imported
        xmlEditor.once('state-updated', function(context) {

          // then
          expect(context).to.have.property('undo', false);
          expect(context).to.have.property('redo', false);
          expect(context).to.have.property('dirty', false);

          done();
        });

        // when
        tab.showEditor(xmlEditor);

        xmlEditor.mountEditor(document.createElement('div'));
      });

    });


    describe('error handling', function() {

      it('should log modeler errors', function(done) {

        // given
        var modeler = bpmnEditor.getModeler(),
            eventBus = modeler.get('eventBus');

        var error = new Error('foo BABA');

        bpmnEditor.on('log:toggle', function(options) {

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

        bpmnEditor.saveXML = function(done) {
          done(exportError);
        };

        // when
        tab.showEditor('xml');

        // then
        expect(tab.activeEditor).to.equal(bpmnEditor);

        expect(dialog.exportError).to.have.been.calledWith(exportError);
      });


      it('should switch to fallback editor on import error', function() {

        // given
        var importError = new Error('could not open');

        tab.activeEditor = xmlEditor;

        xmlEditor.saveXML = function(done) {
          done(null, otherXML);
        };

        bpmnEditor.setXML = function(xml) {
          // trigger shown with import error
          this.emit('shown', { error: importError });
        };

        // when
        tab.showEditor('diagram');

        // then
        expect(tab.activeEditor).to.equal(xmlEditor);

        expect(dialog.importError).to.have.been.calledWith(
          'diagram_1.bpmn',
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
      var bpmnEditor;

      tab = createBpmnTab('diagram_1');

      bpmnEditor = tab.getEditor('diagram');

      bpmnEditor.mountEditor(document.createElement('div'));

      bpmnEditor.on('imported', function() {
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
