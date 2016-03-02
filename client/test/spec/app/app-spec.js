'use strict';

var Dialog = require('test/helper/mock/dialog'),
    Events = require('test/helper/mock/events'),
    FileSystem = require('test/helper/mock/file-system'),
    Workspace = require('test/helper/mock/workspace'),
    Logger = require('base/logger');

var App = require('app');

var select = require('test/helper/vdom').select,
    render = require('test/helper/vdom').render,
    simulateEvent = require('test/helper/vdom').simulateEvent;

var assign = require('lodash/object/assign');

var arg = require('test/helper/util/arg'),
    spy = require('test/helper/util/spy');

var bpmnXML = require('app/tabs/bpmn/initial.bpmn'),
    dmnXML = require('app/tabs/dmn/initial.dmn');

var inherits = require('inherits');
var MultiEditorTab = require('app/tabs/multi-editor-tab');
var BaseEditor = require('app/editor/base-editor');


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
      app.createTabs([ openFile ]);

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
      app.createTabs([ openFile ]);

      // then
      expect(app.activeTab.file).to.eql(openFile);

      // and rendered ...

      var tree = render(app);

      // then
      // expect BPMN tab with editor to be shown
      expect(select('.dmn-editor', tree)).to.exist;
    });

  });


  describe('xml support', function () {

    it('should render xml-view', function() {

      // given
      var openFile = createBpmnFile(bpmnXML),
          activeTab;

      // when
      app.createTabs([ openFile ]);

      activeTab = app.activeTab;

      activeTab.activeEditor = activeTab.getEditor('xml');

      var tree = render(app);

      // then
      // expect BPMN tab with editor to be shown
      expect(select('.xml-editor', tree)).to.exist;
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

      app.createTabs([ file ]);

      patchSaveAnswer(app, file);

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

      app.createTabs([ file ]);

      patchSaveAnswer(app, file);

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

      app.createTabs([ file ]);

      patchSaveAnswer(app, saveError);

      // when
      app.triggerAction('save');

      // then
      expect(dialog.saveError).to.have.been.calledWith(saveError, arg.any);
    });

  });


  describe('tab closing', function () {

    it('should show <close dialog> when closing a dirty tab', function() {
      // given
      var file = createBpmnFile(bpmnXML),
          tab;

      file.path = '[unsaved]';

      app.createTabs([ file ]);

      tab = app.activeTab;

      // when
      app.closeTab(tab);

      // then
      expect(dialog.close).to.have.been.called;
    });


    it('should NOT show <close dialog> when closing a "clean" tab', function() {
      // given
      var file = createBpmnFile(bpmnXML),
          tab;

      app.createTabs([ file ]);

      tab = app.activeTab;

      // when
      app.closeTab(tab);

      // then
      expect(dialog.close).to.not.have.been.called;
    });


    it('should save file and close tab', function(done) {
      // given
      var file = createBpmnFile(bpmnXML),
          initialTab;

      var expectedFile = assign({}, file, { path: '/foo/bar', name: 'bar' });

      file.path = '[unsaved]';

      app.createTabs([ file ]);

      initialTab = app.activeTab;

      app.saveTab = function(tab, cb) {
        tab.setFile(expectedFile);

        cb(null, expectedFile);
      };

      // when
      dialog.setCloseResponse('save');

      app.closeTab(initialTab, function(err, tab) {

        // then
        expect(tab.file).to.equal(expectedFile);
        expect(app.tabs).to.not.contain(initialTab);

        expect(dialog.close).to.have.been.called;

        done();
      });
    });


    it('should NOT save file and close tab', function(done) {
      // given
      var file = createBpmnFile(bpmnXML),
          initialTab;

      var expectedFile = assign({}, file, { path: '/foo/bar', name: 'bar' });

      file.path = '[unsaved]';

      app.createTabs([ file ]);

      initialTab = app.activeTab;

      app.saveTab = function(tab, cb) {
        tab.setFile(expectedFile);

        cb(null, expectedFile);
      };

      // when
      dialog.setCloseResponse('close');

      app.closeTab(initialTab, function(err, tab) {

        // then
        expect(tab.file).to.equal(file);
        expect(app.tabs).to.not.contain(initialTab);

        expect(dialog.close).to.have.been.called;

        done();
      });
    });


    it('should cancel tab closing', function(done) {
      // given
      var file = createBpmnFile(bpmnXML),
          initialTab;

      var expectedFile = assign({}, file, { path: '/foo/bar', name: 'bar' });

      file.path = '[unsaved]';

      app.createTabs([ file ]);

      initialTab = app.activeTab;

      app.saveTab = function(tab, cb) {
        tab.setFile(expectedFile);

        cb(null, expectedFile);
      };

      // when
      dialog.setCloseResponse(new Error('user canceled'));

      app.closeTab(initialTab, function(err, tab) {

        // then
        expect(app.tabs).to.contain(initialTab);

        expect(dialog.close).to.have.been.called;

        done();
      });
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

          app.createTabs([ bpmnFile, dmnFile ]);
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
        app.createTabs([ bpmnFile ]);

        // then
        app.on('workspace:persisted', function(err, config) {

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
        app.createTabs([ bpmnFile, dmnFile ]);
        app.selectTab(app.tabs[1]);

        // then
        app.on('workspace:persisted', function(err, config) {

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
        app.createTabs([ bpmnFile, dmnFile ]);
        app.closeTab(app.tabs[1]);

        // then
        app.on('workspace:persisted', function(err, config) {

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
        app.on('workspace:persisted', function(err, config) {
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


  describe('event emitter', function() {

    var tab;

    beforeEach( () => {
      function SomeEditor() {
        BaseEditor.call(this, {});
      }

      inherits(SomeEditor, BaseEditor);

      SomeEditor.prototype.update = function() {
        this.emit('state-updated', { editorStateProperty: 'smth' });
      };

      tab = new MultiEditorTab({
        editorDefinitions: [
          { id: 'someEditor', label: 'SomeEditor', component: SomeEditor }
        ],
        id: 'someId',
        events: events,
        dialog: dialog
      });
    });


    describe('focus', () => {

      it('should be emitted on the active tab once selected', done => {

        // given
        app.addTab(tab);
        expect(app.activeTab).not.to.eql(tab);

        tab.on('focus', () => {
          // then
          expect(app.activeTab).to.eql(tab);
          done();
        });

        // when
        app.selectTab(tab);

      });

    });


    describe('tools:state-changed', function() {

      it('should emit on application start', function(done) {

        // given
        app.once('tools:state-changed', function(tab, state) {

          // then
          expect(state).to.eql({});

          done();
        });

        // when
        app.run();
      });


      it('should emit on editor "state-updated" event', function(done)  {

        // given
        app.addTab(tab);

        app.on('tools:state-changed', function(tab, state) {

          // then
          expect(state).to.have.property('save', true);
          expect(state).to.have.property('editorStateProperty', 'smth');

          done();
        });

        // when
        app.selectTab(tab);

      });

    });

  });

});


function patchSaveAnswer(app, answer) {
  app.tabs.forEach(tab => {
    tab.save = function(done) {
      if (answer instanceof Error) {
        done(answer);
      } else {
        done(null, answer);
      }
    };
  });
}
