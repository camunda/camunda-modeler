'use strict';

var Config = require('test/helper/mock/config'),
    Dialog = require('test/helper/mock/dialog'),
    Events = require('base/events'),
    FileSystem = require('test/helper/mock/file-system'),
    Workspace = require('test/helper/mock/workspace'),
    Plugins = require('test/helper/mock/plugins'),
    Logger = require('base/logger');

var App = require('app');

var select = require('test/helper/vdom').select,
    render = require('test/helper/vdom').render,
    simulateEvent = require('test/helper/vdom').simulateEvent;

import {
  assign,
  find,
  matchPattern
} from 'min-dash';

var arg = require('test/helper/util/arg'),
    spy = require('test/helper/util/spy');

var bpmnXML = require('app/tabs/bpmn/initial.bpmn'),
    cmmnXML = require('app/tabs/cmmn/initial.cmmn'),
    activitiXML = require('test/fixtures/activiti.xml'),
    drdXML = require('test/fixtures/drd.dmn'),
    dmnXML = require('app/tabs/dmn/table.dmn');

var inherits = require('inherits');
var MultiEditorTab = require('app/tabs/multi-editor-tab');
var BaseEditor = require('app/editor/base-editor');

var Tab = require('base/components/tab');
var browser = require('test/helper/mock/browser');


function createBpmnFile(xml, overrides) {
  return assign({
    name: 'diagram_1.bpmn',
    path: 'diagram_1.bpmn',
    contents: xml,
    fileType: 'bpmn',
    lastModified: new Date().getTime(),
    isUnsaved: false
  }, overrides);
}

function createBpmnActivityFile(overrides) {
  return assign({
    name: 'activiti.xml',
    path: 'activiti.xml',
    contents: activitiXML,
    lastModified: new Date().getTime(),
    isUnsaved: false
  }, overrides);
}

function createDmnFile(xml, overrides) {
  return assign({
    name: 'diagram_1.dmn',
    path: 'diagram_1.dmn',
    contents: xml,
    fileType: 'dmn',
    lastModified: new Date().getTime(),
    isUnsaved: false
  }, overrides);
}

function createCmmnFile(xml, overrides) {
  return assign({
    name: 'diagram_1.cmmn',
    path: 'diagram_1.cmmn',
    contents: xml,
    fileType: 'cmmn',
    lastModified: new Date().getTime(),
    isUnsaved: true
  }, overrides);
}

var UNSAVED_FILE = { path: '', isUnsaved: true };


