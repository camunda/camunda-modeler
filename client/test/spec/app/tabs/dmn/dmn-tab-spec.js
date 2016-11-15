'use strict';

var Config = require('test/helper/mock/config'),
    Events = require('base/events'),
    Logger = require('base/logger'),
    Dialog = require('test/helper/mock/dialog');

var DmnTab = require('app/tabs/dmn/dmn-tab');

var initialXML = require('app/tabs/dmn/table.dmn');

function createFile(options) {

  options = options || {};

  return {
    name: 'diagram_1.dmn',
    path: options.path || 'diagram_1.dmn',
    contents: options.contents || initialXML,
    fileType: 'dmn'
  };
}


describe('DmnTab', function() {

  var events, logger, dialog, config;

  beforeEach(function() {
    events = new Events();
    logger = new Logger();
    dialog = new Dialog();
    config = new Config();
  });

  function createDmnTab(id, file) {

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

    return new DmnTab(options);
  }


  describe('views', function() {

    var tab, dmnEditor;

    beforeEach(function() {
      tab = createDmnTab('diagram_1');

      dmnEditor = tab.getEditor('dmn-editor');
    });


    describe('error handling', function() {


      it('should log modeler errors', function(done) {

        // given
        var modeler = dmnEditor.getModeler();

        modeler.importXML(initialXML, function() {

          var eventBus = modeler.get('eventBus');

          dmnEditor.on('log:toggle', function(options) {

            // then
            expect(logger.entries).to.include({
              category: 'error', ref: null, message: 'foo BABA' });

            expect(options.open).to.be.true;

            done();
          });

          // when
          eventBus.fire('error', { error: 'foo BABA' });
        });

      });

    });

  });

});
