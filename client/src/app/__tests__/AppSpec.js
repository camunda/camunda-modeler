import React, { Component } from 'react';

import {
  shallow,
  mount
} from 'enzyme';

import {
  App,
  EMPTY_TAB
} from '../App';

import Log from '../Log';

import {
  Backend,
  Dialog,
  FileSystem,
  TabsProvider,
  Workspace
} from './mocks';

import pDefer from 'p-defer';


/* global sinon */
const { spy } = sinon;


describe('<App>', function() {

  describe('props', function() {

    it('tabsProvider');

    it('onReady');

    it('onContextMenu');


    describe('globals', function() {

      describe('backend', function() {

        it('should call Backend#sendUpdateMenu on tab change', function() {

          // given
          const backend = new Backend();

          const spy = sinon.spy(backend, 'sendUpdateMenu');

          const {
            app
          } = createApp({
            globals: {
              backend
            }
          });

          // when
          app.handleTabChanged()();

          // then
          expect(spy).to.have.been.called;
        });

      });

    });

  });


  describe('shared buttons', function() {

    it('should offer save, save-as, export, undo, redo if supported by tab');

  });


  describe('no tabs', function() {

    it('should render empty tab', function() {

      // when
      const {
        app
      } = createApp();

      // then
      const {
        tabs,
        activeTab
      } = app.state;

      expect(tabs).to.be.empty;
      expect(activeTab).to.equal(EMPTY_TAB);
    });


    it('should allow user to create new diagram', async function() {

      // given
      const {
        app,
        tree
      } = createApp(mount);

      await app.setActiveTab(EMPTY_TAB);

      const createButton = tree.find('button.create-bpmn');

      expect(createButton).to.exist;

      // when
      createButton.simulate('click');

      // then
      expect(app.state.tabs).to.have.length(1);
    });

  });


  describe('diagram creation', function() {

    it('should create + open as tabs', async function() {
      // given
      const {
        app
      } = createApp();

      // when
      await app.createDiagram('bpmn');
      await app.createDiagram('dmn');
      await app.createDiagram('cmmn');
      await app.createDiagram();

      // then
      const {
        tabs,
        activeTab
      } = app.state;

      expect(tabs.map(tab => tab.type)).to.eql([
        'bpmn',
        'dmn',
        'cmmn',
        'bpmn'
      ]);

      expect(activeTab).to.eql(tabs[3]);
    });

  });


  describe('#openFiles', function() {

    it('should create tabs', async function() {

      // given
      const {
        app
      } = createApp();

      const file1 = createFile('1.bpmn');
      const file2 = createFile('2.bpmn');

      // when
      const openedTabs = await app.openFiles([ file1, file2 ]);

      // then
      const {
        tabs,
        activeTab
      } = app.state;

      expect(openedTabs).to.eql(tabs);
      expect(activeTab).to.eql(app.findOpenTab(file2));
    });


    it('should keep existing tabs (by path)', async function() {

      // given
      const {
        app
      } = createApp();

      const file1 = createFile('1.bpmn');
      const file2 = createFile('2.bpmn');

      await app.openFiles([ file1, file2 ]);

      const lastOpenTabs = app.state.tabs;

      // when
      await app.openFiles([ file1 ]);

      // then
      const {
        tabs,
        activeTab
      } = app.state;

      expect(tabs).to.equal(lastOpenTabs);
      expect(tabs.map(tab => tab.file)).to.eql([ file1, file2 ]);

      // existing tab is focussed
      expect(activeTab).to.eql(app.findOpenTab(file1));
    });


    it('should open files', async function() {

      // given
      const dialog = new Dialog();

      dialog.setShowEmptyFileDialogResponse('create');

      const { app } = createApp({
        globals: {
          dialog
        }
      });

      const file1 = createFile('1.bpmn', null, '');
      const file2 = createFile('2.bpmn');

      // when
      const openedTabs = await app.openFiles([ file1, file2 ]);

      // then
      const {
        activeTab,
        tabs
      } = app.state;

      expect(tabs).to.have.length(2);
      expect(openedTabs).to.eql(tabs);
      expect(activeTab).to.eql(app.findOpenTab(file2));
    });

  });


  describe('#openEmptyFile', function() {

    it('should open empty file', async function() {

      // given
      const dialog = new Dialog();

      dialog.setShowEmptyFileDialogResponse('create');

      const { app } = createApp({
        globals: {
          dialog
        }
      });

      const file1 = createFile('1.bpmn', null, '');

      // when
      const tab = await app.openEmptyFile(file1);

      // then
      const {
        activeTab,
        tabs
      } = app.state;

      expect(tabs).to.have.length(1);
      expect(tabs).to.eql([ tab ]);
      expect(activeTab).to.eql(tab);
    });


    it('should NOT open empty TXT file', async function() {

      // given
      const dialog = new Dialog();

      dialog.setShowOpenFileErrorDialogResponse('cancel');

      const { app } = createApp({
        globals: {
          dialog
        }
      });

      const lastTab = app.state.activeTab;

      const file1 = createFile('1.txt', null, '');

      // when
      await app.openEmptyFile(file1);

      // then
      const {
        activeTab,
        tabs
      } = app.state;

      expect(tabs).to.have.length(0);
      expect(activeTab).to.eql(lastTab);
    });

  });


  describe('tab closing', function() {

    it('should close active', async function() {

      // given
      const {
        app
      } = createApp();

      const file1 = createFile('1.bpmn');
      const file2 = createFile('2.bpmn');

      await app.openFiles([ file1, file2 ]);

      const tab = app.state.activeTab;

      // when
      await app.closeTab(tab);

      // then
      const {
        tabs,
        activeTab
      } = app.state;

      expect(tabs).not.to.contain(tab);

      // existing tab is focussed
      expect(activeTab).to.eql(app.findOpenTab(file1));
    });


    it('should close all', async function() {

      // given
      const {
        app
      } = createApp();

      const file1 = createFile('1.bpmn');
      const file2 = createFile('2.bpmn');

      await app.openFiles([ file1, file2 ]);

      // when
      await app.closeTabs(t => true);

      // then
      const {
        tabs,
        activeTab
      } = app.state;

      expect(tabs).to.be.empty;

      // existing tab is focussed
      expect(activeTab).to.equal(EMPTY_TAB);
    });


    it('should ask user to save or discard changes before closing', async function() {

      // given
      const dialog = new Dialog();

      const {
        app
      } = createApp({
        globals: {
          dialog
        }
      });

      const showCloseFileDialogSpy = spy(dialog, 'showCloseFileDialog'),
            saveTabSpy = spy(app, 'saveTab');

      const tab = await app.createDiagram();

      dialog.setShowCloseFileDialogResponse('discard');

      // when
      await app.closeTab(tab);

      // then
      const {
        tabs
      } = app.state;

      expect(tabs).not.to.contain(tab);

      expect(showCloseFileDialogSpy).to.have.been.calledWith({
        name: tab.file.name
      });

      expect(saveTabSpy).not.to.have.been.called;
    });

  });


  describe('tab saving', function() {

    let showSaveFileDialogSpy,
        writeFileSpy,
        dialog,
        app,
        rendered;

    beforeEach(function() {

      // given
      dialog = new Dialog();

      showSaveFileDialogSpy = spy(dialog, 'showSaveFileDialog');

      const fileSystem = new FileSystem();

      writeFileSpy = spy(fileSystem, 'writeFile');

      rendered = createApp({
        globals: {
          dialog,
          fileSystem
        }
      }, mount);

      app = rendered.app;
    });

    afterEach(sinon.restore);


    it('should not try to save when save button is disabled', async function() {

      // given
      const actionSpy = sinon.spy(app, 'triggerAction');
      const saveButton = rendered.tree.find('Button[title="Save diagram"]').first();


      // when
      saveButton.simulate('click');

      // then
      expect(saveButton.prop('disabled')).to.be.true;
      expect(actionSpy).to.have.not.been.calledWith('save');
    });


    it('should save new file', async function() {

      // given
      const tab = await app.createDiagram();

      const { file } = tab;

      dialog.setShowSaveFileDialogResponse('diagram_2.bpmn');

      // when
      await app.triggerAction('save');

      // then
      expect(writeFileSpy).to.have.been.calledWith(
        'diagram_2.bpmn',
        file,
        {
          encoding: 'utf8',
          fileType: 'bpmn'
        }
      );
    });


    it('should save existing tab', async function() {

      // given
      const file = createFile('diagram_1.bpmn');

      await app.openFiles([ file ]);

      // when
      await app.triggerAction('save');

      // then
      expect(showSaveFileDialogSpy).not.to.have.been.called;

      expect(writeFileSpy).to.have.been.calledWith(
        file.path,
        {
          ...file,
          contents: 'CONTENTS'
        },
        {
          encoding: 'utf8',
          fileType: 'bpmn'
        }
      );
    });


    it('should save as existing tab', async function() {

      // given
      const file = createFile('diagram_1.bpmn');

      await app.openFiles([ file ]);

      dialog.setShowSaveFileDialogResponse('diagram_2.bpmn');

      // when
      await app.triggerAction('save-as');

      // then
      expect(showSaveFileDialogSpy).to.have.been.called;

      expect(writeFileSpy).to.have.been.calledWith(
        'diagram_2.bpmn',
        {
          ...file,
          contents: 'CONTENTS'
        },
        {
          encoding: 'utf8',
          fileType: 'bpmn'
        }
      );
    });


    it('should save all tabs');

  });


  describe('tab exporting', function() {

    let showSaveFileDialogSpy,
        writeFileSpy;

    let dialog, app;

    beforeEach(function() {

      // given
      dialog = new Dialog();

      const fileSystem = new FileSystem();

      showSaveFileDialogSpy = spy(dialog, 'showSaveFileDialog');
      writeFileSpy = spy(fileSystem, 'writeFile');

      const rendered = createApp({
        globals: {
          dialog,
          fileSystem
        }
      }, mount);

      app = rendered.app;
    });


    it('should export SVG', async function() {

      // given
      await app.createDiagram();

      dialog.setShowSaveFileDialogResponse('foo.svg');

      // when
      await app.triggerAction('export-as');

      // then
      expect(showSaveFileDialogSpy).to.have.been.called;

      expect(writeFileSpy).to.have.been.calledWith(
        'foo.svg',
        {
          contents: 'EXPORT CONTENTS',
          name: 'diagram_1.bpmn',
          path: null
        }, {
          encoding: 'utf8',
          fileType: 'svg'
        });
    });


    it('should export PNG', async function() {

      // given
      await app.createDiagram();

      dialog.setShowSaveFileDialogResponse('foo.png');

      // when
      await app.triggerAction('export-as');

      // then
      expect(showSaveFileDialogSpy).to.have.been.called;

      expect(writeFileSpy).to.have.been.calledWith(
        'foo.png',
        {
          contents: 'EXPORT CONTENTS',
          name: 'diagram_1.bpmn',
          path: null
        }, {
          encoding: 'base64',
          fileType: 'png'
        });
    });

  });


  describe('tab changing', function() {

    it('should update contents on tab changed', async function() {

      // given
      const {
        app
      } = createApp();

      await app.createDiagram('bpmn');

      const {
        activeTab
      } = app.state;

      const newContents = 'foo';

      // when
      app.handleTabChanged(activeTab)({
        contents: newContents
      });

      // then
      expect(activeTab.file.contents).to.equal(newContents);
    });

  });


  describe('tab loading', function() {

    it('should support life-cycle', async function() {

      // given
      const events = [];

      const onTabChanged = spy(function(tab, oldTab) {
        events.push([ 'tab-changed', tab ]);

        app.handleTabShown(tab)();
      });

      const onTabShown = spy(function(tab) {
        events.push([ 'tab-shown', tab ]);
      });

      const {
        app
      } = createApp({
        onTabChanged,
        onTabShown
      });

      // when
      const tab = await app.createDiagram('bpmn');

      // then
      expect(events).to.eql([
        [ 'tab-changed', tab ],
        [ 'tab-shown', tab ]
      ]);
    });


    it('should lazy load via tabsProvider', async function() {

      // given
      const events = [];

      const onTabChanged = spy(function(tab, oldTab) {
        events.push([ 'tab-changed', tab ]);
      });

      const onTabShown = spy(function(tab) {
        events.push([ 'tab-shown', tab ]);
      });

      const {
        app
      } = createApp({
        onTabChanged,
        onTabShown
      }, mount);

      // when
      const tab = await app.createDiagram('bpmn');

      // then
      expect(events).to.eql([
        [ 'tab-changed', tab ],
        [ 'tab-shown', tab ]
      ]);
    });

  });


  describe('tab navigation', function() {

    let app, openedTabs;

    beforeEach(async function() {
      const rendered = createApp();

      app = rendered.app;

      const file1 = createFile('1.bpmn');
      const file2 = createFile('2.bpmn');

      openedTabs = [
        await app.createDiagram(),
        ...(await app.openFiles([ file1, file2 ])),
        await app.createDiagram(),
      ];

      // assume
      const {
        tabs,
        activeTab
      } = app.state;

      expect(tabs).to.eql(openedTabs);
      expect(activeTab).to.eql(openedTabs[3]);
    });


    it('should select tab', async function() {

      // when
      await app.selectTab(openedTabs[0]);

      // then
      const {
        activeTab
      } = app.state;

      expect(activeTab).to.eql(openedTabs[0]);
    });


    describe('should navigate', function() {

      it('back', async function() {

        // when
        await app.navigate(-1);

        // then
        const {
          activeTab
        } = app.state;

        expect(activeTab).to.eql(openedTabs[2]);
      });


      it('forward', async function() {

        // when
        await app.navigate(1);

        // then
        const {
          activeTab
        } = app.state;

        expect(activeTab).to.eql(openedTabs[0]);
      });

    });


    describe('tab moving', function() {

      let app, openedTabs;

      beforeEach(async function() {
        const rendered = createApp();

        app = rendered.app;

        const file1 = createFile('1.bpmn');
        const file2 = createFile('2.bpmn');

        openedTabs = [
          await app.createDiagram(),
          ...(await app.openFiles([ file1, file2 ])),
          await app.createDiagram(),
        ];

        // assume
        const {
          tabs,
          activeTab
        } = app.state;

        expect(tabs).to.eql(openedTabs);
        expect(activeTab).to.eql(openedTabs[3]);
      });


      it('should move tab', async function() {

        // given
        const expectedTabs = [
          openedTabs[0],
          openedTabs[2],
          openedTabs[1],
          openedTabs[3]
        ];

        // when
        app.moveTab(openedTabs[2], 1);

        // then
        expect(app.state.tabs).to.eql(expectedTabs);
        expect(app.state.activeTab).to.equal(openedTabs[2]);
      });


      it('should not move tab to invalid index -1', function() {

        // given
        function moveTabToInvalidIndex() {
          app.moveTab(openedTabs[0], -1);
        }

        // then
        expect(moveTabToInvalidIndex).to.throw();
      });

    });


    describe('should reopen last', function() {

      it('saved', async function() {

        // given
        const savedTab = openedTabs[2];
        const file = savedTab.file;

        await app.closeTab(savedTab);

        // when
        await app.triggerAction('reopen-last-tab');

        // then
        const {
          activeTab
        } = app.state;

        expect(activeTab.file).to.eql(file);
      });


      it('reject unsaved', async function() {

        // given
        const newTab = openedTabs[3];

        await app.closeTab(newTab);

        // when
        try {
          await app.triggerAction('reopen-last-tab');

          expect.fail('expected exception');
        } catch (e) {
          expect(e.message).to.eql('no last tab');
        }
      });


      it('after all closed', async function() {

        // given
        await app.closeTabs((t) => true);

        // when
        await app.triggerAction('reopen-last-tab');
        await app.triggerAction('reopen-last-tab');

        // then
        const {
          activeTab,
          tabs
        } = app.state;

        const expectedOpen = [
          app.findOpenTab(openedTabs[2].file),
          app.findOpenTab(openedTabs[1].file)
        ];

        expect(tabs).to.eql(expectedOpen);
        expect(activeTab).to.eql(expectedOpen[1]);
      });

    });


    describe('__internal__', function() {

      it('should reset state on all closed', async function() {

        // when
        await app.triggerAction('close-all-tabs');

        // then
        const tabHistory = app.tabHistory;

        expect(tabHistory.elements).to.be.empty;
        expect(tabHistory.idx).to.eql(-1);
        expect(tabHistory.get()).not.to.exist;
      });

    });

  });


  describe('tab errors', function() {

    it('should propagate', async function() {

      // given
      const errorSpy = spy();

      const {
        app
      } = createApp({ onError: errorSpy }, mount);

      const tab = await app.createDiagram();

      const tabInstance = app.tabRef.current;

      const error = new Error('YZO!');

      // when
      tabInstance.triggerAction('error', error);

      // then
      expect(errorSpy).to.have.been.calledWith(error, tab);
    });


    it('should show in log', async function() {

      // given
      const {
        app
      } = createApp(mount);

      await app.createDiagram();

      const tabInstance = app.tabRef.current;

      const error = new Error('YZO!');

      // when
      tabInstance.triggerAction('error', error);

      // then
      expect(app.state.layout.log.open).to.be.true;
      expect(app.state.logEntries).to.have.length(1);
    });


    describe('should catch', function() {

      const errorHandler = window.onerror;

      before(function() {
        // disable mocha implicit error handling
        window.onerror = () => {};
      });

      after(function() {
        window.onError = errorHandler;
      });


      it('works', async function() {

        // given
        const deferred = pDefer();

        function onError(error) {
          deferred.resolve(error);
        }

        const {
          app
        } = createApp({ onError }, mount);

        await app.createDiagram();

        const tabInstance = app.tabRef.current;

        const error = new Error('YZO!');

        // when
        tabInstance.triggerAction('errorThrow', error);

        // then
        const caughtError = await deferred.promise;

        expect(caughtError).to.exist;

        // TODO(nikku): without cross-origin errors
        // expect(caughtError).to.equal(error);
      });

    });

  });


  describe('tab warnings', function() {

    it('should propagate', async function() {

      // given
      const warningSpy = spy();

      const {
        app
      } = createApp({ onWarning: warningSpy }, mount);

      const tab = await app.createDiagram();

      const tabInstance = app.tabRef.current;

      // when
      const warning = {
        message: 'warning'
      };

      tabInstance.triggerAction('warning', warning);

      // then
      expect(warningSpy).to.have.been.calledWith(warning, tab);
    });


    it('should show in log', async function() {

      // given
      const {
        app
      } = createApp(mount);

      await app.createDiagram();

      const tabInstance = app.tabRef.current;

      // when
      const warning = {
        message: 'warning'
      };

      tabInstance.triggerAction('warning', warning);

      // then
      expect(app.state.layout.log.open).to.be.true;
      expect(app.state.logEntries).to.have.length(1);
    });

  });


  describe('workspace integration', function() {

    describe('should notify #onWorkspaceChanged', function() {

      it('on layout change', function() {

        // given
        const changedSpy = spy(() => {});

        const { app } = createApp({
          onWorkspaceChanged: changedSpy
        });

        // when
        app.setLayout({});

        // then
        expect(changedSpy).to.have.been.calledOnce;
      });


      it('on activeTab / tabs change', function() {

        // given
        const changedSpy = spy(() => {});

        const { app } = createApp({
          onWorkspaceChanged: changedSpy
        });

        // when
        app.createDiagram('bpmn');

        // then
        expect(changedSpy).to.have.been.calledTwice;
      });

    });

  });


  describe('log', function() {

    it('should toggle open', function() {

      // given
      const { app } = createApp();

      app.setLayout({});

      // when
      app.toggleLog(true);

      // then
      expect(app.state.layout).to.eql({
        log: { open: true }
      });
    });


    it('should toggle closed', function() {

      // given
      const { app } = createApp();

      app.setLayout({
        log: { open: true }
      });

      // when
      app.toggleLog(false);

      // then
      expect(app.state.layout).to.eql({
        log: { open: false }
      });
    });


    it('should clear', function() {

      // given
      const { app } = createApp();

      app.setState({ logEntries: [ 'A', 'B' ] });

      // when
      app.clearLog();

      // then
      expect(app.state.logEntries).to.be.empty;
    });


    it('should render with expanded state', function() {

      // given
      const { tree, app } = createApp();

      app.setLayout({ log: { open: true } });

      // when
      const log = tree.find(Log).first();

      // then
      expect(log.props().expanded).to.be.true;
    });


    it('#logEntry', function() {

      // given
      const { tree, app } = createApp();

      app.setLayout({ log: { open: false } });

      // when
      app.logEntry('foo', 'bar');

      // then
      const log = tree.find(Log).first();

      expect(app.state.logEntries).to.eql([{
        message: 'foo',
        category: 'bar'
      }]);

      expect(log.props().expanded).to.be.true;
    });

  });


  describe('customization', function() {

    class CustomEmptyTab extends Component {

      componentDidMount() {
        this.props.onShown();
      }

      render() {
        expect(this.props.tab).to.equal(EMPTY_TAB);
        expect(this.props.onAction).to.exist;

        return <div></div>;
      }
    }


    it('should allow replacement of empty tab', function() {

      // given
      const resolveTabSpy = spy(function(type) {
        expect(type).to.eql('empty');

        return CustomEmptyTab;
      });

      const tabsProvider = new TabsProvider(resolveTabSpy);

      // when
      createApp({ tabsProvider }, mount);

      // then
      expect(resolveTabSpy).to.have.been.calledOnce;
    });

  });


  describe('#showOpenFilesDialog', function() {

    it('should open dialog and open files', async function() {

      // given
      const filePaths = [
        'diagram_1.bpmn',
        'diagram_2.bpmn'
      ];

      const dialog = new Dialog();

      const fileSystem = new FileSystem({
        readFile: (filePath) => createFile(filePath)
      });

      dialog.setShowOpenFilesDialogResponse(filePaths);

      const showOpenFilesDialogSpy = spy(dialog, 'showOpenFilesDialog');

      const { app } = createApp({
        globals: {
          dialog,
          fileSystem
        }
      });

      const openFilesSpy = spy(app, 'openFiles');

      // when
      await app.showOpenFilesDialog();

      // then
      expect(showOpenFilesDialogSpy).to.have.been.called;
      expect(openFilesSpy).to.have.been.called;
    });


    it('should open dialog and NOT open files', async function() {

      // given
      const dialog = new Dialog();

      dialog.setShowOpenFilesDialogResponse([]);

      const showOpenFilesDialogSpy = spy(dialog, 'showOpenFilesDialog');

      const { app } = createApp({
        globals: {
          dialog
        }
      });

      const openFilesSpy = spy(app, 'openFiles');

      // when
      await app.showOpenFilesDialog();

      // then
      expect(showOpenFilesDialogSpy).to.have.been.called;
      expect(openFilesSpy).not.to.have.been.called;
    });

  });


  it('#showDialog', function() {

    // given
    const showSpy = spy();

    const dialog = new Dialog({
      show: showSpy
    });

    const { app } = createApp({
      globals: {
        dialog
      }
    });

    const options = {
      type: 'info'
    };

    // when
    app.showDialog(options);

    // then
    expect(showSpy).to.have.been.calledWith(options);
  });


  it('#openExternalUrl', function() {

    // given
    const sendSpy = spy();

    const backend = new Backend({
      send: sendSpy
    });

    const { app } = createApp({
      globals: {
        backend
      }
    });

    const options = {
      url: 'foo'
    };

    // when
    app.openExternalUrl(options);

    // then
    expect(sendSpy).to.have.been.calledWith('external:open-url', options);
  });

});