describe('App', function() {

  var app, config, dialog,
      events, fileSystem, logger,
      workspace, plugins;

  beforeEach(function() {
    config = new Config();
    events = new Events();
    dialog = new Dialog(events);
    fileSystem = new FileSystem();
    logger = new Logger();
    workspace = new Workspace();
    plugins = new Plugins();

    app = new App({
      config: config,
      dialog: dialog,
      events: events,
      fileSystem: fileSystem,
      logger: logger,
      workspace: workspace,
      plugins: plugins,
      metaData: {},
      browser: browser
    });

  });


  describe('cycle through tabs', function() {
    var tabs, emptyTabIndex, emptyTab;

    beforeEach(function() {
      var file1 = createBpmnFile(bpmnXML);
      var file2 = createDmnFile(dmnXML);
      var file3 = createDmnFile(dmnXML, UNSAVED_FILE);

      tabs = app.openTabs([ file1, file2, file3 ]);

      emptyTabIndex = app.tabs.length - 1;
      emptyTab = app.tabs[emptyTabIndex];
    });


    it('should select next tab', function() {
      // given
      app.selectTab(tabs[0]);

      // when
      app.triggerAction('select-tab', 'next');

      // then
      expect(app.activeTab).to.eql(tabs[1]);
    });


    it('should select previous tab', function() {
      // given
      app.selectTab(tabs[2]);

      // when
      app.triggerAction('select-tab', 'previous');

      // then
      expect(app.activeTab).to.eql(tabs[1]);
    });


    it('should not select empty tab on next', function() {
      // given
      app.selectTab(tabs[emptyTabIndex - 1]);

      // when
      app.triggerAction('select-tab', 'next');

      // then
      expect(app.activeTab).to.not.eql(emptyTab);
      expect(app.activeTab).to.eql(tabs[0]);
    });


    it('should not select empty tab on previous', function() {
      // given
      var emptyTabIndex = app.tabs.length - 1;
      var emptyTab = app.tabs[emptyTabIndex];

      app.selectTab(tabs[0]);

      // when
      app.triggerAction('select-tab', 'previous');

      // then
      expect(app.activeTab).to.not.eql(emptyTab);
      expect(app.activeTab).to.eql(tabs[emptyTabIndex - 1]);
    });

  });


  describe('open last tab', function() {

    it('should open last closed file', function() {
      // given
      var bpmnFile = createBpmnFile(bpmnXML),
          openTab = app.openTab(bpmnFile);

      app.closeTab(openTab);

      var openFiles = spy(app, 'openFiles');

      // when
      app.reopenLastTab();

      // then
      expect(openFiles).calledWith([ bpmnFile ]);
      expect(app.activeTab.file).to.eql(bpmnFile);
    });


    it('should not open any files if history is empty', function() {
      // given
      var bpmnFile = createBpmnFile(bpmnXML);

      app.openTab(bpmnFile);

      var openFiles = spy(app, 'openFiles');

      // when
      app.reopenLastTab();

      // then
      expect(openFiles).not.to.have.been.called;
      expect(app.fileHistory).to.have.length(0);
    });


    it('should remove opened file from history', function() {
      // given
      var bpmnFile = createBpmnFile(bpmnXML),
          openTab = app.openTab(bpmnFile);

      app.closeTab(openTab);

      // when
      app.reopenLastTab();

      // then
      expect(app.fileHistory).to.have.length(0);
    });
  });


  describe('modal-overlay', function() {

    it('should render modal-dialog', function() {

      app.toggleOverlay(true);

      var tree = render(app);

      // then
      // expect BPMN tab with editor to be shown
      expect(select('.dialog-overlay.active', tree)).to.exist;
    });


    it('should render keyboard shortcuts modal and close it', function() {

      app.toggleOverlay('shortcuts');

      var tree = render(app);

      // then
      // expect BPMN tab with editor to be shown
      expect(select('.keyboard-shortcuts', tree)).to.exist;

      app.toggleOverlay(false);

      tree = render(app);

      // then
      // expect BPMN tab with editor to be shown
      expect(select('.keyboard-shortcuts', tree)).to.not.exist;
    });


    it('should render endpoints configuration modal and close it', function() {

      // when
      // endpointConfig is toggled first time
      app.toggleOverlay('configureEndpoint');

      var tree = render(app);

      // then
      // config modal should show
      expect(select('.endpoint-configuration', tree)).to.exist;

      // when
      // endpointConfig is toggled second time
      app.toggleOverlay(false);

      tree = render(app);

      // then
      // config modal should disappear
      expect(select('.endpoint-configuration', tree)).to.not.exist;
    });


    describe('deployment configuration modal', function() {

      it('should render modal and close it', function() {

        // when
        // endpointConfig is toggled first time
        app.toggleOverlay('deployDiagram');

        var tree = render(app);

        // then
        // config modal should show
        expect(select('.deployment-configuration', tree)).to.exist;

        // when
        // endpointConfig is toggled second time
        app.toggleOverlay(false);

        tree = render(app);

        // then
        // config modal should disappear
        expect(select('.deployment-configuration', tree)).to.not.exist;
      });


      it('should only submit form with deployment name', function() {

        // when
        // endpointConfig is toggled first time
        app.saveTab = function() {};

        app.toggleOverlay('deployDiagram');

        var tree = render(app);

        var deploymentNameInput = select('#deployment-name', tree);

        // then
        expect(deploymentNameInput.properties.required).to.be.true;

        // when
        var triggerAction = spy(app, 'triggerAction');

        var deploymentConfigForm = select('.deployment-configuration form', tree);

        simulateEvent(deploymentConfigForm, 'submit', {
          preventDefault: function() { },
          target: {
            'deployment-name': {
              value: 'foo'
            },
            'tenant-id': {
              value: ''
            }
          }
        });

        // then
        expect(triggerAction).to.be.called;
      });


      it('should show deployment status', function() {

        // given
        const LOADING = 'loading',
              ERROR = 'error',
              SUCCESS = 'success';

        // when
        app.toggleOverlay('deployDiagram');

        app.setState({
          DeployDiagramOverlay: {
            status: LOADING
          }
        });

        var tree = render(app);


        // then
        // config modal should show
        expect(select('.deployment-configuration .icon-loading', tree)).to.exist;

        // when
        app.setState({
          DeployDiagramOverlay: {
            status: ERROR
          }
        });
        tree = render(app);

        // then
        // config modal should show
        expect(select('.deployment-configuration .status.error', tree)).to.exist;

        // when
        app.setState({
          DeployDiagramOverlay: {
            status: SUCCESS
          }
        });
        tree = render(app);

        // then
        // config modal should show
        expect(select('.deployment-configuration .status.success', tree)).to.exist;
      });

    });


    it('should render overlay even if the passed content does not exist', function() {

      app.toggleOverlay('foo');

      var tree = render(app);

      // then
      // expect BPMN tab with editor to be shown
      expect(select('.dialog-overlay.active', tree)).to.exist;
    });

  });


  describe('dialog overlay', function() {

    it('should open overlay when dialog is called', function(done) {

      // given
      var openFile = createBpmnFile(bpmnXML);

      dialog.setResponse('open', [ openFile ]);

      // when
      app.on('dialog-overlay:toggle', function(isOpened) {

        expect(isOpened).to.be.true;

        done();
      });

      app.openDiagram();
    });


    it('should close overlay when dialog is closed', function() {

      // given
      var openFile = createBpmnFile(bpmnXML),
          closeOverlay = spy(dialog, '_closeOverlay');

      dialog.setResponse('open', [ openFile ]);


      // when
      app.openDiagram();

      // then
      expect(closeOverlay).to.have.been.called;
    });

  });


  describe('check external file modifications', function() {

    var openFile;

    beforeEach(function() {
      openFile = createBpmnFile(bpmnXML);
    });


    describe('given file has been modified', function() {
      var tab;
      var statsFile;
      var newFile;

      beforeEach(function() {
        // given
        statsFile = assign({}, openFile, {
          lastModified: new Date().getTime() + 2000
        });
        app.fileSystem.setStatsFile(statsFile);

        newFile = assign({}, statsFile, {
          content: 'NEW CONTENT'
        });
        app.fileSystem.setFile(newFile);

        tab = app._createTab(openFile);
      });


      it('should call file reload dialog', function() {
        // when
        app.recheckTabContent(tab);

        // then
        expect(dialog.contentChanged).to.have.been.calledWith(arg.any);
      });


      it('should set new file on tab if reload accepted', function() {
        // given
        dialog.setResponse('contentChanged', 'ok');

        // when
        app.recheckTabContent(tab);

        // then
        expect(tab.file).to.eql(newFile);
      });


      it('should update "lastModified" flag and not change content on cancel', function() {
        // given
        dialog.setResponse('contentChanged', 'cancel');

        // when
        app.recheckTabContent(tab);

        // then
        expect(tab.file).to.eql(assign({}, openFile, { lastModified: statsFile.lastModified }));
        expect(tab.file).to.not.eql(newFile);
      });

    });


    describe('given file has NOT been modified', function() {
      var tab;

      beforeEach(function() {
        // given
        app.fileSystem.setStatsFile(assign({}, openFile));

        tab = app._createTab(openFile);
      });


      it('should NOT call file reload dialog', function() {
        // when
        app.recheckTabContent(tab);

        // then
        expect(dialog.contentChanged).to.have.not.been.calledWith(arg.any);
      });


      it('tab should keep old file', function() {
        // when
        app.recheckTabContent(tab);

        // then
        expect(tab.file).to.equal(openFile);
      });

    });


    describe('should be called', function() {
      var recheckTabContent;

      beforeEach(function() {
        recheckTabContent = spy(app, 'recheckTabContent');
        app.fileSystem.setFile(assign({}, openFile));
        app.fileSystem.setStatsFile(assign({}, openFile));
      });


      it('on opening tab', function() {
        // when
        var tab = app.openTab(openFile);

        // then
        expect(recheckTabContent).to.have.been.calledWith(tab);
      });


      it('on selecting tab', function() {
        // given
        var tab = app._createTab(openFile);

        // when
        app.selectTab(tab);

        // then
        expect(recheckTabContent).to.have.been.calledWith(tab);
      });

    });

  });


  describe('run', function() {

    it('should emit "ready" event', function(done) {
      // then
      app.on('ready', done);

      // when
      app.run();
    });

  });


  describe('quit', function() {
    var file, SomeTab;

    beforeEach(function() {
      file = createBpmnFile(bpmnXML);

      SomeTab = function SomeTab(dirty) {
        this.dirty = dirty;

        this.on('focus', () => {
          this.events.emit('tools:state-changed', this, {
            dirty: this.dirty
          });
        });

        Tab.call(this, {
          events: events
        });
      };

      inherits(SomeTab, Tab);

      SomeTab.prototype.save = function(done) {
        done(null, file);
      };

      SomeTab.prototype.setFile = function() {};

      app.tabs = [];

    });

    it('should emit "quitting" event and close all dirty tabs on successful exit', function(done) {
      // given
      dialog.setResponse('close', file);

      app._addTab(new SomeTab(false));
      app._addTab(new SomeTab(true));
      app._addTab(new SomeTab(false));
      app._addTab(new SomeTab(true));


      app.on('quitting', function() {
        // then
        expect(app.tabs).to.have.length(2);

        done();
      });

      // when
      app.triggerAction('quit');
    });


    it('should emit "quit-aborted" event when closing tab results in error', function(done) {
      // given
      dialog.setResponse('close', userCanceled());

      app._addTab(new SomeTab(false));
      app._addTab(new SomeTab(true));
      app._addTab(new SomeTab(true));

      app.on('quit-aborted', function() {
        // then
        expect(app.tabs).to.have.length(3);

        done();
      });

      // when
      app.triggerAction('quit');
    });


    it('should emit "quit-aborted" event when closing tab is being canceled', function(done) {
      // given
      dialog.setResponse('close', 'cancel');

      app._addTab(new SomeTab(true));
      app._addTab(new SomeTab(false));
      app._addTab(new SomeTab(true));

      app.on('quit-aborted', function() {
        // then
        expect(app.tabs).to.have.length(3);

        done();
      });

      // when
      app.triggerAction('quit');
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
      var newTab = app.createDiagram('bpmn');

      // then
      expect(newTab).to.exist;

      expect(app.activeTab).to.equal(newTab);

      // open file is a BPMN file
      expectNewDiagramFile(newTab.file, 'bpmn');

      // and editor is rendered, too
      var tree = render(app);

      // expect BPMN tab with editor to be shown
      expect(select('.bpmn-editor', tree)).to.exist;
    });


    it('should open passed BPMN diagram file', function() {

      // given
      var openFile = createBpmnFile(bpmnXML);

      // when
      app.openTabs([ openFile ]);

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
      var newTab = app.createDiagram('dmn');

      // then
      expect(newTab).to.exist;

      expect(app.activeTab).to.equal(newTab);

      // open file is a DMN file
      expectNewDiagramFile(newTab.file, 'dmn');

      // and editor is rendered, too
      var tree = render(app);

      // expect DMN tab with editor to be shown
      expect(select('.dmn-editor', tree)).to.exist;
    });


    it('should open passed DMN diagram file', function() {

      // given
      var openFile = createDmnFile(dmnXML);

      // when
      app.openTabs([ openFile ]);

      // then
      expect(app.activeTab.file).to.eql(openFile);

      // and rendered ...

      var tree = render(app);

      // then
      // expect DMN tab with editor to be shown
      expect(select('.dmn-editor', tree)).to.exist;
    });

  });


  describe('cmmn support', function() {

    it('should create new DMN tab', function() {

      // when
      var newTab = app.createDiagram('cmmn');

      // then
      expect(newTab).to.exist;

      expect(app.activeTab).to.equal(newTab);

      // open file is a CMMN file
      expectNewDiagramFile(newTab.file, 'cmmn');

      // and editor is rendered, too
      var tree = render(app);

      // expect CMMN tab with editor to be shown
      expect(select('.cmmn-editor', tree)).to.exist;
    });


    it('should open passed CMMN diagram file', function() {

      // given
      var openFile = createCmmnFile(cmmnXML);

      // when
      app.openTabs([ openFile ]);

      // then
      expect(app.activeTab.file).to.eql(openFile);

      // and rendered ...

      var tree = render(app);

      // then
      // expect CMMN tab with editor to be shown
      expect(select('.cmmn-editor', tree)).to.exist;
    });

  });


  describe('xml support', function() {

    it('should render xml-view', function() {

      // given
      var openFile = createBpmnFile(bpmnXML),
          activeTab;

      // when
      app.openTabs([ openFile ]);

      activeTab = app.activeTab;

      activeTab.activeEditor = activeTab.getEditor('xml');

      var tree = render(app);

      // then
      // expect BPMN tab with editor to be shown
      expect(select('.xml-editor', tree)).to.exist;
    });

  });


  describe('file open', function() {

    it('should open suitable files', function() {

      // given
      var validFile = createBpmnFile(bpmnXML);

      var invalidFile = createBpmnFile('FOO BAR', {
        name: 'text.txt',
        path: ''
      });

      var droppedFiles = [ validFile, invalidFile ];

      // when
      app.openFiles(droppedFiles);

      // then
      // only one file got added
      expect(app.tabs.length).to.eql(2);

      // valid diagram got opened
      expect(app.activeTab.file).to.eql(assign({}, validFile));

      expect(dialog.unrecognizedFileError).to.have.been.calledWith(invalidFile, arg.any);
    });

  });


  describe('diagram opening', function() {

    it('should open BPMN file', function() {

      // given
      var openFile = createBpmnFile(bpmnXML);

      var expectedFile = assign({ fileType: 'bpmn' }, openFile);

      dialog.setResponse('open', [ openFile ]);

      // when
      app.openDiagram();

      // then
      expect(app.activeTab.file).to.eql(expectedFile);

      expect(dialog.open).to.have.been.calledWith(null);
    });


    it('should open BPMN file and provide the current open file\'s path', function() {

      // given
      var bpmnFile = createBpmnFile(bpmnXML),
          dmnFile = createDmnFile(dmnXML);

      app.openTabs([ bpmnFile ]);

      var expectedFile = assign({ fileType: 'dmn' }, dmnFile);

      dialog.setResponse('open', [ dmnFile ]);

      // when
      app.openDiagram();

      // then
      expect(app.activeTab.file).to.eql(expectedFile);

      expect(dialog.open).to.have.been.calledWith(bpmnFile.path);
    });


    it('should open empty BPMN file', function() {

      // given
      var openFile = createBpmnFile('');

      var expectedFile = assign(openFile, {
        contents: bpmnXML,
        isInitial: true,
        isUnsaved: true
      });

      dialog.setResponse('open', [ openFile ]);

      dialog.setResponse('emptyFile', 'create');

      // when
      app.openDiagram();

      // then
      expect(app.activeTab.file).to.eql(expectedFile);

      expect(dialog.open).to.have.been.calledWith(null);
    });


    it('should NOT open empty TXT file', function() {

      // given
      var lastTab = app.activeTab,
          openFile = createBpmnFile('', {
            name: 'foo.txt',
            path: 'foo.txt'
          });

      dialog.setResponse('open', [ openFile ]);

      // when
      app.openDiagram();

      // then
      expect(dialog.unrecognizedFileError).to.have.been.called;

      // still displaying last tab
      expect(app.activeTab).to.eql(lastTab);
    });


    it('should open DMN file', function() {

      // given
      var openFile = createDmnFile(dmnXML);

      var expectedFile = assign({ fileType: 'dmn' }, openFile);

      dialog.setResponse('open', [ openFile ]);

      // when
      app.openDiagram();

      // then
      expect(app.activeTab.file).to.eql(expectedFile);
    });


    it('should open empty DMN file', function() {

      // given
      var openFile = createDmnFile('');

      var expectedFile = assign(openFile, {
        contents: dmnXML,
        isInitial: true,
        isUnsaved: true
      });

      dialog.setResponse('open', [ openFile ]);

      dialog.setResponse('emptyFile', 'create');

      // when
      app.openDiagram();

      // then
      expect(app.activeTab.file).to.eql(expectedFile);

      expect(dialog.open).to.have.been.calledWith(null);
    });


    it('should fail on Error', function() {

      // given
      var lastTab = app.activeTab,
          openError = new Error('foo');

      dialog.setResponse('open', openError);

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
          openFile = createBpmnFile(bpmnXML, {
            contents: require('./no-bpmn.bpmn')
          });

      dialog.setResponse('open', [openFile]);

      // when
      app.openDiagram();

      // then
      expect(dialog.unrecognizedFileError).to.have.been.called;

      // still displaying last tab
      expect(app.activeTab).to.eql(lastTab);
    });


    it('should open multiple files', function() {

      var bpmnTab, dmnTab;

      // given
      var bpmnFile = createBpmnFile(bpmnXML);

      var dmnFile = createDmnFile(dmnXML);

      var expectedBpmnFile = assign({ fileType: 'bpmn' }, bpmnFile),
          expectedDmnFile = assign({ fileType: 'dmn' }, dmnFile);

      dialog.setResponse('open', [ bpmnFile, dmnFile ]);

      // when
      app.openDiagram();

      bpmnTab = app.tabs[0];

      dmnTab = app.tabs[1];

      // then
      expect(bpmnTab.file).to.eql(expectedBpmnFile);
      expect(dmnTab.file).to.eql(expectedDmnFile);
    });


    it('should not open new tab for the same file', function() {

      var bpmnTab, dmnTab;

      // given
      var bpmnFile = createBpmnFile(bpmnXML);

      var dmnFile = createDmnFile(dmnXML);

      var expectedBpmnFile = assign({ fileType: 'bpmn' }, bpmnFile),
          expectedDmnFile = assign({ fileType: 'dmn' }, dmnFile);

      dialog.setResponse('open', [ bpmnFile, dmnFile ]);
      app.tabs = [];

      // when
      app.openDiagram();
      app.openDiagram();
      app.openDiagram();
      app.openDiagram();
      app.openDiagram();

      dmnTab = app.tabs[0];
      bpmnTab = app.tabs[1];

      // then
      expect(bpmnTab.file).to.eql(expectedBpmnFile);
      expect(dmnTab.file).to.eql(expectedDmnFile);
      expect(app.tabs).to.have.length(2);

    });


    it('should open bpmn file and NOT activiti file', function() {

      // given

      var bpmnFile = createBpmnFile(bpmnXML);

      var activitiFile = createBpmnActivityFile();

      var expectedBpmnFile = assign({ fileType: 'bpmn' }, bpmnFile);

      dialog.setResponse('open', [ bpmnFile, activitiFile ]);

      dialog.setResponse('namespace', 'cancel');

      // when
      app.openDiagram();

      // then
      expect(dialog.convertNamespace).to.have.been.called;

      expect(app.activeTab.file).to.eql(expectedBpmnFile);

      expect(app.tabs).to.have.length(2);
    });


    it('should open activiti file with convertion', function() {
      // given
      var activitiFile = createBpmnActivityFile();

      var expectedActivitiFile = assign({}, activitiFile, { fileType: 'bpmn' });

      dialog.setResponse('open', [ activitiFile ]);

      dialog.setResponse('namespace', 'yes');

      // when
      app.openDiagram();

      // then
      expect(app.activeTab.file.name).to.eql('activiti.xml');

      expect(app.activeTab.file).to.not.eql(expectedActivitiFile);
    });


    it('should open activiti file without convertion', function() {
      // given
      var activitiFile = createBpmnActivityFile();

      var expectedActivitiFile = assign({}, activitiFile, { fileType: 'bpmn' });

      dialog.setResponse('open', [ activitiFile ]);

      dialog.setResponse('namespace', 'no');

      // when
      app.openDiagram();

      // then
      expect(app.activeTab.file).to.eql(expectedActivitiFile);
    });

  });


  describe('diagram saving', function() {

    it('should save BPMN file', function() {

      // given
      var file = createBpmnFile(bpmnXML),
          tab = app.openTab(file);

      patchSave(tab, file);

      // when
      app.triggerAction('save');

      // then
      expect(fileSystem.writeFile).to.have.been.calledWith(file, arg.any);
    });


    it('should save-as BPMN file', function() {

      // given
      var file = createBpmnFile(bpmnXML),
          tab = app.openTab(file);

      var expectedFile = assign({}, file, {
        path: '/foo/bar',
        name: 'bar',
        isUnsaved: false
      });

      dialog.setResponse('saveAs', expectedFile);

      patchSave(tab);

      // when
      app.triggerAction('save-as');

      // then
      expect(fileSystem.writeFile).to.have.been.calledWith(expectedFile, arg.any);

      // expect tab got updated
      expect(app.activeTab.label).to.eql(expectedFile.name);
      expect(app.activeTab.title).to.eql(expectedFile.path);
    });


    it('should fail on saving denied error and cancel interaction', function() {

      // given
      var file = createBpmnFile(bpmnXML),
          tab = app.openTab(file);

      var saveFileSpy = spy(app, 'saveFile');

      patchSave(tab, file);

      var savingDenied = new Error('saving-denied');

      fileSystem.setResponse('writeFile', savingDenied);

      dialog.setResponse('savingDenied', 'cancel');

      // when
      app.triggerAction('save');

      // then
      expect(dialog.savingDenied).to.have.been.called;

      expect(saveFileSpy).to.have.been.calledOnce;
    });


    it('should fail on saving denied error and trigger save-as', function() {

      // given
      var file = createBpmnFile(bpmnXML),
          tab = app.openTab(file);

      var saveFileSpy = spy(app, 'saveFile');

      patchSave(tab, file);

      var savingDenied = new Error('saving-denied');

      fileSystem.setResponse('writeFile', savingDenied);

      dialog.setResponse('savingDenied', 'save-as');

      // when
      app.triggerAction('save');

      // then
      expect(dialog.savingDenied).to.have.been.called;
      expect(saveFileSpy).to.have.been.calledTwice;
    });


    it('should fail on Error', function() {

      // given
      var file = createBpmnFile(bpmnXML);
      var tab = app.openTab(file);

      var saveError = new Error('something went wrong');

      patchSave(tab, saveError);

      // when
      app.triggerAction('save');

      // then
      expect(dialog.saveError).to.have.been.calledWith(saveError, arg.any);
    });


    describe('save all', function() {

      it('should reset dirty state', function() {

        // given
        var saveTab = spy(app, 'saveTab');

        var bpmnFile = createBpmnFile(bpmnXML, UNSAVED_FILE);
        var dmnFile = createDmnFile(dmnXML, UNSAVED_FILE);

        var tabs = app.openTabs([ bpmnFile, dmnFile ]);

        patchSave(tabs);

        dialog.setResponse('saveAs', { path: bpmnFile.name });

        // when
        app.triggerAction('save-all');

        // then
        expect(saveTab).to.have.been.calledTwice;

        tabs.forEach(function(tab) {
          expect(tab.dirty).to.be.false;
        });
      });


      it('should abort when canceled', function() {

        // given
        var saveTab = spy(app, 'saveTab');

        var bpmnFile = createBpmnFile(bpmnXML, UNSAVED_FILE);
        var dmnFile = createDmnFile(dmnXML, UNSAVED_FILE);

        var tabs = app.openTabs([ bpmnFile, dmnFile ]);

        var bpmnTab = tabs[0],
            dmnTab = tabs[1];

        patchSave(bpmnTab, userCanceled());

        // when
        app.triggerAction('save-all');

        // then
        expect(saveTab).to.have.been.calledOnce;

        expect(bpmnTab.dirty).to.be.true;
        expect(dmnTab.dirty).to.be.true;
      });


      it('should abort on export error', function() {

        // given
        var saveTab = spy(app, 'saveTab');

        var bpmnFile = createBpmnFile(bpmnXML, UNSAVED_FILE);
        var dmnFile = createDmnFile(dmnXML, UNSAVED_FILE);

        var tabs = app.openTabs([ bpmnFile, dmnFile ]);

        var bpmnTab = tabs[0],
            dmnTab = tabs[1];

        // fail exporting the first tab already
        patchSave(bpmnTab, new Error('failed to save diagram'));

        // when
        app.triggerAction('save-all');

        // then
        expect(saveTab).to.have.been.calledOnce;

        expect(bpmnTab.dirty).to.be.true;
        expect(dmnTab.dirty).to.be.true;
      });


      it('should save dirty diagrams only', function() {

        // given
        var saveTab = spy(app, 'saveTab');

        var bpmnFile = createBpmnFile(bpmnXML);
        var dmnFile = createDmnFile(dmnXML, UNSAVED_FILE);

        var tabs = app.openTabs([ bpmnFile, dmnFile ]);

        var dmnTab = tabs[1];

        patchSave(dmnTab, function(done) {
          done(null, dmnFile);
        });

        // when
        app.triggerAction('save-all');

        // then
        expect(saveTab).to.have.been.calledOnce;
        expect(saveTab).to.have.been.calledWith(dmnTab, arg.any);
      });


      // TODO(nikku): needs to be implemented properly
      it('should select tab before saving', function() {

        // given
        var tabs = app.openTabs([
          createBpmnFile(bpmnXML, UNSAVED_FILE),
          createBpmnFile(bpmnXML, UNSAVED_FILE),
          createBpmnFile(bpmnXML, UNSAVED_FILE)
        ]);

        var activeTab = app.activeTab;

        var savingTab = tabs[1];

        patchSave(tabs);

        patchSave(savingTab, function(done) {
          expect(app.activeTab).to.eql(savingTab);

          done(null, savingTab.file);
        });

        // when
        app.saveTab(savingTab);

        // then
        expect(app.activeTab).to.eql(activeTab);
      });

    });


    describe('dmn', function() {

      it('should save DMN when switching dmn editors', function(done) {
        // given
        var file = createDmnFile(drdXML),
            dmnTab = app.openTab(file);

        var dmnEditor = dmnTab.activeEditor;

        var $el = document.createElement('div');

        // wait for diagram shown / imported
        dmnEditor.once('shown', function(context) {

          var modeler = dmnEditor.modeler,
              drdJS = modeler.getActiveViewer(),
              elementFactory = drdJS.get('elementFactory'),
              canvas = drdJS.get('canvas'),
              modeling = drdJS.get('modeling'),
              drdReplace = drdJS.get('drdReplace'),
              tableOpts = {
                type: 'dmn:Decision',
                table: true,
                expression: false
              },
              lastXML;

          var decision = elementFactory.createShape({ type: 'dmn:Decision' });

          decision = modeling.createShape(decision, { x: 300, y: 400 }, canvas.getRootElement());
          decision = drdReplace.replaceElement(decision, tableOpts);

          var decisionView = modeler.getViews().filter(function(v) {
            return v.element === decision.businessObject;
          })[0];

          lastXML = dmnEditor.lastXML;

          // when (1) opening
          modeler.open(decisionView, function(err) {

            if (err) {
              return done(err);
            }

            // and (2) saving
            // dmn editor saves with changed XML
            dmnEditor.saveXML(function(err, xml) {

              if (err) {
                return done(err);
              }

              expect(xml).to.not.equal(lastXML);
              expect(xml.match(/decisionTable/g)).to.have.length(4);

              done();
            });
          });

        });

        dmnEditor.mountEditor($el);
      });

    });

  });


  describe('tab dragging', function() {
    var tabs;

    beforeEach(function() {
      var bpmnFile = createBpmnFile(bpmnXML),
          dmnFile = createDmnFile(dmnXML);

      app.openTabs([ bpmnFile, dmnFile ]);

      tabs = app.tabs;
    });


    it('should drag tab to new position', function() {
      // given
      var dragTab = app.tabs[0],
          targetTab = app.tabs[1];

      // when
      app.shiftTab(dragTab, 1);

      // then
      expect(tabs[0]).to.equal(targetTab);
      expect(tabs[1]).to.equal(dragTab);
    });


    it('should not drag tab when target and drag tab are the same', function() {
      // given
      var dragTab = app.tabs[0];

      var selectTab = spy(app, 'selectTab');

      // when
      app.shiftTab(dragTab, 0);

      // then
      expect(tabs[0]).to.equal(dragTab);
      expect(selectTab).to.not.have.been.called;
    });


    it('should not shift tabs when no drag tab is provided', function() {
      // given
      var dragTab = null;

      var selectTab = spy(app, 'selectTab');

      // when
      app.shiftTab(dragTab, 1);

      // then
      expect(selectTab).to.not.have.been.called;
    });

  });


  describe('tab closing', function() {

    it('should keep history of closed file', function() {
      // given
      var bpmnFile = createBpmnFile(bpmnXML),
          openTab = app.openTab(bpmnFile);

      // when
      app.closeTab(openTab);

      // then
      expect(app.fileHistory).to.have.length(1);
      expect(app.fileHistory[0]).to.eql(bpmnFile);
    });


    it('should close tab when providing a valid tab id', function() {
      // given
      var bpmnFile = createBpmnFile(bpmnXML),
          openTab = app.openTab(bpmnFile);

      // when
      app.closeTab(openTab.id);

      // then
      expect(app.tabs).to.not.contain(openTab);
    });


    it('should not track unsaved files', function() {
      // given
      var bpmnFile = createBpmnFile(bpmnXML, UNSAVED_FILE),
          openTab = app.openTab(bpmnFile);

      // when
      app.closeTab(openTab);

      // then
      expect(app.fileHistory).to.have.length(0);
    });


    it('should close showing close dialog on dirty tab', function() {
      // given
      var bpmnFile = createBpmnFile(bpmnXML, UNSAVED_FILE),
          openTab = app.openTab(bpmnFile);

      // when
      app.closeTab(openTab);

      // then
      expect(dialog.close).to.have.been.called;
    });


    it('should close without close dialog with clean tab', function() {
      // given
      var file = createBpmnFile(bpmnXML),
          openTab = app.openTab(file);

      // when
      app.closeTab(openTab);

      // then
      expect(dialog.close).to.not.have.been.called;
    });


    it('should save dirty file', function(done) {

      // given
      var file = createBpmnFile(bpmnXML, UNSAVED_FILE),
          openTab = app.openTab(file);

      var expectedFile = assign({}, file, {
        path: '/foo/bar',
        name: 'bar',
        isUnsaved: false
      });

      app.saveTab = function(tab, cb) {
        tab.setFile(expectedFile);

        cb(null, expectedFile);
      };

      // when
      dialog.setResponse('close', 'save');

      app.closeTab(openTab, function(err) {

        // then
        expect(app.tabs).to.not.contain(openTab);

        expect(dialog.close).to.have.been.called;

        done();
      });
    });


    it('should discard tab without saving', function(done) {
      // given
      var file = createBpmnFile(bpmnXML, UNSAVED_FILE),
          openTab = app.openTab(file);

      var expectedFile = assign({}, file, { path: '/foo/bar', name: 'bar' });

      app.saveTab = function(tab, cb) {
        tab.setFile(expectedFile);

        cb(null, expectedFile);
      };

      var saveTab = spy(app, 'saveTab');

      // when
      dialog.setResponse('close', 'discard');

      app.closeTab(openTab, function(err) {

        // then
        expect(app.tabs).to.not.contain(openTab);

        expect(dialog.close).to.have.been.called;

        expect(saveTab).to.have.not.been.called;

        done();
      });
    });


    it('should cancel tab closing', function(done) {
      // given
      var file = createBpmnFile(bpmnXML, UNSAVED_FILE),
          openTab = app.openTab(file);

      var canceledError = userCanceled();

      // when
      dialog.setResponse('close', canceledError);

      app.closeTab(openTab, function(err) {

        // then
        expect(err).to.eql(canceledError);
        expect(app.tabs).to.contain(openTab);

        expect(dialog.close).to.have.been.called;

        done();
      });
    });


    it('should cancel tab closing when cancelling save as dialog on cancel', function(done) {
      // given
      var file = createBpmnFile(bpmnXML, UNSAVED_FILE),
          openTab = app.openTab(file),
          saveTab;

      var $el = document.createElement('div');

      app.saveTab = function(tab, cb) {
        cb(null, 'cancel');
      };

      saveTab = spy(app, 'saveTab');

      app.activeTab.activeEditor.mountEditor($el);

      // when
      dialog.setResponse('close', 'save');

      app.closeTab(openTab, function(err) {

        // then
        expect(err.message).to.eql(userCanceled().message);
        expect(app.tabs).to.contain(openTab);

        expect(dialog.close).to.have.been.called;
        expect(saveTab).to.have.been.called;

        done();
      });
    });


    it('should emit "destroy" on tab closing', function(done) {
      // given
      var file = createBpmnFile(bpmnXML),
          openTab = app.openTab(file);

      var tabDestroyListener = spy(function() {});
      var listenerRemoveSpy = spy(app.events, 'removeListener');

      openTab.on('destroy', tabDestroyListener);

      var editorSpies = openTab.editors.map(function(editor) {
        return spy(editor, 'destroy');
      });

      // when
      app.closeTab(openTab, function(err) {

        // then
        expect(tabDestroyListener).to.have.been.called;
        editorSpies.forEach(function(spy) {
          expect(spy).to.have.been.called;
        });

        // make sure we remove global listeners
        expect(listenerRemoveSpy.callCount).to.eql(6);

        done();
      });
    });


    // TODO(nikku): needs to be implemented properly
    it.skip('should select tab before closing', function() {

      // given
      var tabs = app.openTabs([
        createBpmnFile(bpmnXML, UNSAVED_FILE),
        createBpmnFile(bpmnXML, UNSAVED_FILE),
        createBpmnFile(bpmnXML, UNSAVED_FILE)
      ]);

      var activeTab = app.activeTab;

      var closingTab = tabs[1];

      app.dialog.close = function(file, done) {
        expect(app.activeTab).to.eql(closingTab);
        done(null, null);
      };

      // when
      app.closeTab(closingTab);

      // then
      expect(app.activeTab).to.eql(activeTab);
    });


    it('should close all tabs', function() {

      // given
      var bpmnFile = createBpmnFile(bpmnXML);
      var dmnFile = createDmnFile(dmnXML);

      var tabs = app.openTabs([ bpmnFile, dmnFile ]);

      // when
      app.closeAllTabs();

      // then
      tabs.forEach(function(tab) {
        expect(app.tabs).to.not.contain(tab);
      });
    });


    it('should close other tabs', function() {

      // given
      var bpmnFile = createBpmnFile(bpmnXML);
      var dmnFile = createDmnFile(dmnXML);

      app.openTabs([ bpmnFile, dmnFile ]);

      var activeTab = app.activeTab;

      // when
      app.closeOtherTabs();

      // then
      expect(app.tabs).to.contain(activeTab);
      expect(app.tabs[1].id).to.equal('empty-tab');
    });


    it('should close other tabs with provided tab', function() {

      // given
      var bpmnFile = createBpmnFile(bpmnXML);
      var dmnFile = createDmnFile(dmnXML);

      app.openTabs([ bpmnFile, dmnFile ]);

      var tab = app.tabs[0];

      // when
      app.closeOtherTabs(tab);

      // then
      expect(app.tabs).to.contain(tab);
      expect(app.tabs[1].id).to.equal('empty-tab');
    });


    it('should close other tabs with provided tab id', function() {

      // given
      var bpmnFile = createBpmnFile(bpmnXML);
      var dmnFile = createDmnFile(dmnXML);

      app.openTabs([ bpmnFile, dmnFile ]);

      var tab = app.tabs[0];

      // when
      app.closeOtherTabs(tab.id);

      // then
      expect(app.tabs).to.contain(tab);
      expect(app.tabs[1].id).to.equal('empty-tab');
    });


    it('should close all tabs and prompt on unsaved', function() {

      // given
      var bpmnFile = createBpmnFile(bpmnXML, UNSAVED_FILE);
      var dmnFile = createDmnFile(dmnXML);

      var tabs = app.openTabs([ bpmnFile, dmnFile ]);

      dialog.setResponse('close', 'discard');

      // when
      app.closeAllTabs();

      // then
      expect(dialog.close).to.have.been.calledOnce;

      tabs.forEach(function(tab) {
        expect(app.tabs).to.not.contain(tab);
      });
    });


    it('should not close tabs with extisting files if hints provided', function() {

      // given
      var bpmnFile = createBpmnFile(bpmnXML, UNSAVED_FILE);
      var dmnFile = createDmnFile(dmnXML);

      var tabs = app.openTabs([ bpmnFile, dmnFile ]);

      var bpmnTab = tabs[0];
      var dmnTab = tabs[1];

      dialog.setResponse('close', 'discard');

      // when
      app._closeTabs(tabs, { skipIfDiscardChanges: true });

      // then
      expect(dialog.close).to.have.been.calledOnce;

      expect(app.tabs).to.contain(bpmnTab);
      expect(app.tabs).to.not.contain(dmnTab);
    });


    it('should abort closing all tabs on cancel', function() {

      // given
      var bpmnFile = createBpmnFile(bpmnXML);
      var dmnFile = createDmnFile(dmnXML, UNSAVED_FILE);

      var tabs = app.openTabs([ bpmnFile, dmnFile ]);

      dialog.setResponse('close', 'cancel');

      // when
      app.closeAllTabs();

      // then
      expect(dialog.close).to.have.been.calledOnce;

      expect(app.tabs).to.not.contain(tabs[0]);
      expect(app.tabs).to.contain(tabs[1]);
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

    it('should bind export-png');

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

      var clickEvent = new Event('click');

      // left click
      clickEvent.button = 0;

      // when
      simulateEvent(element, clickEvent);

      // then
      expect(createDiagram).to.have.been.calledWith('bpmn');
    });


    it('should prevent tab selection on close', function() {

      // given
      app.createDiagram('bpmn');

      // given
      var tree = render(app);

      var tabNode = select('.tabbed .tab:nth-child(1)', tree);
      var closeHandleNode = select('.close-handle', tabNode);

      // assume
      expect(tabNode).to.exist;
      expect(closeHandleNode).to.exist;

      var clickEvent = new Event('click');

      var stopPropagationSpy = spy(clickEvent, 'stopPropagation');

      // when
      simulateEvent(closeHandleNode, clickEvent);

      // then
      expect(stopPropagationSpy).to.have.been.called;
    });

  });


  describe('workspace', function() {

    describe('api', function() {

      describe('#persistWorkspace', function() {

        it('should persist empty', function(done) {

          // when
          app.persistWorkspace(function(err, workspaceConfig) {

            // then
            expect(err).not.to.exist;

            expect(workspaceConfig).to.have.keys([
              'tabs',
              'activeTab',
              'layout',
              'endpoints'
            ]);

            expect(workspaceConfig.tabs).to.have.length(0);
            expect(workspaceConfig.activeTab).to.eql(-1);

            done();
          });
        });


        it('should persist tabs', function(done) {

          // given
          var bpmnFile = createBpmnFile(bpmnXML),
              dmnFile = createDmnFile(dmnXML);

          app.openTabs([ bpmnFile, dmnFile ]);
          app.selectTab(app.tabs[0]);

          // when
          app.persistWorkspace(function(err, workspaceConfig) {

            expect(err).not.to.exist;

            expect(workspaceConfig).to.have.keys([
              'tabs',
              'activeTab',
              'layout',
              'endpoints'
            ]);

            expect(workspaceConfig.tabs).to.eql([ bpmnFile, dmnFile ]);

            expect(workspaceConfig.activeTab).to.eql(0);

            done();
          });
        });

        it('should persist endpoints', function(done) {
          // given
          var endpoints = ['first/endpoint', 'second/endpoint'];

          // when
          app.persistEndpoints(endpoints);

          // then
          app.persistWorkspace(function(err, workspaceConfig) {

            expect(err).not.to.exist;

            expect(workspaceConfig).to.have.keys([
              'tabs',
              'activeTab',
              'layout',
              'endpoints'
            ]);

            expect(workspaceConfig.endpoints).to.eql(endpoints);

            done();
          });

        });

      });


      describe('#restoreWorkspace', function() {

        it('should restore saved', function(done) {

          // given
          var bpmnFile = createBpmnFile(bpmnXML),
              dmnFile = createDmnFile(dmnXML);

          var layout = {
            propertiesPanel: {
              open: false,
              width: 250
            },
            log: {
              open: false,
              height: 150
            },
            minimap: {
              open: true
            }
          };

          var endpoints = ['first/endpoint', 'second/enpoint'];

          workspace.setSaved({
            tabs: [ bpmnFile, dmnFile ],
            activeTab: 1,
            layout: layout,
            endpoints: endpoints
          });

          // when
          app.restoreWorkspace(function(err) {

            // then
            expect(err).not.to.exist;

            // two tabs + empty tab are open
            expect(app.tabs).to.have.length(3);
            expect(app.activeTab).to.eql(app.tabs[1]);
            expect(app.layout).to.eql(layout);
            expect(app.endpoints).to.eql(endpoints);

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

            // no tab is active
            expect(app.activeTab).not.to.exist;

            // default enpoint
            expect(app.endpoints).to.eql([
              'http://localhost:8080/engine-rest/deployment/create'
            ]);

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
        app.openTabs([ bpmnFile ]);

        // then
        app.on('workspace:persisted', function(err, workspaceConfig) {

          expect(err).not.to.exist;

          expect(workspaceConfig.tabs).to.have.length(1);
          expect(workspaceConfig.activeTab).to.eql(0);

          done();
        });
      });


      it('should save on tab change', function(done) {

        // given
        var bpmnFile = createBpmnFile(bpmnXML),
            dmnFile = createDmnFile(dmnXML);

        // when
        app.openTabs([ bpmnFile, dmnFile ]);
        app.selectTab(app.tabs[1]);

        // then
        app.on('workspace:persisted', function(err, workspaceConfig) {

          expect(err).not.to.exist;

          expect(workspaceConfig.tabs).to.have.length(2);
          expect(workspaceConfig.activeTab).to.eql(1);

          done();
        });
      });


      it('should save on tab close', function(done) {

        // given
        var bpmnFile = createBpmnFile(bpmnXML),
            dmnFile = createDmnFile(dmnXML);

        // when
        app.openTabs([ bpmnFile, dmnFile ]);
        app.closeTab(app.tabs[1]);

        // then
        app.on('workspace:persisted', function(err, workspaceConfig) {

          expect(err).not.to.exist;

          expect(workspaceConfig.tabs).to.have.length(1);
          expect(workspaceConfig.activeTab).to.eql(0);

          done();
        });
      });


      it('should not save unsaved tabs', function(done) {

        // when
        app.createDiagram('bpmn');

        // then
        app.on('workspace:persisted', function(err, workspaceConfig) {
          expect(err).not.to.exist;

          expect(workspaceConfig.tabs).to.have.length(0);

          done();
        });

      });

      it('should save when clicking save in endpoint config', function(done) {
        // given
        app.toggleOverlay('configureEndpoint');
        var tree = render(app);
        var input = select('#endpoint-url', tree);
        var configForm = select('.endpoint-configuration form', tree);

        simulateEvent(input, 'change', {
          target: {
            value: 'some/endpoint'
          }
        });

        // when
        simulateEvent(configForm, 'submit', { preventDefault: () => {} });

        // then
        app.on('workspace:persisted', function(err, workspaceConfig) {
          expect(err).not.to.exist;
          expect(workspaceConfig.endpoints).to.eql(['some/endpoint']);
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

    beforeEach(function() {

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


    describe('focus', function() {

      it('should be emitted on the active tab once selected', function(done) {
        // when
        app._addTab(tab);

        // assume
        expect(app.activeTab).not.to.eql(tab);

        tab.on('focus', function() {
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


      it('should emit on editor "state-updated" event', function(done) {

        // given
        app._addTab(tab);

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


  describe('export', function() {

    describe('api', function() {

      function createTab(file) {
        app.openTabs([ file ]);

        return app.tabs[0];
      }

      it('should export image', function(done) {

        // given
        var tab = createTab(createBpmnFile(bpmnXML)),
            exportedFile = {
              name: 'diagram_1.png',
              path: 'diagram_1.png',
              contents: 'foo',
              fileType: 'png',
              isUnsaved: false
            };

        tab.activeEditor.exportAs = function(type, callback) {
          expect(type).to.eql('png');

          callback(null, { contents: 'foo' });
        };

        dialog.setResponse('exportAs', exportedFile);

        // when
        app.exportTab(tab, [ 'png', 'jpeg', 'svg' ], function(err, file) {

          // then
          expect(file.name).to.equal('diagram_1.png');
          expect(file.path).to.equal('diagram_1.png');
          expect(file.contents).to.equal('foo');
          expect(file.fileType).to.equal('png');

          done();
        });
      });


      it('should not export on unknown image type', function(done) {

        // given
        var tab = createTab(createBpmnFile(bpmnXML)),
            exportedFile = {
              name: 'diagram_1.unknown',
              path: 'diagram_1.unknown',
              contents: 'foo',
              fileType: 'unknown',
              isUnsaved: false
            };

        tab.activeEditor.exportAs = function(type, callback) {
          throw new Error('unexpected call');
        };

        dialog.setResponse('exportAs', exportedFile);

        // when
        app.exportTab(tab, [ 'png', 'jpeg', 'svg' ], function(err, file) {

          // then
          expect(err).to.exist;
          expect(err.message).to.eql('cannot export to <unknown>');

          done();
        });
      });


      it('should not export on user cancel', function(done) {

        // given
        var tab = createTab(createBpmnFile(bpmnXML));

        tab.activeEditor.exportAs = function(type, callback) {
          throw new Error('unexpected call');
        };

        dialog.setResponse('exportAs', null);

        // when
        app.exportTab(tab, [ 'png', 'jpeg', 'svg' ], function(err, file) {

          // then
          expect(err.message).to.eql(userCanceled().message);

          done();
        });
      });


      it('should not export on tab#exportAs error', function(done) {

        // given
        var tab = createTab(createBpmnFile(bpmnXML)),
            exportError = new Error('export failed'),
            exportedFile = {
              name: 'diagram_1.svg',
              path: 'diagram_1.svg',
              contents: 'foo',
              fileType: 'svg',
              isUnsaved: false
            };

        fileSystem.writeFile = function() {
          throw new Error('unexpected call');
        };

        tab.activeEditor.exportAs = function(type, callback) {
          callback(exportError);
        };

        dialog.setResponse('exportAs', exportedFile);

        // when
        app.exportTab(tab, [ 'svg' ], function(err, svg) {

          // then
          expect(err).to.equal(exportError);

          done();
        });
      });

    });


    describe('menu-bar', function() {

      it('should be enabled when exporting is allowed', function(done) {
        // given
        var bpmnFile = createBpmnFile(bpmnXML),
            exportButton = find(app.menuEntries.modeler.buttons, matchPattern({
              id: 'export-as'
            })),
            activeEditor;

        // when
        app.openTabs([ bpmnFile ]);

        activeEditor = app.activeTab.activeEditor;

        app.once('tools:state-changed', function() {
          // then
          expect(exportButton.disabled).to.be.false;

          done();
        });

        activeEditor.mountEditor(document.createElement('div'));
      });


      it('should show export as "jpeg" and "svg"', function(done) {
        // given
        var bpmnFile = createBpmnFile(bpmnXML),
            exportButton = find(app.menuEntries.modeler.buttons, matchPattern({
              id: 'export-as'
            })),
            bpmnTab;

        app.openTabs([ bpmnFile ]);

        bpmnTab = app.activeTab;

        app.once('tools:state-changed', function() {

          // then
          expect(exportButton.choices).to.have.length(2);

          expect(exportButton.choices).to.eql([
            'jpeg',
            'svg'
          ]);

          done();
        });

        // when
        app.emit('tools:state-changed', bpmnTab, { exportAs: [ 'jpeg', 'svg' ] });
      });


      describe('should update export button state', function() {

        it('when there are no open tabs', function() {
          // given
          var exportButton = find(app.menuEntries.modeler.buttons, matchPattern({
            id: 'export-as'
          }));

          // then
          expect(exportButton.disabled).to.be.true;
        });


        it('when closing a tab where it was enabled', function() {
          // given
          var bpmnFile = createBpmnFile(bpmnXML),
              exportButton;

          app.openTabs([ bpmnFile ]);

          app.closeTab(app.activeTab);

          exportButton = find(app.menuEntries.modeler.buttons, matchPattern({
            id: 'export-as'
          }));

          // then
          expect(exportButton.disabled).to.be.true;
        });


        it('when switching tabs', function(done) {
          // given
          var bpmnFile = createBpmnFile(bpmnXML),
              dmnFile = createDmnFile(dmnXML),
              exportButton = find(app.menuEntries.modeler.buttons, matchPattern({
                id: 'export-as'
              })),
              bpmnTab,
              activeEditor;

          app.openTabs([ bpmnFile, dmnFile ]);

          bpmnTab = app.tabs[0];

          activeEditor = bpmnTab.activeEditor;

          activeEditor.mountEditor(document.createElement('div'));

          app.once('tools:state-changed', function() {
            // then
            expect(exportButton.disabled).to.be.false;

            done();
          });

          // when -> selecting bpmn tab
          app.selectTab(bpmnTab);
        });


        it('when switching editor views', function(done) {
          // given
          var bpmnFile = createBpmnFile(bpmnXML),
              exportButton = find(app.menuEntries.modeler.buttons, matchPattern({
                id: 'export-as'
              })),
              activeTab, xmlEditor;

          app.openTabs([ bpmnFile ]);

          activeTab = app.activeTab;

          xmlEditor = activeTab.getEditor('xml');

          xmlEditor.mountEditor(document.createElement('div'));

          app.once('tools:state-changed', function() {
            // then
            expect(exportButton.disabled).to.be.true;

            done();
          });

          // when -> on xml view
          activeTab.setEditor(xmlEditor);
        });

      });

    });

  });


  describe('diagram deployment', function() {
    var browser,
        send,
        dmnFile,
        bpmnFile,
        cmmnFile,
        tenantId,
        deploymentName,
        payload;

    before(function() {
      browser = app.browser;

      send = spy(browser, 'send');

      bpmnFile = createBpmnFile(bpmnXML);
      dmnFile = createDmnFile(dmnXML);
      cmmnFile = createDmnFile(cmmnXML);

      tenantId = 'some tenant id';

      deploymentName = 'some deployment name';

      payload = {
        deploymentName: deploymentName,
        tenantId: tenantId
      };
    });

    afterEach(function() {
      spy = null;
    });


    it('should deploy bpmn file', function(done) {

      // given
      app.saveTab = function(tab, cb) {
        tab.setFile(bpmnFile);
        cb(null, bpmnFile);
      };

      app.openTab(bpmnFile);

      app.triggerAction('deploy', payload, function(err) {

        // then
        if (err) {
          done('Error: ', err);
        }

        var expectedPayload = {
          file: bpmnFile,
          deploymentName: deploymentName,
          tenantId: tenantId
        };

        expect(send).calledWith('deploy', expectedPayload, arg.any);

        done();
      });
    });


    it('should deploy dmn file', function(done) {

      // given
      app.saveTab = function(tab, cb) {
        tab.setFile(dmnFile);

        cb(null, dmnFile);
      };

      app.openTab(dmnFile);

      app.triggerAction('deploy', payload, function(err) {

        // then
        if (err) {
          done('Error: ', err);
        }

        var expectedPayload = {
          file: dmnFile,
          deploymentName: deploymentName,
          tenantId: tenantId
        };

        expect(send).calledWith('deploy', expectedPayload, arg.any);

        done();
      });
    });


    it('should deploy cmmn file', function(done) {

      // given
      app.saveTab = function(tab, cb) {
        tab.setFile(cmmnFile);

        cb(null, cmmnFile);
      };

      app.openTab(cmmnFile);

      app.triggerAction('deploy', payload, function(err) {

        // then
        if (err) {
          done('Error: ', err);
        }

        var expectedPayload = {
          file: cmmnFile,
          deploymentName: deploymentName,
          tenantId: tenantId
        };

        expect(send).calledWith('deploy', expectedPayload, arg.any);

        done();
      });

    });

  });


  describe('state management', function() {

    it('app should have empty initial state', function() {
      expect(app.state).to.eql({});
    });


    it('component state should be initialized with its initial state', function() {

      // given
      var initializeState = app.initializeState.bind(app);

      var expectedComponentState = { foo: 'bar' };

      var SomeComponent = function(options) {
        this.initialState = expectedComponentState;

        options.initializeState({
          self: this,
          key: 'SomeComponent'
        });
      };

      // when
      var someComponent = new SomeComponent({ initializeState: initializeState });

      // then
      var expectedAppState = { 'SomeComponent': expectedComponentState };

      expect(someComponent.state).to.eql(expectedComponentState);
      expect(app.state).to.eql(expectedAppState);
    });


    it('component setState should change component state', function() {

      // given
      var initializeState = app.initializeState.bind(app);

      var SomeComponent = function(options) {
        this.initialState = { foo: 'bar' };

        options.initializeState({
          self: this,
          key: 'SomeComponent'
        });
      };

      // when
      var someComponent = new SomeComponent({ initializeState: initializeState });

      var expectedComponentState = { foo: 'foo' };

      someComponent.setState(expectedComponentState);


      // then
      var expectedAppState = { 'SomeComponent': expectedComponentState };

      expect(someComponent.state).to.eql(expectedComponentState);
      expect(app.state).to.eql(expectedAppState);
    });
  });

});


/**
 * Patch save on a tab or a list of tabs.
 *
 * @param {Tab|Array<Tab>} tabs
 * @param {Error|FileDescriptor|Function} answer
 */
function patchSave(tabs, answer) {

  if (!('length' in tabs)) {
    tabs = [ tabs ];
  }

  tabs.forEach(function(tab) {

    var fn = typeof answer === 'function' ? answer : function(done) {
      if (answer instanceof Error) {
        return done(answer);
      }

      return done(null, answer || tab.file);
    };

    tab.save = fn;
  });
}


function userCanceled() {
  return new Error('user canceled');
}


function expectNewDiagramFile(diagramFile, expectedType) {

  expect(diagramFile).to.exist;
  expect(diagramFile.fileType).to.eql(expectedType);

  expect(
    definitionsId(diagramFile.contents)
  ).to.match(/^[0-9a-zA-Z]{6,10}$/);
}

function definitionsId(contents) {

  var match = /id="Definitions_([^"]+)"/.exec(contents);

  return match && match[1];
}