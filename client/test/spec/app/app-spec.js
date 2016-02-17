'use strict';

var Dialog = require('test/helper/mock/dialog'),
    Events = require('test/helper/mock/events'),
    FileSystem = require('test/helper/mock/file-system'),
    Workspace = require('test/helper/mock/workspace'),
    Logger = require('test/helper/mock/logger');

var App = require('app');

var select = require('test/helper/vdom').select,
    render = require('test/helper/vdom').render,
    simulateEvent = require('test/helper/vdom').simulateEvent;

var assign = require('lodash/object/assign');

var arg = require('test/helper/util/arg'),
    spy = require('test/helper/util/spy');

var bpmnXML = require('app/tabs/bpmn/initial.bpmn'),
    dmnXML = require('app/tabs/dmn/initial.dmn');


function createBpmnFile(xml) {
  return {
    name: 'diagram_1.bpmn',
    path: 'diagram_1.bpmn',
    contents: xml,
    fileType: 'bpmn'
  };
}

function createDmnFile(xml) {
  return {
    name: 'diagram_1.dmn',
    path: 'diagram_1.dmn',
    contents: xml,
    fileType: 'dmn'
  };
}


describe('App', function() {

  var events, logger, fileSystem, workspace, dialog, app;

  beforeEach(function() {
    dialog = new Dialog();
    events = new Events();
    fileSystem = new FileSystem();
    workspace = new Workspace();
    logger = new Logger();

    // given
    app = new App({
      dialog: dialog,
      events: events,
      fileSystem: fileSystem,
      workspace: workspace,
      logger: logger
    });
  });


  it('should render', function() {

    // when
    var tree = render(app);

    // then
    expect(select('.footer', tree)).to.exist;
    expect(select('.tabbed.main', tree)).to.exist;
    expect(select('.menu-bar', tree)).to.exist;
  });


  describe('bpmn support', function() {

    it('should create new BPMN tab', function() {

      // when
      app.createDiagram('bpmn');

      var tree = render(app);

      // then
      // expect BPMN tab with editor to be shown
      expect(select('.bpmn-editor', tree)).to.exist;
    });


    it('should open passed BPMN diagram file', function() {

      // given
      var openFile = createBpmnFile(bpmnXML);

      // when
      app.createDiagramTabs([ openFile ]);

      // then
      expect(app.activeTab.file).to.eql(openFile);

      // and rendered ...

      var tree = render(app);

      // then
      // expect BPMN tab with editor to be shown
      expect(select('.bpmn-editor', tree)).to.exist;
    });

  });


  describe('dmn support', function() {

    it('should create new DMN tab', function() {

      // when
      app.createDiagram('dmn');

      var tree = render(app);

      // then
      // expect DMN tab with editor to be shown
      expect(select('.dmn-editor', tree)).to.exist;
    });


    it('should open passed DMN diagram file', function() {

      // given
      var openFile = createDmnFile(dmnXML);

      // when
      app.createDiagramTabs([ openFile ]);

      // then
      expect(app.activeTab.file).to.eql(openFile);

      // and rendered ...

      var tree = render(app);

      // then
      // expect BPMN tab with editor to be shown
      expect(select('.dmn-editor', tree)).to.exist;
    });

  });


  describe('file drop', function() {

    it('should open suitable files', function() {

      // given
      var validFile = {
        name: 'diagram_1.bpmn',
        path: 'diagram_1.bpmn',
        contents: bpmnXML
      };

      var invalidFile = {
        name: 'text.txt',
        path: '[unsaved]',
        contents: 'FOO BAR'
      };

      var droppedFiles = [ validFile, invalidFile ];

      // when
      app.filesDropped(droppedFiles);

      // then
      // only one file got added
      expect(app.tabs.length).to.eql(2);

      // valid diagram got opened
      expect(app.activeTab.file).to.eql({
        name: 'diagram_1.bpmn',
        path: 'diagram_1.bpmn',
        contents: bpmnXML,
        fileType: 'bpmn'
      });

      expect(dialog.unrecognizedFileError).to.have.been.calledWith(invalidFile, arg.any);
    });

  });


  describe('diagram opening', function() {

    it('should open BPMN file', function() {

      // given
      var openFile = {
        name: 'diagram_1.bpmn',
        path: 'diagram_1.bpmn',
        contents: bpmnXML
      };

      var expectedFile = assign({ fileType: 'bpmn' }, openFile);

      dialog.setOpenResponse(openFile);

      // when
      app.openDiagram();

      // then
      expect(app.activeTab.file).to.eql(expectedFile);
    });


    it('should open DMN file', function() {

      // given
      var openFile = {
        name: 'diagram_1.dmn',
        path: 'diagram_1.dmn',
        contents: dmnXML
      };

      var expectedFile = assign({ fileType: 'dmn' }, openFile);

      dialog.setOpenResponse(openFile);

      // when
      app.openDiagram();

      // then
      expect(app.activeTab.file).to.eql(expectedFile);
    });


    it('should fail on Error', function() {

      // given
      var lastTab = app.activeTab,
          openError = new Error('foo');

      dialog.setOpenResponse(openError);

      // when
      app.openDiagram();

      // then
      expect(dialog.openError).to.have.been.called;

      // still displaying last tab
      expect(app.activeTab).to.eql(lastTab);
    });


    it('should fail on unrecognized file format', function() {

      // given
      var lastTab = app.activeTab,
          openFile = {
            name: 'diagram_1.bpmn',
            path: 'diagram_1.bpmn',
            contents: require('./no-bpmn.bpmn')
          };

      dialog.setOpenResponse(openFile);

      // when
      app.openDiagram();

      // then
      expect(dialog.unrecognizedFileError).to.have.been.called;

      // still displaying last tab
      expect(app.activeTab).to.eql(lastTab);
    });

  });


  describe('diagram saving', function() {

    it('should save BPMN file', function() {

      // given
      var file = createBpmnFile(bpmnXML);

      // install save mock for tab
      app.on('tab:select', patchSaveAnswer(file));

      app.createDiagramTabs([ file ]);

      // when
      app.triggerAction('save');

      // then
      expect(fileSystem.writeFile).to.have.been.calledWith(file, arg.any);
    });


    it('should save-as BPMN file', function() {

      // given
      var file = createBpmnFile(bpmnXML);

      var expectedFile = assign({}, file, { path: '/foo/bar', name: 'bar' });


      dialog.setSaveAsResponse(expectedFile);

      // install save mock for tab
      app.on('tab:select', patchSaveAnswer(file));

      app.createDiagramTabs([ file ]);

      // when
      app.triggerAction('save-as');

      // then
      expect(fileSystem.writeFile).to.have.been.calledWith(expectedFile, arg.any);

      // expect tab got updated
      expect(app.activeTab.label).to.eql(expectedFile.name);
      expect(app.activeTab.title).to.eql(expectedFile.path);
    });


    it('should fail on Error', function() {

      // given
      var file = createBpmnFile(bpmnXML);

      var saveError = new Error('something went wrong');

      // install save mock for tab
      app.on('tab:select', patchSaveAnswer(saveError));

      app.createDiagramTabs([ file ]);

      // when
      app.triggerAction('save');

      // then
      expect(dialog.saveError).to.have.been.calledWith(saveError, arg.any);
    });

  });


  describe('menu-bar', function() {

    var tree;

    beforeEach(function() {
      tree = render(app);
    });


    it('should bind create-bpmn-diagram', function() {

      // given
      var element = select('.menu-bar [ref=create-bpmn-diagram]', tree);

      var createDiagram = spy(app, 'createDiagram');

      // when
      simulateEvent(element, 'mouseup');

      // then
      expect(createDiagram).to.have.been.calledWith('bpmn');
    });


    it('should bind create-dmn-diagram', function() {

      // given
      var element = select('.menu-bar [ref=create-dmn-diagram]', tree);

      var createDiagram = spy(app, 'createDiagram');

      // when
      simulateEvent(element, 'mouseup');

      // then
      expect(createDiagram).to.have.been.calledWith('dmn');
    });


    it('should bind open', function() {

      // given
      var element = select('.menu-bar [ref=open]', tree);

      var openDiagram = spy(app, 'openDiagram');

      // when
      simulateEvent(element, 'click');

      // then
      expect(openDiagram).to.have.been.called;
    });


    it('should bind save');

    it('should bind save-as');

    it('should bind undo');

    it('should bind redo');

  });


  describe('tabs', function() {

    var tree;

    beforeEach(function() {
      tree = render(app);
    });


    it('should bind + tab, creating new diagram', function() {

      // given
      var element = select('.tabbed [ref=empty-tab]', tree);

      var createDiagram = spy(app, 'createDiagram');

      // when
      simulateEvent(element, 'click');

      // then
      expect(createDiagram).to.have.been.calledWith('bpmn');
    });

  });


  describe('workspace', function() {

    describe('api', function() {

      describe('#persistWorkspace', function() {

        it('should persist empty', function(done) {

          // when
          app.persistWorkspace(function(err, config) {

            // then
            expect(err).not.to.exist;

            expect(config).to.have.keys([
              'tabs',
              'activeTab',
              'layout'
            ]);

            expect(config.tabs).to.have.length(0);
            expect(config.activeTab).to.eql(-1);

            done();
          });
        });


        it('should persist tabs', function(done) {

          // given
          var bpmnFile = createBpmnFile(bpmnXML),
              dmnFile = createDmnFile(dmnXML);

          app.createDiagramTabs([ bpmnFile, dmnFile ]);
          app.selectTab(app.tabs[0]);

          // when
          app.persistWorkspace(function(err, config) {

            expect(err).not.to.exist;

            expect(config).to.have.keys([
              'tabs',
              'activeTab',
              'layout'
            ]);

            expect(config.tabs).to.eql([ bpmnFile, dmnFile ]);

            expect(config.activeTab).to.eql(0);

            done();
          });
        });

      });


      describe('#restoreWorkspace', function() {

        it('should restore saved', function(done) {

          // given
          var bpmnFile = createBpmnFile(bpmnXML),
              dmnFile = createDmnFile(dmnXML);

          workspace.setSaved({
            tabs: [ bpmnFile, dmnFile ],
            activeTab: 1,
            layout: {
              propertiesPanel: {
                open: false,
                width: 250
              },
              log: {
                open: false,
                height: 150
              }
            }
          });

          // when
          app.restoreWorkspace(function(err) {

            // then
            expect(err).not.to.exist;

            // two tabs + empty tab are open
            expect(app.tabs).to.have.length(3);
            expect(app.activeTab).to.eql(app.tabs[1]);

            done();
          });
        });


        it('should restore default', function(done) {

          // given
          workspace.setSaved(null);

          // when
          app.restoreWorkspace(function(err) {

            // then
            expect(err).not.to.exist;

            // empty tab is open
            expect(app.tabs).to.have.length(1);

            // empty tab is selected, too
            expect(app.tabs[0]).to.eql(app.activeTab);

            done();
          });
        });

      });

    });


    describe('persist behavior', function() {

      it('should save on new tab', function(done) {

        // given
        var bpmnFile = createBpmnFile(bpmnXML);

        // when
        app.createDiagramTabs([ bpmnFile ]);

        // then
        app.events.on('workspace:persisted', function(err, config) {

          expect(err).not.to.exists;

          expect(config.tabs).to.have.length(1);
          expect(config.activeTab).to.eql(0);

          done();
        });
      });


      it('should save on tab change', function(done) {

        // given
        var bpmnFile = createBpmnFile(bpmnXML),
            dmnFile = createDmnFile(dmnXML);

        // when
        app.createDiagramTabs([ bpmnFile, dmnFile ]);
        app.selectTab(app.tabs[1]);

        // then
        app.events.on('workspace:persisted', function(err, config) {

          expect(err).not.to.exists;

          expect(config.tabs).to.have.length(2);
          expect(config.activeTab).to.eql(1);

          done();
        });
      });


      it('should save on tab close', function(done) {

        // given
        var bpmnFile = createBpmnFile(bpmnXML),
            dmnFile = createDmnFile(dmnXML);

        // when
        app.createDiagramTabs([ bpmnFile, dmnFile ]);
        app.closeTab(app.tabs[1]);

        // then
        app.events.on('workspace:persisted', function(err, config) {

          expect(err).not.to.exists;

          expect(config.tabs).to.have.length(1);
          expect(config.activeTab).to.eql(0);

          done();
        });
      });


      it('should not save unsaved tabs', function(done) {

        // when
        app.createDiagram('bpmn');

        // then
        app.events.on('workspace:persisted', function(err, config) {
          expect(err).not.to.exist;

          expect(config.tabs).to.have.length(0);

          done();
        });

      });

    });


    describe('restore behavior', function() {

      it('should restore on run', function() {

        // given
        var restoreWorkspace = spy(app, 'restoreWorkspace');

        // when
        app.run();

        // then
        expect(restoreWorkspace).to.have.been.called;
      });

    });

  });

});


function patchSaveAnswer(answer) {

  return function(tab) {
    tab.save = function(done) {
      if (answer instanceof Error) {
        done(answer);
      } else {
        done(null, answer);
      }
    };
  };
}
