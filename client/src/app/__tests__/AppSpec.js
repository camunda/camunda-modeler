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

import mitt from 'mitt';

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


  describe('open files', function() {

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

  });


  describe('tab saving', function() {

    let askSaveSpy;
    let writeFileSpy;

    let app;

    beforeEach(function() {

      // given
      const dialog = new Dialog();
      const fileSystem = new FileSystem();

      dialog.setAskSaveResponse(Promise.resolve('save'));

      askSaveSpy = spy(dialog, 'askSave');
      writeFileSpy = spy(fileSystem, 'writeFile');

      const rendered = createApp({
        globals: {
          dialog,
          fileSystem
        }
      }, mount);

      app = rendered.app;
    });


    it('should save new file', async function() {

      // given
      const tab = await app.createDiagram();

      const fileName = tab.file.name;

      // when
      await app.triggerAction('save');

      // then
      expect(askSaveSpy).not.to.have.been.called;

      expect(writeFileSpy).to.have.been.calledWith(
        { name: fileName, contents: 'CONTENTS', path: null },
        { saveAs: true }
      );
    });


    it('should save existing tab', async function() {

      // given
      const file = createFile('1.bpmn');

      await app.openFiles([ file ]);

      // when
      await app.triggerAction('save');

      // then
      expect(askSaveSpy).not.to.have.been.called;

      expect(writeFileSpy).to.have.been.calledWith(
        { ...file, contents: 'CONTENTS' },
        { saveAs: false }
      );
    });


    it('should save as existing tab', async function() {

      // given
      const file = createFile('1.bpmn');

      await app.openFiles([ file ]);

      // when
      await app.triggerAction('save-as');

      // then
      expect(askSaveSpy).not.to.have.been.called;

      expect(writeFileSpy).to.have.been.calledWith(
        { ...file, contents: 'CONTENTS' },
        { saveAs: true }
      );
    });


    it('should ask to save on close', async function() {

      // given
      const tab = await app.createDiagram();

      // when
      await app.triggerAction('close-tab', { tabId: tab.id });

      // then
      expect(askSaveSpy).to.have.been.calledOnce;

      expect(writeFileSpy).to.have.been.calledWith(
        { name: 'diagram_1.bpmn', path: null, contents: 'CONTENTS' },
        { saveAs: true }
      );
    });


    it('should save all tabs');

  });


  describe('tab exporting', function() {

    let askExportAsSpy;
    let writeFileSpy;

    let app;

    beforeEach(function() {

      // given
      const dialog = new Dialog();
      const fileSystem = new FileSystem();

      dialog.setAskExportAsResponse(Promise.resolve({
        fileType: 'svg',
        name: 'foo.svg',
        path: 'foo'
      }));

      askExportAsSpy = spy(dialog, 'askExportAs');
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

      // when
      await app.triggerAction('export-as');

      // then
      expect(askExportAsSpy).to.have.been.called;

      expect(writeFileSpy).to.have.been.calledWith({
        contents: 'CONTENTS',
        fileType: 'svg',
        name: 'foo.svg',
        path: 'foo'
      });
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
    dialog: new Dialog(),
    eventBus: mitt(),
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


function createFile(name, path) {

  path = typeof path === 'undefined' ? name : path;

  return {
    name,
    path
  };
}