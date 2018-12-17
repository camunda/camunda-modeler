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
  Config,
  Dialog,
  FileSystem,
  TabsProvider,
  Workspace
} from './mocks';

import pDefer from 'p-defer';

import {
  assign
} from 'min-dash';

/* global sinon */
const { spy } = sinon;


describe('<App>', function() {

  describe('props', function() {

    it('tabsProvider');

    it('onReady');

    it('onContextMenu');

  });


  describe('shared buttons', function() {

    it('should offer save, save-as, export, undo, redo if supported by tab');

  });


  describe('menu', function() {

    describe('should update (calling onMenuUpdate)', function() {

      it('on tab switch', async function() {

        // given
        const updateMenuSpy = spy();

        const {
          app
        } = createApp({
          onMenuUpdate: updateMenuSpy
        });

        const openedTabs = await app.openFiles([
          createFile('1.bpmn'),
          createFile('2.bpmn')
        ]);

        // when
        await app.showTab(openedTabs[0]);

        // then
        // 1 - initial tab rendered
        // 2 - second tab rendered
        expect(updateMenuSpy).to.have.been.calledTwice;
      });


      it('on tab change', function() {

        // given
        const updateMenuSpy = spy();

        const {
          app
        } = createApp({
          onMenuUpdate: updateMenuSpy
        });

        // when
        app.handleTabChanged()();

        // then
        // 1 - tab render
        expect(updateMenuSpy).to.have.been.calledOnce;
      });


      it('on tab closing', async function() {

        // given
        const updateMenuSpy = spy();

        const {
          app
        } = createApp({
          onMenuUpdate: updateMenuSpy
        });

        await app.openFiles([
          createFile('1.bpmn'),
          createFile('2.bpmn')
        ]);

        // when
        await app.triggerAction('close-all-tabs');

        // then
        // 1 - initial tab rendered
        // 2 - empty tab rendered
        expect(updateMenuSpy).to.have.been.calledTwice;

        expect(app.state.tabState).to.eql({});
      });

    });


    describe('should maintain initial state', function() {

      it('on empty tab rendering', async function() {

        // given
        const updateMenuSpy = spy();

        // when
        const {
          app
        } = createApp({
          onMenuUpdate: updateMenuSpy
        }, mount);

        // when
        await app.setActiveTab(EMPTY_TAB);

        // then
        expect(updateMenuSpy).not.to.have.been.called;

        expect(app.state.tabState).to.eql({});
      });

    });

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


    it('should ignore unrecognized files', async function() {

      // given
      const {
        app
      } = createApp();

      const file = createFile('1.unknown');

      // when
      const openedTabs = await app.openFiles([ file ]);

      // then
      expect(openedTabs).to.be.empty;
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
        tabs,
        dirtyTabs
      } = app.state;

      expect(tabs).to.have.length(1);
      expect(tabs).to.eql([ tab ]);
      expect(activeTab).to.eql(tab);

      expect(dirtyTabs).to.have.property(tab.id, true);
    });


    it('should open empty file with correct options', async function() {

      // given
      const dialog = new Dialog();

      dialog.setShowEmptyFileDialogResponse('create');

      const showSpy = spy(dialog, 'showEmptyFileDialog');

      const { app } = createApp({
        globals: {
          dialog
        }
      });

      const file1 = createFile('1.bpmn', null, '');

      // when
      await app.openEmptyFile(file1);

      // then
      expect(showSpy).to.have.been.calledWith({
        file: file1,
        type: 'bpmn'
      });
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

    let app,
        dialog,
        fileSystem,
        showSaveFileDialogSpy,
        showSaveFileErrorDialogSpy,
        writeFileSpy,
        rendered;

    beforeEach(function() {

      // given
      dialog = new Dialog();
      fileSystem = new FileSystem();

      showSaveFileDialogSpy = spy(dialog, 'showSaveFileDialog');
      showSaveFileErrorDialogSpy = spy(dialog, 'showSaveFileErrorDialog');

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


    it('should handle save error <cancel>', async function() {

      // given
      await app.createDiagram();

      dialog.setShowSaveFileDialogResponse('foo.svg');
      dialog.setShowSaveFileErrorDialogResponse('cancel');

      const err = new Error('foo');

      fileSystem.setWriteFileResponse(Promise.reject(err));

      // when
      await app.triggerAction('save-as');

      // then
      expect(showSaveFileErrorDialogSpy).to.have.been.called;
    });


    it('should handle save error <save-as>', async function() {

      // given
      await app.createDiagram();

      dialog.setShowSaveFileDialogResponse('foo.svg');
      dialog.setShowSaveFileErrorDialogResponse('save-as');

      const err = new Error('foo');

      fileSystem.setWriteFileResponse(0, Promise.reject(err));
      fileSystem.setWriteFileResponse(1, Promise.resolve({
        contents: '<contents>'
      }));

      const saveTabSpy = spy(app, 'saveTab');

      // when
      await app.triggerAction('save-as');

      // then
      expect(showSaveFileErrorDialogSpy).to.have.been.called;

      expect(saveTabSpy).to.have.been.calledTwice;
      expect(writeFileSpy).to.have.been.calledTwice;
    });

  });


  describe('tab exporting', function() {

    let app,
        dialog,
        fileSystem,
        showSaveFileDialogSpy,
        showSaveFileErrorDialogSpy,
        writeFileSpy;

    beforeEach(function() {

      // given
      dialog = new Dialog();
      fileSystem = new FileSystem();

      showSaveFileDialogSpy = spy(dialog, 'showSaveFileDialog');
      showSaveFileErrorDialogSpy = spy(dialog, 'showSaveFileErrorDialog');

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
        }
      );
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
        }
      );
    });


    it('should handle export error <cancel>', async function() {

      // given
      await app.createDiagram();

      dialog.setShowSaveFileDialogResponse('foo.svg');
      dialog.setShowSaveFileErrorDialogResponse('cancel');

      const err = new Error('foo');

      fileSystem.setWriteFileResponse(Promise.reject(err));

      // when
      await app.triggerAction('export-as');

      // then
      expect(showSaveFileErrorDialogSpy).to.have.been.called;
    });


    it('should handle export error <export-as>', async function() {

      // given
      await app.createDiagram();

      dialog.setShowSaveFileDialogResponse('foo.svg');
      dialog.setShowSaveFileErrorDialogResponse('export-as');

      const err = new Error('foo');

      fileSystem.setWriteFileResponse(0, Promise.reject(err));
      fileSystem.setWriteFileResponse(1, Promise.resolve({
        contents: '<contents>'
      }));

      const exportAsSpy = spy(app, 'exportAs');

      // when
      await app.triggerAction('export-as');

      // then
      expect(showSaveFileErrorDialogSpy).to.have.been.called;

      expect(exportAsSpy).to.have.been.calledTwice;
      expect(writeFileSpy).to.have.been.calledTwice;
    });

  });


  describe('#handleTabContentUpdated', function() {

    let app, tab;

    beforeEach(async function() {

      app = createApp().app;

      await app.createDiagram('bpmn');

      tab = app.state.activeTab;

    });

    it('should call #updateTab when new content is given', async function() {

      // given
      const updateSpy = spy(app, 'updateTab');

      // when
      app.handleTabContentUpdated(tab)({
        newContent: '< bar/>'
      });

      // then
      expect(updateSpy).to.have.been.called;
    });


    it('should NOT call #updateTab when NO new content given', async function() {

      // given
      const updateSpy = spy(app, 'updateTab');

      // when
      app.handleTabContentUpdated(tab)();

      // then
      expect(updateSpy).to.not.have.been.called;
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
        const navigationHistory = app.navigationHistory;

        expect(navigationHistory.elements).to.be.empty;
        expect(navigationHistory.idx).to.eql(-1);
        expect(navigationHistory.get()).not.to.exist;
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


  describe('#checkFileChanged', function() {

    const NEW_FILE_CONTENTS = 'bar';

    let file1, file2, fileSystem, readFileSpy;

    beforeEach(function() {

      file1 = createFile('1.bpmn', 'foo', 'foo', 0);
      file2 = createFile('2.bpmn', 'foobar');

      readFileSpy = spy(_ => {
        return assign(file1, {
          contents: NEW_FILE_CONTENTS
        });
      });

      fileSystem = new FileSystem({
        readFile: readFileSpy
      });
    });


    it('should notify if content changed', async function() {

      // given
      const showSpy = spy(_ => {
        return 'ok';
      });

      const dialog = new Dialog({
        show: showSpy
      });

      fileSystem.setReadFileStatsResponse({
        lastModified: new Date().getMilliseconds()
      });

      const { app } = createApp({
        globals: {
          dialog,
          fileSystem
        }
      }, mount);

      const openedTabs = await app.openFiles([ file1, file2 ]);

      const tab = openedTabs[0];

      const oldTabContents = tab.file.contents;

      // when
      await app.checkFileChanged(tab);

      // then
      expect(showSpy).to.have.been.called;
      expect(readFileSpy).to.have.been.called;
      expect(tab.file.contents).to.not.equal(oldTabContents);
      expect(tab.file.contents).to.equal(NEW_FILE_CONTENTS);
    });


    it('should NOT notify if content not changed', async function() {

      // given
      const showSpy = spy();

      const dialog = new Dialog({
        show: showSpy
      });

      fileSystem.setReadFileStatsResponse({
        lastModified: 0
      });

      const { app } = createApp({
        globals: {
          dialog,
          fileSystem
        }
      });

      const openedTabs = await app.openFiles([ file1, file2 ]);

      const tab = openedTabs[0];

      // when
      await app.checkFileChanged(tab);

      // then
      expect(showSpy).to.not.have.been.called;
      expect(readFileSpy).to.not.have.been.called;
    });


    it('should NOT notify on new file', async function() {

      // given
      const showSpy = spy();

      const dialog = new Dialog({
        show: showSpy
      });

      const { app } = createApp({
        globals: {
          dialog,
          fileSystem
        }
      });

      // when
      await app.openFiles([ file1, file2 ]);

      // then
      expect(showSpy).to.not.have.been.called;
      expect(readFileSpy).to.not.have.been.called;
    });


    it('should NOT update file contents on cancelling', async function() {

      // given
      const showSpy = spy(_ => {
        return 'cancel';
      });

      const dialog = new Dialog({
        show: showSpy
      });

      fileSystem.setReadFileStatsResponse({
        lastModified: new Date().getMilliseconds()
      });

      const { app } = createApp({
        globals: {
          dialog,
          fileSystem
        }
      });

      const openedTabs = await app.openFiles([ file1, file2 ]);

      const tab = openedTabs[0];

      const oldTabContents = tab.file.contents;

      // when
      await app.checkFileChanged(tab);

      // then
      expect(showSpy).to.have.been.called;
      expect(readFileSpy).to.not.have.been.called;
      expect(tab.file.contents).to.equal(oldTabContents);
    });

  });


  describe('#updateTab', function() {
    let app,
        errorSpy,
        tab,
        tabs;

    beforeEach(async function() {

      const rendered = createApp({
        onError: errorSpy
      });

      app = rendered.app;

      await app.createDiagram('bpmn');

      tabs = app.state.tabs;

      tab = tabs[0];
    });

    it('should update tab', async function() {

      // given
      const newAttrs = {
        name: 'foo.bpmn'
      };

      // when
      const updatedTab = await app.updateTab(tab, newAttrs);

      // then
      expect(updatedTab.name).to.eql('foo.bpmn');
    });


    it('should update tab with nested attributes', async function() {

      // given
      const name = 'foo.bpmn';

      // when
      const updatedTab = await app.updateTab(tab, {
        file: {
          ...tab.file,
          name
        }
      });

      const file = updatedTab.file;

      // then
      expect(file.name).to.eql('foo.bpmn');
      expect(file.contents).to.exist;
    });


    it('should update navigation history', async function() {
      // given
      const newAttrs = {
        name: 'foo.bpmn'
      };

      // when
      const updatedTab = await app.updateTab(tab, newAttrs);

      const {
        navigationHistory
      } = app;

      const tabs = navigationHistory.elements;

      // then
      expect(tabs).to.not.include(tab);
      expect(tabs).to.include(updatedTab);
    });


    it('should update app state with updated tab', async function() {

      // given
      const newAttrs = {
        name: 'foo.bpmn'
      };

      // when
      const updatedTab = await app.updateTab(tab, newAttrs);

      const {
        activeTab,
        tabs
      } = app.state;

      // then
      expect(updatedTab).to.not.eql(tab);
      expect(updatedTab).to.eql(activeTab);
      expect(tabs).to.not.include(tab);
      expect(tabs).to.include(updatedTab);
    });


    it('should raise error when call with id', async function() {

      // given
      const newAttrs = {
        id: 'foo'
      };

      // when
      try {

        await app.updateTab(tab, newAttrs);

        expect.fail('expected exception');
      } catch (e) {

        // then
        expect(e.message).to.eql('must not change tab.id');
      }
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


  describe('modal handling', function() {

    let app;

    beforeEach(function() {
      const rendered = createApp();

      app = rendered.app;
    });


    it('should open modal', function() {
      // given
      const fakeModalName = 'modal';

      // when
      app.openModal(fakeModalName);

      // then
      expect(app.state.currentModal).to.eql(fakeModalName);
    });


    it('should close modal', function() {
      // given
      const fakeModalName = 'modal';
      app.setState({ currentModal: fakeModalName });

      // when
      app.closeModal();

      // then
      expect(app.state.currentModal).to.eql(null);
    });


    it('should update menu when modal is closed', function() {
      // given
      const updateMenuSpy = sinon.spy(app, 'updateMenu');
      const fakeModalName = 'modal';
      app.setState({ currentModal: fakeModalName });

      // when
      app.closeModal();

      // then
      expect(updateMenuSpy).to.be.calledOnce;
    });

  });


  describe('deployment handling', function() {

    afterEach(sinon.restore);


    it('should handle deployment', async function() {
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

      const file = createFile('1.bpmn');
      await app.openFiles([ file ]);

      const saveStub = sinon.stub(app, 'saveTab').resolves();

      // when
      await app.handleDeploy({});

      // then
      expect(saveStub).to.be.calledOnce;
      expect(sendSpy).to.be.calledOnceWith('deploy', { file });
    });


    it('should save tab before deployment', async function() {
      // given
      const fakeFile = createFile('saved.bpmn');
      const sendSpy = spy();

      const backend = new Backend({
        send: sendSpy
      });

      const { app } = createApp({
        globals: {
          backend
        }
      });

      const saveStub = sinon.stub(app, 'saveTab').callsFake(() => {
        app.tabSaved(app.state.activeTab, fakeFile);

        return Promise.resolve();
      });

      // when
      await app.createDiagram();
      await app.handleDeploy({});

      // then
      expect(saveStub).to.be.calledOnce;
      expect(sendSpy).to.be.calledOnce;
    });


    it('should throw error when tab is not saved before deployment', async function() {
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

      const saveStub = sinon.stub(app, 'saveTab').resolves();


      // when
      await app.createDiagram();
      await app.handleDeploy({});

      // then
      expect(saveStub).to.be.calledOnce;
      expect(sendSpy).to.not.be.called;
    });

  });


  describe('config handling', function() {

    afterEach(sinon.restore);


    it('should load requested config', async function() {
      // given
      const CONFIG_KEY = 'CONFIG_KEY';
      const getConfigSpy = spy();

      const config = new Config({
        get: getConfigSpy
      });

      const { app } = createApp({
        globals: {
          config
        }
      });

      // when
      app.loadConfig(CONFIG_KEY);

      // then
      expect(getConfigSpy).to.be.calledOnceWith(CONFIG_KEY);
    });

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

  const onMenuUpdate = options.onMenuUpdate || function() {};
  const onReady = options.onReady;
  const onError = options.onError;
  const onWarning = options.onWarning;

  const tree = mountFn(
    <App
      cache={ cache }
      globals={ globals }
      tabsProvider={ tabsProvider }
      onMenuUpdate={ onMenuUpdate }
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


function createFile(name, path, contents = 'foo', lastModified) {

  path = typeof path === 'undefined' ? name : path;

  return {
    contents,
    name,
    path,
    lastModified
  };
}