class Cache {
  destroy() { }
}


function createApp(options = {}, mountFn=shallow) {

  if (typeof options === 'function') {
    mountFn = options;
    options = {};
  }

  let app;

  const cache = options.cache || new Cache();

  const defaultGlobals = {
    backend: new Backend(),
    dialog: new Dialog(),
    fileSystem: new FileSystem(),
    workspace: new Workspace()
  };

  const globals = {
    ...defaultGlobals,
    ...(options.globals || {})
  };

  const tabsProvider = options.tabsProvider || new TabsProvider();

  const defaultOnTabChanged = mountFn === shallow && function(newTab) {
    app.handleTabShown(newTab)();
  };

  const onTabChanged = options.onTabChanged || defaultOnTabChanged;

  const onWorkspaceChanged = options.onWorkspaceChanged;
  const onTabShown = options.onTabShown || function() {
    tree.update();
  };

  const onReady = options.onReady;
  const onError = options.onError;
  const onWarning = options.onWarning;

  const tree = mountFn(
    <App
      cache={ cache }
      globals={ globals }
      tabsProvider={ tabsProvider }
      onReady={ onReady }
      onError={ onError }
      onWarning={ onWarning }
      onTabChanged={ onTabChanged }
      onTabShown={ onTabShown }
      onWorkspaceChanged={ onWorkspaceChanged }
    />
  );

  app = tree.instance();

  return {
    tree,
    app
  };

}


function createFile(name, path, contents = 'foo') {

  path = typeof path === 'undefined' ? name : path;

  return {
    name,
    path,
    contents
  };
}