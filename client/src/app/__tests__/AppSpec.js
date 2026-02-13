/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { createRef, Component } from 'react';

import { render, waitFor, screen } from '@testing-library/react';

import {
  App,
  EMPTY_TAB,
  getOpenFileErrorDialog
} from '../App';

import Flags, { DISABLE_REMOTE_INTERACTION } from '../../util/Flags';

import {
  Backend,
  Cache,
  Config,
  Deployment,
  Dialog,
  FileSystem,
  Plugins,
  Settings,
  StartInstance,
  SystemClipboard,
  TabsProvider,
  TabStorage,
  Workspace,
  ZeebeAPI
} from './mocks';

import pDefer from 'p-defer';

import {
  assign
} from 'min-dash';

/* global sinon */

const { spy } = sinon;

const noop = () => {};


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

        const { app } = createApp({
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


      it('on tab change', async function() {

        // given
        const updateMenuSpy = spy();

        const { app } = createApp({
          onMenuUpdate: updateMenuSpy
        });

        // when
        app.handleTabChanged()();

        // then
        // 1 - tab render
        await waitFor(() => {
          expect(updateMenuSpy).to.have.been.calledOnce;
        });
      });


      it('on tab closing', async function() {

        // given
        const updateMenuSpy = spy();

        const { app, queryByText } = createApp({
          onMenuUpdate: updateMenuSpy
        });

        await app.openFiles([
          createFile('1.bpmn'),
          createFile('2.bpmn')
        ]);

        // when
        await app.triggerAction('close-active-tab');

        // then
        await waitFor(() => {
          expect(queryByText('2.bpmn')).not.to.exist;
        });

        expect(updateMenuSpy).to.have.been.called;
      });

    });


    describe('should maintain initial state', function() {

      it('on empty tab rendering', async function() {

        // given
        const updateMenuSpy = spy();

        // when
        const { app } = createApp({
          onMenuUpdate: updateMenuSpy
        });

        // when
        await app.showTab(EMPTY_TAB);

        // then
        expect(updateMenuSpy).not.to.have.been.called;

        expect(app.state.tabState).to.eql({});
      });

    });


    describe('should indicate lastTab state', function() {

      it('no last tab', async function() {

        // given
        const updateMenuSpy = spy();

        const { app } = createApp({
          onMenuUpdate: updateMenuSpy
        });

        // when
        await app.openFiles([
          createFile('1.bpmn'),
          createFile('2.bpmn')
        ]);

        // then
        expect(updateMenuSpy).to.have.been.calledWith(sinon.match({
          lastTab: false
        }));

      });


      it('closed tab', async function() {

        // given
        const updateMenuSpy = spy();

        const { app } = createApp({
          onMenuUpdate: updateMenuSpy
        });

        // when
        await app.openFiles([
          createFile('1.bpmn'),
          createFile('2.bpmn')
        ]);

        await app.triggerAction('close-all-tabs');

        // then
        expect(updateMenuSpy).to.have.been.calledWith(sinon.match({
          lastTab: true
        }));

      });

    });


    it('should include tabs', async function() {

      // given
      const updateMenuSpy = spy();

      const { app } = createApp({
        onMenuUpdate: updateMenuSpy
      });

      // when
      await app.openFiles([
        createFile('1.bpmn')
      ]);

      // then
      expect(updateMenuSpy.firstCall.args[0]).to.have.property('tabs', app.state.tabs);
    });


    describe('should include activeTab', function() {

      it('opened tab', async function() {

        // given
        const updateMenuSpy = spy();

        const { app } = createApp({
          onMenuUpdate: updateMenuSpy
        });

        // when
        await app.openFiles([
          createFile('1.bpmn')
        ]);

        // then
        expect(updateMenuSpy.firstCall.args[0]).to.have.property('activeTab', app.state.tabs[0]);
      });


      it('closed tab', async function() {

        // given
        const updateMenuSpy = spy();

        const { app } = createApp({
          onMenuUpdate: updateMenuSpy
        });

        // when
        await app.openFiles([
          createFile('1.bpmn')
        ]);

        await app.triggerAction('close-all-tabs');

        // then
        expect(updateMenuSpy.lastCall.args[0]).to.have.deep.property('activeTab', EMPTY_TAB);
      });

    });

  });


  describe('no tabs', function() {

    it('should render empty tab', function() {

      // when
      const { app } = createApp();

      // then
      const {
        tabs,
        activeTab
      } = app.state;

      expect(tabs).to.be.empty;
      expect(activeTab).to.equal(EMPTY_TAB);
    });

  });


  describe('diagram creation', function() {

    it('should create + open as tabs', async function() {

      // given
      const { app } = createApp();

      // when
      await app.createDiagram('bpmn');
      await app.createDiagram('dmn');
      await app.createDiagram('cloud-bpmn');
      await app.createDiagram('cloud-dmn');
      await app.createDiagram();

      // then
      const {
        tabs,
        activeTab
      } = app.state;
      expect(tabs.map(tab => tab.type)).to.eql([
        'bpmn',
        'dmn',
        'cloud-bpmn',
        'cloud-dmn',
        'bpmn'
      ]);

      expect(activeTab).to.eql(tabs[ tabs.length - 1 ]);
    });

  });


  describe('file context', function() {

    it('should send <file-context:opened> event to backend on tab opened', async function() {

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

      // when
      const file1 = createFile('1.cloud-bpmn');

      await app.openFiles([ file1 ]);

      // then
      expect(sendSpy).to.have.been.calledWith('file-context:file-opened', file1.path, {
        processor: 'bpmn'
      });
    });


    it('should not send <file-context:opened> to backend event on unsaved tab opened', async function() {

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

      // when
      await app.createDiagram('cloud-bpmn');

      // then
      expect(sendSpy).not.to.have.been.calledWith('file-context:file-opened');
    });


    it('should send <file-context:file-closed> to backend on tab closed', async function() {

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

      // when
      const file1 = createFile('1.cloud-bpmn');

      const [ tab ] = await app.openFiles([ file1 ]);

      await app.closeTab(tab);

      // then
      expect(sendSpy).to.have.been.calledWith('file-context:file-closed', file1.path);
    });


    it('should not send <file-context:file-closed> to backend on unsaved tab closed', async function() {

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

      // when
      const tab = await app.createDiagram('cloud-bpmn');

      await app.closeTab(tab);

      // then
      expect(sendSpy).not.to.have.been.calledWith('file-context:file-closed');
    });


    it('should send <file-context:file-updated> to backend on tab saved', async function() {

      // given
      const sendSpy = spy();

      const backend = new Backend({
        send: sendSpy
      });

      const fileSystem = new FileSystem();

      const { app } = createApp({
        globals: {
          backend,
          fileSystem
        }
      });

      // when
      const file1 = createFile('1.cloud-bpmn');

      fileSystem.setWriteFileResponse(0, Promise.resolve({
        ...file1
      }));

      await app.openFiles([ file1 ]);

      await app.triggerAction('save');

      // then
      expect(sendSpy).to.have.been.calledWith('file-context:file-updated', file1.path, {
        processor: 'bpmn'
      });
    });

  });


  describe('#openFiles', function() {

    it('should create tabs', async function() {

      // given
      const { app } = createApp();

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


    it('should not open unrecognized files', async function() {

      // given
      const dialog = new Dialog();

      const showSpy = spy(dialog, 'showOpenFileErrorDialog');

      dialog.setShowOpenFileErrorDialogResponse({ button: 'cancel' });

      const { app } = createApp({
        globals: {
          dialog
        }
      });

      const file = createFile('1.txt');

      // when
      const openedTabs = await app.openFiles([ file ]);

      // then
      expect(openedTabs).to.be.empty;
      expect(showSpy).to.have.been.called;
    });


    it('should keep existing tabs (by path)', async function() {

      // given
      const { app } = createApp();

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

      dialog.setShowEmptyFileDialogResponse({ button: 'create' });

      const { app } = createApp({
        globals: {
          dialog
        }
      });

      const file1 = createFile('1.bpmn', { contents: '' });
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


    describe('active file handling', function() {

      const file1 = createFile('1.bpmn');
      const file2 = createFile('2.bpmn');

      it('should open active file tab', async function() {

        // given
        const { app } = createApp();

        // when
        await app.openFiles([ file1, file2 ], file1);

        // then
        await waitFor(() => {
          expect(screen.getByText('1.bpmn')).to.exist;
          expect(screen.getByText('2.bpmn')).to.exist;
        });

        const activeTab = app.findOpenTab(file2);
        expect(activeTab).to.eql(app.state.activeTab);
      });


      it('should not open tab', async function() {

        // given
        const { app } = createApp();

        // when
        await app.openFiles([ file1, file2 ], false);

        // then
        const {
          activeTab
        } = app.state;

        expect(activeTab).to.eql(EMPTY_TAB);
      });

    });

  });


  describe('#openEmptyFile', function() {

    it('should open empty file', async function() {

      // given
      const dialog = new Dialog();

      dialog.setShowEmptyFileDialogResponse({ button: 'create' });

      const { app } = createApp({
        globals: {
          dialog
        }
      });

      const file1 = createFile('1.bpmn', { contents: '' });

      // when
      const tab = await app.openEmptyFile(file1);

      // then
      const {
        activeTab,
        tabs,
        unsavedTabs
      } = app.state;

      expect(tabs).to.have.length(1);
      expect(tabs).to.eql([ tab ]);
      expect(activeTab).to.eql(tab);

      expect(unsavedTabs).to.have.property(tab.id, true);
    });


    it('should open empty file with correct options', async function() {

      // given
      const dialog = new Dialog();

      dialog.setShowEmptyFileDialogResponse({ button: 'create' });

      const showSpy = spy(dialog, 'showEmptyFileDialog');

      const { app } = createApp({
        globals: {
          dialog
        }
      });

      const file1 = createFile('1.bpmn', { contents: '' });

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

      dialog.setShowOpenFileErrorDialogResponse({ button: 'cancel' });

      const { app } = createApp({
        globals: {
          dialog
        }
      });

      const lastTab = app.state.activeTab;

      const file1 = createFile('1.txt', { contents: '' });

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
      const { app } = createApp();

      const file1 = createFile('1.bpmn');
      const file2 = createFile('2.bpmn');

      await app.openFiles([ file1, file2 ]);

      const tab = app.state.activeTab;

      // when
      await app.closeTab(tab);

      // then
      await waitFor(() => {
        expect(app.state.tabs).not.to.contain(tab);
      });

      expect(app.state.activeTab).to.eql(app.findOpenTab(file1));
    });

    it('should close all', async function() {

      // given
      const { app } = createApp();

      const file1 = createFile('1.bpmn');
      const file2 = createFile('2.bpmn');

      // when
      await app.openFiles([ file1, file2 ]);

      // assume
      await waitFor(() => {
        expect(screen.getByText('1.bpmn')).to.exist;
        expect(screen.getByText('2.bpmn')).to.exist;
      });

      // when
      await app.closeTabs(t => true);

      // then
      await waitFor(() => {
        expect(screen.queryByText('1.bpmn')).not.to.exist;
        expect(screen.queryByText('2.bpmn')).not.to.exist;
        expect(app.state.tabs).to.be.empty;

        // existing tab is focussed
        expect(app.state.activeTab).to.equal(EMPTY_TAB);
      });
    });


    it('should ask user to save or discard changes before closing', async function() {

      // given
      const dialog = new Dialog();

      const { app } = createApp({
        globals: {
          dialog
        }
      });

      const showCloseFileDialogSpy = spy(dialog, 'showCloseFileDialog'),
            saveTabSpy = spy(app, 'saveTab');

      const tab = await app.createDiagram();

      // when
      app.state.dirtyTabs = { ...app.setDirty(tab).dirtyTabs };

      dialog.setShowCloseFileDialogResponse({ button: 'discard' });

      // when
      await app.closeTab(tab);

      // then
      expect(showCloseFileDialogSpy).to.have.been.calledWith({
        name: tab.file.name
      });

      expect(saveTabSpy).not.to.have.been.called;
    });


    it('should ask user to save or discard changes before quiting', async function() {

      // given
      const dialog = new Dialog();

      const { app } = createApp({
        globals: {
          dialog
        }
      });

      const showCloseFileDialogSpy = spy(dialog, 'showCloseFileDialog'),
            saveTabSpy = spy(app, 'saveTab');

      const tab = await app.createDiagram();

      app.state.dirtyTabs = { ...app.setDirty(tab).dirtyTabs };

      dialog.setShowCloseFileDialogResponse({ button: 'discard' });

      // when
      await app.quit();

      // then
      expect(showCloseFileDialogSpy).to.have.been.calledWith({
        name: tab.file.name
      });

      expect(saveTabSpy).not.to.have.been.called;
    });


    it('should stop asking the user on cancel', async function() {

      // given
      const dialog = new Dialog();

      const { app } = createApp({
        globals: {
          dialog
        }
      });

      const showCloseFileDialogSpy = spy(dialog, 'showCloseFileDialog'),
            saveTabSpy = spy(app, 'saveTab');

      const tab = await app.createDiagram();
      const tab2 = await app.createDiagram();

      app.state.dirtyTabs = {
        ...app.setDirty(tab).dirtyTabs,
        ...app.setDirty(tab2).dirtyTabs
      };

      dialog.setShowCloseFileDialogResponse({ button: 'cancel' });

      // when
      await app.quit();

      // then
      expect(showCloseFileDialogSpy).to.have.been.calledOnce;

      expect(showCloseFileDialogSpy).to.have.been.calledWith({
        name: tab.file.name
      });

      expect(saveTabSpy).not.to.have.been.called;
    });


    it('should not close tab when saving dialog is canceled', async function() {

      // given
      const dialog = new Dialog();

      const { app } = createApp({
        globals: {
          dialog
        }
      });

      const tab = await app.createDiagram();

      app.state.dirtyTabs = { ...app.setDirty(tab).dirtyTabs, };

      dialog.setShowCloseFileDialogResponse({ button: 'save' });
      dialog.setShowSaveFileDialogResponse(false);

      // when
      const closeTabResponse = await app.closeTab(tab);

      // then
      const {
        tabs
      } = app.state;

      expect(tabs).to.contain(tab);
      expect(closeTabResponse).to.eql(false);
    });


    it('should resolve to false if saving was canceled', async function() {

      // given
      const dialog = new Dialog();

      const { app } = createApp({
        globals: {
          dialog
        }
      });

      const tab = await app.createDiagram();

      app.state.dirtyTabs = { ...app.setDirty(tab).dirtyTabs, };

      dialog.setShowCloseFileDialogResponse({ button: 'cancel' });

      // when
      const closeTabResponse = await app.closeTab(tab);

      // then
      const {
        tabs
      } = app.state;

      expect(tabs).to.contain(tab);
      expect(closeTabResponse).to.eql(false);
    });


    it('should emit <app.tabsChanged> event on tab closed', async function() {

      // given
      const eventSpy = sinon.spy();

      const { app } = createApp();

      const tab = await app.createDiagram('bpmn');

      app.on('app.tabsChanged', eventSpy);

      // when
      await app.closeTab(tab);

      // then
      await waitFor(() => {
        expect(eventSpy).to.have.been.calledOnce;
      });
    });


    it('should emit <tab.closed> event on tab closed', async function() {

      // given
      const eventSpy = sinon.spy();

      const { app } = createApp();

      const tab = await app.createDiagram('bpmn');

      app.on('tab.closed', eventSpy);

      // when
      await app.closeTab(tab);

      // then
      expect(eventSpy).to.have.been.calledOnce;
    });

  });


  describe('tab saving', function() {

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

      app = (createApp({
        globals: {
          dialog,
          fileSystem
        }
      })).app;
    });

    afterEach(sinon.restore);


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


    it('should save existing dirty tab', async function() {

      // given
      const file = createFile('diagram_1.bpmn');

      const [ tab ] = await app.openFiles([ file ]);

      // when
      app.setState({
        ...app.setDirty(tab)
      });

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


    it('should save any tab', async function() {

      // given
      const file1 = createFile('diagram_1.bpmn');
      const file2 = createFile('diagram_2.bpmn');

      const [ tab1 ] = await app.openFiles([ file1, file2 ]);

      // when
      app.setState({
        ...app.setDirty(tab1) // inactive tab
      });

      await app.triggerAction('save-tab', { tab: tab1 });

      // then
      expect(writeFileSpy).to.have.been.calledWith(
        file1.path,
        {
          ...file1,
          contents: 'CONTENTS'
        },
        {
          encoding: 'utf8',
          fileType: 'bpmn'
        }
      );
    });


    it('should save tab with correct extension', async function() {

      // given
      const file = createFile('diagram_1.bpmn');

      await app.openFiles([ file ]);

      dialog.setShowSaveFileDialogResponse('diagram_2');

      // when
      await app.triggerAction('save-as');

      // then
      expect(showSaveFileDialogSpy).to.have.been.called;

      expect(writeFileSpy).to.have.been.calledWith(
        'diagram_2',
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


    it('should save multiple times', async function() {

      // given
      const file = createFile('diagram_1.bpmn');
      fileSystem.setWriteFileResponse(0, Promise.resolve(file));

      await app.openFiles([ file ]);

      // when
      await app.triggerAction('save');
      await app.triggerAction('save');

      // then
      expect(writeFileSpy).to.have.been.calledTwice;
    });


    it('should save all tabs');


    it('should emit <tab.saved> after save', async function() {

      // given
      const file = createFile('diagram_1.bpmn');

      const [ tab ] = await app.openFiles([ file ]);

      // when
      app.setState({
        ...app.setDirty(tab)
      });

      const saveSpy = spy(function(event) {
        const {
          tab
        } = event;

        expect(tab).to.exist;
      });

      app.on('tab.saved', saveSpy);

      await app.triggerAction('save');

      // then
      expect(saveSpy).to.have.been.calledOnce;
    });


    it('should handle save error <cancel>', async function() {

      // given
      await app.createDiagram();

      dialog.setShowSaveFileDialogResponse('foo.svg');
      dialog.setShowSaveFileErrorDialogResponse({ button: 'cancel' });

      const err = new Error('foo');

      fileSystem.setWriteFileResponse(Promise.reject(err));

      // when
      await app.triggerAction('save-as');

      // then
      expect(showSaveFileErrorDialogSpy).to.have.been.called;
    });


    it('should handle save error <retry>', async function() {

      // given
      await app.createDiagram();

      dialog.setShowSaveFileDialogResponse('foo.svg');
      dialog.setShowSaveFileErrorDialogResponse({ button: 'retry' });

      const err = new Error('foo');

      fileSystem.setWriteFileResponse(0, Promise.reject(err));
      fileSystem.setWriteFileResponse(1, Promise.resolve({
        contents: '<contents>'
      }));

      const saveTabSpy = spy(app, 'saveTabAsFile');

      // when
      await app.triggerAction('save-as');

      // then
      expect(showSaveFileErrorDialogSpy).to.have.been.called;

      expect(saveTabSpy).to.have.been.calledTwice;
      expect(writeFileSpy).to.have.been.calledTwice;
    });


    it('should trigger <saveTab.start> action before saving tab', async function() {

      // given
      var staveTabStartSpy = spy(app, 'triggerAction');

      // when
      await app.triggerAction('save');

      // then
      expect(staveTabStartSpy).to.have.been.calledWith('saveTab.start');
    });


    describe('config migration', function() {

      it('should migrate config on save (file path changed)', async function() {

        // given
        const file = createFile('diagram.bpmn');

        await app.openFiles([ file ]);

        const migrateConfigSpy = spy(app, 'migrateConfigForFile');

        dialog.setShowSaveFileDialogResponse('new-diagram.bpmn');

        fileSystem.setWriteFileResponse({
          path: 'new-diagram.bpmn',
          contents: '<contents>'
        });

        // when
        await app.triggerAction('save-as');

        // then
        expect(migrateConfigSpy).to.have.been.calledOnceWith(
          {
            'path': 'diagram.bpmn',
            'contents': 'foo',
            'lastModified': undefined,
            'name': 'diagram.bpmn'
          },
          {
            'path': 'new-diagram.bpmn',
            'contents': '<contents>'
          });
      });


      it('should not migrate on save (file path unchanged)', async function() {

        // given
        const file = createFile('diagram.bpmn');

        await app.openFiles([ file ]);

        const migrateConfigSpy = spy(app, 'migrateConfigForFile');

        dialog.setShowSaveFileDialogResponse('diagram.bpmn');

        fileSystem.setWriteFileResponse({
          path: 'diagram.bpmn',
          contents: '<contents>'
        });

        // when
        await app.triggerAction('save');

        // then
        expect(migrateConfigSpy).to.not.have.been.called;
      });

    });

  });


  describe('auto-save', function() {

    let app,
        dialog,
        fileSystem,
        writeFileSpy;

    beforeEach(function() {

      // given
      dialog = new Dialog();
      fileSystem = new FileSystem();

      writeFileSpy = spy(fileSystem, 'writeFile');

      app = (createApp({
        globals: {
          dialog,
          fileSystem
        }
      })).app;
    });

    afterEach(sinon.restore);


    it('should auto-save dirty tab with existing path', async function() {

      // given
      const file = createFile('diagram_1.bpmn');
      const [ tab ] = await app.openFiles([ file ]);

      // mark as dirty
      await setStateSync(app, app.setDirty(tab));

      // when
      await app.autoSave(tab);
      await waitSaved();

      // then
      expect(writeFileSpy).to.have.been.calledOnce;
    });


    it('should NOT auto-save clean tab', async function() {

      // given
      const file = createFile('diagram_1.bpmn');
      await app.openFiles([ file ]);

      const { activeTab } = app.state;

      // when
      await app.autoSave(activeTab);
      await waitSaved();

      // then
      expect(writeFileSpy).not.to.have.been.called;
    });


    it('should NOT auto-save new tab without path', async function() {

      // given
      const tab = await app.createDiagram('bpmn');

      // mark as dirty
      await setStateSync(app, app.setDirty(tab));

      // when
      await app.autoSave(tab);
      await waitSaved();

      // then
      // Should NOT write file because new files haven't been saved yet
      expect(writeFileSpy).not.to.have.been.called;
    });


    it('should NOT auto-save empty tab', async function() {

      // given
      const { activeTab } = app.state;

      // assume
      expect(app.isEmptyTab(activeTab)).to.be.true;

      // when
      await app.autoSave(activeTab);
      await waitSaved();

      // then
      expect(writeFileSpy).not.to.have.been.called;
    });


    it('should auto-save previous tab on tab switch', async function() {

      // given
      const file1 = createFile('diagram_1.bpmn');
      const file2 = createFile('diagram_2.bpmn');

      const [ tab1, tab2 ] = await app.openFiles([ file1, file2 ]);

      // switch to tab1 and mark it as dirty
      await app.selectTab(tab1);
      await setStateSync(app, app.setDirty(tab1));

      // when: switch to tab2
      await app.selectTab(tab2);
      await waitSaved();

      // then: should have auto-saved tab1
      expect(writeFileSpy).to.have.been.calledOnce;
    });


    it('should auto-save on new tab creation', async function() {

      // given
      const file1 = createFile('diagram_1.bpmn');

      const [ tab1 ] = await app.openFiles([ file1 ]);

      // switch to tab1 and mark it as dirty
      await app.selectTab(tab1);
      await setStateSync(app, app.setDirty(tab1));

      // when: switch to new tab
      await app.createDiagram('bpmn');
      await waitSaved();

      // then: should have auto-saved tab1
      expect(writeFileSpy).to.have.been.calledOnce;
    });


    it('should auto-save previous tab on navigation', async function() {

      // given
      const file1 = createFile('diagram_1.bpmn');
      const file2 = createFile('diagram_2.bpmn');

      const [ tab1, _ ] = await app.openFiles([ file1, file2 ]);

      // show tab1 and mark it as dirty
      await app.showTab(tab1);
      await setStateSync(app, app.setDirty(tab1));

      // when: navigating
      await app.navigate(-1);
      await waitSaved();

      // then: should have auto-saved tab1
      expect(writeFileSpy).to.have.been.calledOnce;
    });


    it('should auto-save previous tab on tab show', async function() {

      // given
      const file1 = createFile('diagram_1.bpmn');
      const file2 = createFile('diagram_2.bpmn');

      const [ tab1, tab2 ] = await app.openFiles([ file1, file2 ]);

      // show tab1 and mark it as dirty
      await app.showTab(tab1);
      await setStateSync(app, app.setDirty(tab1));

      // when: show tab2
      await app.showTab(tab2);
      await waitSaved();

      // then: should have auto-saved tab1
      expect(writeFileSpy).to.have.been.calledOnce;
    });


    it('should NOT auto-save unsaved tab on tab switch', async function() {

      // given
      const file1 = createFile('diagram_1.bpmn');

      await app.openFiles([ file1 ]);

      const newTab = await app.createDiagram('bpmn');

      // mark new tab as dirty
      await setStateSync(app, app.setDirty(newTab));

      // when: switch to another tab
      await app.selectTab(app.state.tabs[0]);
      await waitSaved();

      // then: should NOT have auto-saved new tab
      expect(writeFileSpy).not.to.have.been.called;
    });


    it('should handle auto-save on window blur', async function() {

      // given
      const file = createFile('diagram_1.bpmn');
      const [ tab ] = await app.openFiles([ file ]);

      // mark as dirty
      await setStateSync(app, app.setDirty(tab));

      // when
      await app.triggerAction('window-blurred');

      // then
      expect(writeFileSpy).to.have.been.calledOnce;
    });


    it('should show notification on auto-save error', async function() {

      // given
      const file = createFile('diagram_1.bpmn');
      const [ tab ] = await app.openFiles([ file ]);

      // mark as dirty
      await setStateSync(app, app.setDirty(tab));

      const err = new Error('write failed');
      fileSystem.setWriteFileResponse(Promise.reject(err));

      const displayNotificationSpy = spy(app, 'displayNotification');

      // when
      await app.autoSave(tab);

      // then
      expect(displayNotificationSpy).to.have.been.calledOnce;
      expect(displayNotificationSpy).to.have.been.calledWithMatch({
        type: 'error',
        title: 'Auto-save failed'
      });
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

      app = createApp({
        globals: {
          dialog,
          fileSystem
        }
      }).app;
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
      dialog.setShowSaveFileErrorDialogResponse({ button: 'cancel' });

      const err = new Error('foo');

      fileSystem.setWriteFileResponse(Promise.reject(err));

      // when
      await app.triggerAction('export-as');

      // then
      expect(showSaveFileErrorDialogSpy).to.have.been.called;
    });


    it('should handle export error <retry>', async function() {

      // given
      await app.createDiagram();

      dialog.setShowSaveFileDialogResponse('foo.svg');
      dialog.setShowSaveFileErrorDialogResponse({ button: 'retry' });

      const err = new Error('foo');

      fileSystem.setWriteFileResponse(0, Promise.reject(err));
      fileSystem.setWriteFileResponse(1, Promise.resolve({
        contents: '<contents>'
      }));

      const exportAsSpy = spy(app, 'exportAsFile');

      // when
      await app.triggerAction('export-as');

      // then
      expect(showSaveFileErrorDialogSpy).to.have.been.called;

      expect(exportAsSpy).to.have.been.calledTwice;
      expect(writeFileSpy).to.have.been.calledTwice;
    });


    it('should handle missing export extension', async function() {

      // given
      await app.createDiagram();

      dialog.setShowSaveFileDialogResponse('foo');

      // when
      await app.triggerAction('export-as');

      // then
      expect(showSaveFileDialogSpy).to.have.been.called;

      expect(writeFileSpy).not.to.have.been.called;
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

      // when
      const { app } = createApp({
        onTabChanged,
        onTabShown
      });

      await waitFor(() => {
        expect(events).to.eql([
          [ 'tab-shown', EMPTY_TAB ]
        ]);
      });

      const tab = await app.createDiagram('bpmn');

      // then
      expect(events).to.eql([
        [ 'tab-shown', EMPTY_TAB ],
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

      // when
      const { app } = createApp({
        onTabChanged,
        onTabShown
      });

      await waitFor(() => {
        expect(events).to.eql([
          [ 'tab-shown', EMPTY_TAB ]
        ]);
      });

      const tab = await app.createDiagram('bpmn');

      // then
      expect(events).to.eql([
        [ 'tab-shown', EMPTY_TAB ],
        [ 'tab-changed', tab ],
        [ 'tab-shown', tab ]
      ]);
    });


    it('should emit <app.tabsChanged> event on tab created', async function() {

      // given
      const eventSpy = sinon.spy();

      const { app } = createApp();

      app.on('app.tabsChanged', eventSpy);

      // when
      await app.createDiagram('bpmn');

      // then
      expect(eventSpy).to.have.been.calledOnce;
    });

  });


  describe('tab navigation', function() {

    let app, openedTabs;

    beforeEach(async function() {

      app = createApp().app;

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
        app = createApp().app;

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
        await waitFor(() => {
          expect(app.state.tabs).to.eql(expectedTabs);
        });

        // we don't implicitly activate tab on move
        // this happens on drag start instead
        expect(app.state.activeTab).to.equal(openedTabs[3]);
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
        await app.triggerAction('reopen-last-tab');

        // then
        const {
          activeTab
        } = app.state;

        expect(activeTab.file).not.to.equal(newTab);
      });

      it('after all closed', async function() {

        // given
        await app.triggerAction('close-all-tabs');

        // wait for tabs to close
        await waitFor(() => {
          expect(app.state.tabs).to.be.empty;
        });

        // when
        await app.triggerAction('reopen-last-tab');
        await app.triggerAction('reopen-last-tab');

        // then
        await waitFor(() => {
          const expectedOpen = [
            app.findOpenTab(openedTabs[2].file),
            app.findOpenTab(openedTabs[1].file)
          ];

          expect(app.state.tabs).to.eql(expectedOpen);
          expect(app.state.activeTab).to.eql(expectedOpen[1]);
        });
      });

    });


    describe('__internal__', function() {

      it('should reset state on all closed', async function() {

        // when
        await app.triggerAction('close-all-tabs');

        // then
        await waitFor(() => {
          expect(app.state.tabs).to.be.empty;
          expect(app.navigationHistory.get()).not.to.exist;
          expect(app.navigationHistory.elements).to.be.empty;
          expect(app.navigationHistory.idx).to.eql(-1);
        });
      });

    });

  });


  describe('recently closed tabs', function() {

    let app, openedTabs;

    beforeEach(async function() {

      app = createApp().app;

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


    it('keep history', async function() {

      // given
      const savedTab1 = openedTabs[1];
      const savedTab2 = openedTabs[2];

      // when
      await app.closeTab(savedTab1);
      await app.closeTab(savedTab2);

      // when
      await waitFor(() => {
        expect(app.state.recentTabs).to.eql([ savedTab1, savedTab2 ]);
      });
    });


    it('should NOT track unsaved files', async function() {

      // given
      const unsavedTab1 = openedTabs[0];

      // when
      await app.closeTab(unsavedTab1);

      // when
      const {
        recentTabs
      } = app.state;

      expect(recentTabs).to.eql([ ]);
    });


    it('reopen recent tab', async function() {

      // given
      const savedTab = openedTabs[2];
      const file = savedTab.file;

      await app.closeTab(savedTab);

      // when
      await app.triggerAction('reopen-file', savedTab);

      // then
      const {
        recentTabs,
        activeTab
      } = app.state;

      expect(activeTab.file).to.eql(file);
      expect(recentTabs).to.eql([ savedTab ]);
    });


    it('should focus already open tab', async function() {

      // given
      const savedTab = openedTabs[2];
      const file = savedTab.file;

      // when
      await app.triggerAction('reopen-file', savedTab);

      // then
      const {
        activeTab
      } = app.state;

      expect(activeTab.file).to.eql(file);
    });


    it('should reorder tabs on close', async function() {

      // given
      const savedTab1 = openedTabs[1];
      const savedTab2 = openedTabs[2];
      await app.closeTab(savedTab1);
      await app.closeTab(savedTab2);

      // assume
      await waitFor(() => {
        expect(app.state.recentTabs).to.eql([ savedTab1, savedTab2 ]);
      });

      // when
      await app.triggerAction('reopen-file', savedTab1);
      await app.closeTab(app.state.activeTab);

      // then
      await waitFor(() => {
        expect(app.state.recentTabs.map(tab => tab.file)).to.eql([ savedTab2.file, savedTab1.file ]);
      });
    });

  });


  describe('tab errors', function() {

    it('should propagate', async function() {

      // given
      const errorSpy = spy();

      const { app } = createApp({ onError: errorSpy });

      const tab = await app.createDiagram();

      const tabInstance = app.tabRef.current;

      const error = new Error('YZO!');

      // when
      tabInstance.triggerAction('error', error);

      // then
      expect(errorSpy).to.have.been.calledWith(error, tab);
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

        const { app } = createApp({ onError });

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

      const { app } = createApp({ onWarning: warningSpy });

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

  });


  describe('workspace integration', function() {

    describe('should notify #onWorkspaceChanged', function() {

      it('on layout change', async function() {

        // given
        const changedSpy = spy(() => {});

        const { app } = createApp({
          onWorkspaceChanged: changedSpy
        });

        // when
        app.setLayout({});

        // then
        await waitFor(() => {
          expect(changedSpy).to.have.been.calledOnce;
        });
      });


      it('on activeTab / tabs change', async function() {

        // given
        const changedSpy = spy(() => {});

        const { app } = createApp({
          onWorkspaceChanged: changedSpy
        });

        // when
        app.createDiagram('bpmn');

        // then
        await waitFor(() => {
          expect(changedSpy).to.have.been.called;
        });
      });


      it('on quit', async function() {

        // given
        const changedSpy = spy(() => {});

        const { app } = createApp({
          onWorkspaceChanged: changedSpy
        });

        // when
        await app.quit();

        // then
        await waitFor(() => {
          expect(changedSpy).to.have.been.calledOnce;
        });
      });

    });

  });


  describe('panel', function() {

    it('should render', async function() {

      // given
      const { app, findByText } = createApp();

      // when
      app.setLayout({
        panel: {
          open: true,
          tab: 'log'
        }
      });

      // then
      await findByText('Output');
      await findByText('Problems');
    });


    it('should open', async function() {

      // given
      const { app } = createApp();

      app.setLayout({});

      // when
      app.openPanel('log');

      // then
      await waitFor(() => {
        expect(app.state.layout).to.eql({
          panel: {
            open: true,
            tab: 'log'
          }
        });
      });
    });


    it('should close', async function() {

      // given
      const { app } = createApp();

      await waitFor(() => {
        app.setLayout({
          panel: {
            open: true,
            tab: 'log'
          }
        });
      });

      // when
      app.closePanel();

      // then
      await waitFor(() => {
        expect(app.state.layout).to.eql({
          panel: {
            open: false,
            tab: 'log'
          }
        });
      });
    });


    describe('#triggerAction', function() {

      it('should open', async function() {

        // given
        const { app } = createApp();

        app.setLayout({});

        // when
        app.triggerAction('open-panel', { tab: 'log' });

        // then
        await waitFor(() => {
          expect(app.state.layout).to.eql({
            panel: {
              open: true,
              tab: 'log'
            }
          });
        });
      });


      it('should close', async function() {

        // given
        const { app } = createApp();

        app.setLayout({
          panel: {
            open: true,
            tab: 'log'
          }
        });

        await waitFor(() => {
          expect(app.state.layout).to.eql({
            panel: {
              open: true,
              tab: 'log'
            }
          });
        });

        // when
        app.triggerAction('close-panel');

        // then
        await waitFor(() => {
          expect(app.state.layout).to.eql({
            panel: {
              open: false,
              tab: 'log'
            }
          });
        });
      });

    });


    describe('log', function() {

      describe('#triggerAction', function() {

        it('should open', async function() {

          // given
          const { app } = createApp();

          app.setLayout({});

          // when
          app.triggerAction('open-log');

          // then
          await waitFor(() => {
            expect(app.state.layout).to.eql({
              panel: {
                open: true,
                tab: 'log'
              }
            });
          });
        });

      });

    });


    describe('bottom-panel', function() {

      describe('#triggerAction', function() {

        it('should open', async function() {

          // given
          const { app } = createApp();

          await waitFor(() => {
            app.setLayout({
              panel: {
                open: false,
              }
            });
          });

          // when
          app.triggerAction('toggle-panel');

          // then
          await waitFor(() => {
            expect(app.state.layout).to.eql({
              panel: {
                open: true,
                tab: 'log'
              }
            });
          });
        });


        it('should close', async function() {

          // given
          const { app } = createApp();

          await waitFor(() => {
            app.setLayout({
              panel: {
                open: true,
              }
            });
          });

          // when
          app.triggerAction('toggle-panel');

          // then
          await waitFor(() => {
            expect(app.state.layout).to.eql({
              panel: {
                open: false
              }
            });
          });
        });


        it('should preserve state when reopened after being closed', async function() {

          // given
          const { app } = createApp();

          app.setLayout({
            panel: {
              open: true,
              tab: 'variable-outline'
            }
          });

          // when

          // close
          app.triggerAction('toggle-panel');

          // open
          app.triggerAction('toggle-panel');


          // then
          await waitFor(() => {
            expect(app.state.layout).to.eql({
              panel: {
                open: true,
                tab: 'variable-outline'
              }
            });
          });
        });

      });

    });

  });


  describe('notifications', function() {

    it('should display notification', async function() {

      // given
      const { app, getByText } = createApp();

      const notificationProps = { title: 'test-notification' };

      // when
      await app.triggerAction('display-notification', notificationProps);

      // then
      await waitFor(() => {
        expect(getByText('test-notification')).to.exist;
      });
    });


    it('should close notification', async function() {

      // given
      const {
        app,
        getByText,
        queryByText
      } = createApp();

      const notificationProps = { title: 'test-notification' };

      const { close } = await app.triggerAction('display-notification', notificationProps);

      await waitFor(() => {
        expect(getByText('test-notification')).to.exist;
      });

      // when
      close();

      // then
      await waitFor(() => {
        expect(queryByText('test-notification')).to.not.exist;
      });
    });


    it('should update notification', async function() {

      // given
      const {
        app,
        getByText,
        queryByText
      } = createApp();

      const newTitle = 'new Title';

      const notificationProps = { title: 'test' };

      const { update } = await app.triggerAction('display-notification', notificationProps);

      await waitFor(() => {
        expect(getByText('test')).to.exist;
      });

      // when
      update({ title: newTitle });

      // then
      await waitFor(() => {
        expect(getByText(newTitle)).to.exist;
      });

      expect(queryByText('test')).to.not.exist;
    });


    it('should NOT display notification without title', async function() {

      // given
      const { app, queryByText } = createApp();

      const notificationProps = { content: 'test-notification' };

      // when
      await app.triggerAction('display-notification', notificationProps);

      // then
      await waitFor(() => {
        expect(queryByText('test-notification')).to.not.exist;
      });
    });


    it('should NOT display notification of unknown type', async function() {

      // given
      const { app, queryByText } = createApp();

      const notificationProps = { type: 'unknown', title: 'test-notification' };

      // when
      await app.triggerAction('display-notification', notificationProps);

      // then
      await waitFor(() => {
        expect(queryByText('test-notification')).to.not.exist;
      });
    });


    it('should close all notifications when tab changes', async function() {

      // given
      const {
        app,
        findByText,
        queryByText
      } = createApp();

      const file = createFile('1.bpmn');

      // open several notifications
      await app.triggerAction('display-notification', { title: 'test-notification-1' });
      await findByText('test-notification-1');

      await app.triggerAction('display-notification', { title: 'test-notification-2' });
      await findByText('test-notification-2');

      await app.triggerAction('display-notification', { title: 'test-notification-3' });
      await findByText('test-notification-3');

      // when
      app.openFiles([ file ]);

      // then
      await waitFor(() => {
        expect(queryByText('test-notification')).to.not.exist;
      });
    });


    it('should close all notifications when sheet changes', async function() {

      // given
      const {
        app,
        findByText,
        queryByText
      } = createApp();

      // open several notifications
      await app.triggerAction('display-notification', { title: 'test-notification-1' });
      await findByText('test-notification-1');

      await app.triggerAction('display-notification', { title: 'test-notification-2' });
      await findByText('test-notification-2');

      await app.triggerAction('display-notification', { title: 'test-notification-3' });
      await findByText('test-notification-3');

      // when
      await app.triggerAction('emit-event', { type: 'tab.activeSheetChanged' });

      // then
      await waitFor(() => {
        expect(queryByText('test-notification')).to.not.exist;
      });
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
      createApp({ tabsProvider });

      // then
      expect(resolveTabSpy).to.have.been.calledOnce;
    });

  });


  describe('#checkFileChanged', function() {

    const NEW_FILE_CONTENTS = 'bar';

    let file1, file2, fileSystem, readFileSpy;

    beforeEach(function() {

      file1 = createFile('1.bpmn', {
        contents: 'foo',
        lastModified: 0
      });

      file2 = createFile('2.bpmn');

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
        return {
          button: 'ok'
        };
      });

      const dialog = new Dialog({
        show: showSpy
      });

      const { app } = createApp({
        globals: {
          dialog,
          fileSystem
        }
      });

      const openedTabs = await app.openFiles([ file1, file2 ]);

      const tab = openedTabs[0];

      const lastModified = new Date().getMilliseconds();

      updateFileStats(tab.file, { lastModified }, fileSystem);

      // when
      const updatedTab = await app.checkFileChanged(tab);

      // then
      expect(showSpy).to.have.been.called;
      expect(readFileSpy).to.have.been.called;

      await waitFor(() => {
        expect(updatedTab).to.eql(app.findOpenTab(file1));
      });

      expect(updatedTab.file.contents).to.eql(NEW_FILE_CONTENTS);

      // TODO(nikku): fix test suite and properly pass last modified
      // expect(updatedTab.file.lastModified).to.eql(lastModified);

      expect(app.isUnsaved(updatedTab)).to.be.false;
    });


    it('should NOT notify if content not changed', async function() {

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

      const openedTabs = await app.openFiles([ file1, file2 ]);

      const tab = openedTabs[0];

      updateFileStats(tab.file, {
        lastModified: 0
      }, fileSystem);

      // when
      const updatedTab = await app.checkFileChanged(tab);

      // then
      expect(showSpy).to.not.have.been.called;
      expect(readFileSpy).to.not.have.been.called;

      expect(app.isUnsaved(updatedTab)).to.be.false;

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

      const { app } = createApp({
        globals: {
          dialog,
          fileSystem
        }
      });

      const openedTabs = await app.openFiles([ file1, file2 ]);

      const tab = openedTabs[0];

      const lastModified = new Date().getMilliseconds();

      updateFileStats(tab.file, { lastModified }, fileSystem);

      const oldTabContents = tab.file.contents;

      // when
      const updatedTab = await app.checkFileChanged(tab);

      // then
      expect(showSpy).to.have.been.called;
      expect(readFileSpy).to.not.have.been.called;

      await waitFor(() => {
        expect(updatedTab).to.eql(app.findOpenTab(file1));
      });

      expect(updatedTab.file.contents).to.equal(oldTabContents);
      expect(updatedTab.file.lastModified).to.equal(lastModified);

      expect(app.isUnsaved(updatedTab)).to.be.true;
    });


    it('should execute only once', async function() {

      // given
      const { app } = createApp();

      const openedTabs = await app.openFiles([ file1 ]);

      const tab = openedTabs[0];

      const checkFileChangedSpy = spy(app, '__checkFileChanged');

      // when
      await Promise.all([ app.checkFileChanged(tab), app.checkFileChanged(tab) ]);

      // then
      expect(checkFileChangedSpy).to.have.been.calledOnce;
    });

  });


  it('tabbing history');


  describe('#updateTab', function() {
    let app,
        errorSpy,
        tab,
        tabs,
        queries;

    beforeEach(async function() {

      const render = createApp({
        onError: errorSpy
      });

      app = render.app;
      queries = render;

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


    it('should update with attributes getters', async function() {

      // given
      const tab = await app.createDiagram('form');

      // when
      const updatedTab = await app.updateTab(tab, {});

      updatedTab.file.name = 'newname.form';

      // then
      expect(updatedTab.name).to.eql(updatedTab.file.name);
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

      const { getByText } = queries;

      // when
      const updatedTab = await app.updateTab(tab, newAttrs);

      await waitFor(() => {
        expect(getByText('foo.bpmn')).to.exist;
      });

      const {
        activeTab,
        tabs
      } = app.state;

      // then
      expect(updatedTab).to.include(newAttrs);
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


    it('should emit <app.tabsChanged> event on tab updated', async function() {

      // given
      const eventSpy = sinon.spy();

      const newAttrs = {
        name: 'foo.bpmn'
      };

      app.on('app.tabsChanged', eventSpy);

      // when
      await app.updateTab(tab, newAttrs);

      // then
      await waitFor(() => {
        expect(eventSpy).to.have.been.calledOnce;
      });
    });

  });


  describe('#showOpenFilesDialog', function() {

    it('should deduplicate dialog filters by name', async function() {

      // given
      const dialog = new Dialog();

      dialog.setShowOpenFilesDialogResponse([]);

      const showOpenFilesDialogSpy = spy(dialog, 'showOpenFilesDialog');

      const tabsProvider = new TabsProvider();

      tabsProvider.providers = {
        bpmn: {
          name: 'BPMN',
          extensions: [ 'bpmn', 'xml' ]
        },
        bpmnDuplicate: {
          name: 'BPMN',
          extensions: [ 'bpmn', 'xml' ]
        },
        dmn: {
          name: 'DMN',
          extensions: [ 'dmn', 'xml' ]
        },
        dmnDuplicate: {
          name: 'DMN',
          extensions: [ 'dmn', 'xml', 'dmn13' ]
        },
        form: {
          name: 'Form',
          extensions: [ 'form' ]
        },
        formDuplicate: {
          name: 'Form',
          extensions: [ 'form' ]
        },
        rpa: {
          name: 'RPA',
          extensions: [ 'rpa' ]
        },
        test: {
          name: 'TEST',
          extensions: [ 'helloWorld' ]
        }
      };

      const { app } = createApp({
        globals: {
          dialog
        },
        tabsProvider
      });

      // when
      await app.showOpenFilesDialog();

      // then
      const {
        filters
      } = showOpenFilesDialogSpy.firstCall.args[0];

      expect(filters).to.eql([
        {
          name: 'All Supported',
          extensions: [ 'bpmn', 'dmn', 'dmn13', 'form', 'helloWorld', 'rpa', 'xml' ]
        },
        {
          name: 'BPMN',
          extensions: [ 'bpmn', 'xml' ]
        },
        {
          name: 'DMN',
          extensions: [ 'dmn', 'xml', 'dmn13' ]
        },
        {
          name: 'Form',
          extensions: [ 'form' ]
        },
        {
          name: 'RPA',
          extensions: [ 'rpa' ]
        },
        {
          name: 'TEST',
          extensions: [ 'helloWorld' ]
        },
        {
          name: 'All Files',
          extensions: [ '*' ]
        }
      ]);
    });


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

    it('should open modal', async function() {

      // given
      const {
        app
      } = createApp();

      // when
      app.openModal('KEYBOARD_SHORTCUTS');

      // then
      await waitFor(() => {
        expect(screen.getByRole('dialog')).to.exist;
        expect(screen.getByText('Keyboard Shortcuts')).to.exist;
      });
    });


    it('should close modal', async function() {

      // given
      const {
        app
      } = createApp();

      app.openModal('KEYBOARD_SHORTCUTS');

      // assume
      await waitFor(() => {
        expect(screen.getByRole('dialog')).to.exist;
      });

      // when
      app.closeModal();

      // then
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).to.not.exist;
      });
    });


    it('should update menu when modal is closed', function() {

      // given
      const {
        app
      } = createApp();

      const updateMenuSpy = sinon.spy(app, 'updateMenu');
      app.setState({ currentModal: 'fakeModalName' });

      // when
      app.closeModal();

      // then
      expect(updateMenuSpy).to.be.calledOnce;
    });

  });


  describe('#getConfig', function() {

    afterEach(sinon.restore);


    it('should get config', async function() {

      // given
      const getConfigSpy = spy();

      const config = new Config({
        get: getConfigSpy
      });

      const { app } = createApp({
        globals: {
          config
        }
      });

      // ignore calls from App rendering
      getConfigSpy.resetHistory();

      // when
      app.getConfig('foo');

      // then
      expect(getConfigSpy).to.be.calledOnceWith('foo');
    });

  });


  describe('#setConfig', function() {

    afterEach(sinon.restore);


    it('should set config', async function() {

      // given
      const setConfigSpy = spy();

      const config = new Config({
        set: setConfigSpy
      });

      const { app } = createApp({
        globals: {
          config
        }
      });

      // when
      app.setConfig('foo');

      // then
      expect(setConfigSpy).to.be.calledOnceWith('foo');
    });

  });


  describe('#migrateConfigForFile', function() {

    afterEach(sinon.restore);


    it('should copy config from old path to new path', async function() {

      // given
      const getForFileStub = sinon.stub().resolves({ 'connection-manager': { connectionId: '123' } });
      const setForFileStub = sinon.stub().resolves();

      const config = new Config({
        getForFile: getForFileStub,
        setForFile: setForFileStub,
      });

      const { app } = createApp({
        globals: {
          config
        }
      });

      // when
      await app.migrateConfigForFile({ path: 'old.bpmn' }, { path: 'new.bpmn' });

      // then
      expect(setForFileStub).to.be.calledOnceWith(
        { path: 'new.bpmn' },
        undefined,
        { 'connection-manager': { connectionId: '123' } }
      );
    });


    it('should not set config if old file has no config', async function() {

      // given
      const getForFileStub = sinon.stub().resolves(undefined);
      const setForFileStub = sinon.stub().resolves();

      const config = new Config({
        getForFile: getForFileStub,
        setForFile: setForFileStub,
      });

      const { app } = createApp({
        globals: {
          config
        }
      });

      // when
      await app.migrateConfigForFile({ path: 'old.bpmn' }, { path: 'new.bpmn' });

      // then
      expect(setForFileStub).to.not.have.been.called;
    });
  });


  describe('#loadPlugins', function() {

    it('should load plugins', function() {

      // given
      const { app } = createApp({
        globals: {
          plugins: {
            get(type) {
              return [ {
                __init__: [ type ],
                [ type ]: [ 'type', noop ]
              } ];
            }
          }
        }
      });

      // when
      const plugins = app.getPlugins('foo');

      // then
      expect(plugins).to.eql([ {
        __init__: [ 'foo' ],
        foo: [ 'type', noop ]
      } ]);
    });
  });


  describe('resize', function() {

    afterEach(sinon.restore);


    it('should trigger tab resize when layout changes', async function() {

      // given
      const { app } = createApp();

      const resizeTabStub = sinon.stub(app, 'resizeTab').resolves();

      // when
      app.setLayout({
        log: {
          open: true,
          height: 100
        }
      });

      // then
      await waitFor(() => {
        expect(resizeTabStub).to.have.been.calledOnce;
      });
    });

  });


  describe('dirty state', function() {

    it('should NOT be dirty after creating a diagram', async function() {

      // given
      const { app } = createApp({
        dialog: new Dialog()
      });

      // when
      const tab = await app.createDiagram();

      // then
      expect(app.isDirty(tab)).to.be.false;
    });


    it('should NOT be dirty after opening an existing diagram', async function() {

      // given
      const { app } = createApp({
        dialog: new Dialog()
      });

      const file = createFile('diagram_1.bpmn');

      // when
      const tabs = await app.openFiles([ file ]);

      // then
      expect(app.isDirty(tabs[0])).to.be.false;
    });


    it('should NOT be dirty after saving a diagram', async function() {

      // given
      const dialog = new Dialog();
      const { app } = createApp({
        dialog: dialog
      });

      const tab = await app.createDiagram();

      dialog.setShowSaveFileDialogResponse('diagram_1.bpmn');

      // when
      await app.triggerAction('save');

      // then
      expect(app.isDirty(tab)).to.be.false;
    });

  });


  describe('#handleDrop', function() {

    it('should try to open each dropped file', async function() {

      // given
      const directoryReadError = new Error();
      directoryReadError.code = 'EISDIR';

      const files = [
        '/dev/null/',
        './CamundaModeler',
        './diagram.bpmn'
      ];

      const fileSystem = new FileSystem();

      const readFileStub = sinon.stub(fileSystem, 'readFile')
        .onFirstCall().rejects(directoryReadError)
        .onSecondCall().rejects(directoryReadError)
        .onThirdCall().resolves({ contents: '' });

      const { app } = createApp({
        globals: {
          fileSystem
        }
      });

      // when
      await app.handleDrop(files);

      // then
      expect(readFileStub).to.be.calledThrice;

    });

  });


  describe('#emitWithTab', function() {

    it('should emit event with tab', function() {

      // given
      const { app } = createApp();

      const {
        activeTab
      } = app.state;

      const payload = { foo: 'bar' };

      const eventSpy = sinon.spy((event) => {

        const {
          foo,
          tab
        } = event;

        expect(foo).to.equal('bar');
        expect(tab).to.eql(activeTab);
      });

      app.on('foo', eventSpy);

      // when
      app.emitWithTab('foo', activeTab, payload);

      // then
      expect(eventSpy).to.have.been.called;
    });

  });


  describe('dialogs', function() {

    describe('#getOpenFileErrorDialog', function() {

      it('should list all supported file endings', function() {

        // given
        const options = {
          name: 'file.ext',
          providerNames: [ 'BPMN', 'DMN', 'FORM' ]
        };

        // when
        const { message, detail } = getOpenFileErrorDialog(options);

        // then
        expect(message).to.equal('Unable to open file.');
        expect(detail).to.equal('"file.ext" is not a BPMN, DMN or FORM file.');
      });


      it('should use correct separator for 2 providers', function() {

        // given
        const options = {
          name: 'file.ext',
          providerNames: [ 'BPMN', 'DMN' ]
        };

        // when
        const { detail } = getOpenFileErrorDialog(options);

        // then
        expect(detail).to.equal('"file.ext" is not a BPMN or DMN file.');
      });


      it('should not use any separators for single providers', function() {

        // given
        const options = {
          name: 'file.ext',
          providerNames: [ 'BPMN' ]
        };

        // when
        const { detail } = getOpenFileErrorDialog(options);

        // then
        expect(detail).to.equal('"file.ext" is not a BPMN file.');
      });
    });

  });


  describe('#revealInFileExplorer', function() {

    it('should call dialog#showFileExplorerDialog', async function() {

      // given
      const dialog = new Dialog();

      const showFileExplorerDialogSpy = sinon.spy(dialog, 'showFileExplorerDialog');

      const { app } = createApp({
        globals: {
          dialog
        }
      });

      const [ tab ] = await app.openFiles([ createFile('1.bpmn') ]);

      // when
      app.revealInFileExplorer(tab.file.path);

      // then
      expect(showFileExplorerDialogSpy).to.have.been.calledOnce;
    });

  });


  describe('linting', function() {

    it('should lint tab (no errors)', async function() {

      // given
      const { app } = createApp();

      const openedTabs = await app.openFiles([
        createFile('1.form', {
          contents: 'foo'
        })
      ]);

      const currentTab = openedTabs[ 0 ];

      // when
      await app.lintTab(currentTab);

      // then
      const lintingState = app.getLintingState(currentTab);

      await waitFor(() => {
        expect(lintingState).to.exist;
      });

      expect(lintingState).to.be.empty;
    });


    it('should lint tab (errors)', async function() {

      // given
      const { app } = createApp();

      const openedTabs = await app.openFiles([
        createFile('1.form', {
          contents: 'linting-errors'
        })
      ]);

      const currentTab = openedTabs[ 0 ];

      // when
      await app.lintTab(currentTab);

      // then
      await waitFor(() => {
        expect(app.getLintingState(currentTab)).to.have.length(1);
      });
    });


    it('should lint tab (custom contents)', async function() {

      // given
      const contents = JSON.stringify({
        components: [],
        executionPlatform: 'Camunda Platform',
        executionPlatformVersion: '7.15',
        id: 'Form_1',
        type: 'default'
      });

      const { app } = createApp();

      const openedTabs = await app.openFiles([
        createFile('1.form', {
          contents
        })
      ]);

      const currentTab = openedTabs[ 0 ];


      // when
      await app.lintTab(currentTab, 'linting-errors');

      // then
      await waitFor(() => {
        expect(app.getLintingState(currentTab)).to.have.length(1);
      });
    });


    it('should not lint tab (no linter)', async function() {

      // given
      const { app } = createApp();

      const openedTabs = await app.openFiles([
        createFile('1.dmn')
      ]);

      const currentTab = openedTabs[ 0 ];

      // when
      await app.lintTab(currentTab);

      // then
      await waitFor(() => {
        const lintingState = app.getLintingState(currentTab);

        expect(lintingState).to.be.empty;
      });
    });


    it('should lint tab through #triggerAction', async function() {

      // given
      const { app } = createApp();

      const openedTabs = await app.openFiles([
        createFile('1.form', {
          contents: 'foo'
        })
      ]);

      const currentTab = openedTabs[ 0 ];

      // when
      await app.triggerAction('lint-tab', { tab: currentTab });

      // then
      const lintingState = app.getLintingState(currentTab);

      expect(lintingState).to.exist;
      expect(lintingState).to.be.empty;
    });


    it('should lint tab after save', async function() {

      // given
      const { app } = createApp();

      await app.openFiles([
        createFile('1.form', {
          contents: 'linting-errors'
        })
      ]);

      const triggerActionSpy = sinon.spy(app, 'triggerAction');

      // when
      await app.triggerAction('save');

      // then
      expect(triggerActionSpy).to.have.been.calledWith('lint-tab');
    });


    it('should pass plugins to linter', async function() {

      // given
      const tabsProvider = new TabsProvider();

      const getLinterSpy = sinon.spy(tabsProvider.getProvider('cloud-bpmn'), 'getLinter');

      const { app } = createApp({
        globals: {
          plugins: {
            get(type) {
              if (type === 'lintRules.cloud-bpmn') {
                return [ 'FooPlugin', 'BarPlugin', 'BazPlugin' ];
              }

              return [];
            }
          }
        },
        tabsProvider
      });

      await app.createDiagram('cloud-bpmn');

      const { activeTab } = app.state;

      // when
      await app.lintTab(activeTab);

      // then
      expect(getLinterSpy).to.have.been.calledOnce;
      expect(getLinterSpy).to.have.been.calledWith([ 'FooPlugin', 'BarPlugin', 'BazPlugin' ]);
    });


    it('should return empty linting state', async function() {

      // given
      const { app } = createApp();

      // then
      const lintingState = app.getLintingState(EMPTY_TAB);

      expect(lintingState).to.be.empty;
    });

  });


  describe('reload', function() {

    describe('no unsaved changed', function() {

      it('should not show dialog', async function() {

        // given
        const dialog = new Dialog();

        const { app } = createApp({
          globals: {
            dialog
          }
        });

        const reload = spy(app, 'reload');
        const showReloadDialog = spy(dialog, 'showReloadDialog');

        // when
        dialog.setShowReloadModelerDialogResponse({ button: 'reload' });
        app.reloadModeler();

        // then
        expect(reload).to.have.been.called;
        expect(showReloadDialog).to.not.have.been.called;
      });

    });


    describe('unsaved changes', function() {

      it('should sve changes and reload app', async function() {

        // given
        const dialog = new Dialog();

        const { app } = createApp({
          globals: {
            dialog
          }
        });

        sinon.stub(app, 'hasUnsavedTabs').returns(true);

        const reload = spy(app, 'reload');
        const showReloadDialog = spy(dialog, 'showReloadDialog');
        const save = spy(app, 'saveAllTabs');

        // when
        dialog.setShowReloadModelerDialogResponse({ button: 'save' });
        await app.reloadModeler();

        // then
        expect(showReloadDialog).to.have.been.called;
        expect(save).to.have.been.called;
        expect(reload).to.have.been.called;
      });

      it('should reload app without saving', async function() {

        // given
        const dialog = new Dialog();

        const { app } = createApp({
          globals: {
            dialog
          }
        });

        sinon.stub(app, 'hasUnsavedTabs').returns(true);

        const reload = spy(app, 'reload');
        const showReloadDialog = spy(dialog, 'showReloadDialog');

        // when
        dialog.setShowReloadModelerDialogResponse({ button: 'reload' });
        await app.reloadModeler();

        // then
        expect(showReloadDialog).to.have.been.called;
        expect(reload).to.have.been.called;
      });


      it('should NOT reload app', async function() {

        // given
        const dialog = new Dialog();

        const { app } = createApp({
          globals: {
            dialog
          }
        });

        sinon.stub(app, 'hasUnsavedTabs').returns(true);

        const reload = spy(app, 'reload');
        const showReloadDialog = spy(dialog, 'showReloadDialog');

        // when
        dialog.setShowReloadModelerDialogResponse({ button: 'cancel' });
        app.reloadModeler();

        // then
        expect(showReloadDialog).to.have.been.called;
        expect(reload).to.not.have.been.called;
      });

    });
  });

});


// helpers //////////

/**
 * Render the App with options and get a ref to its instance.
 *
 * @param {Object} options
 * @returns {App}
 */
function createApp(options = {}) {

  const flags = options.flags || {
    [ DISABLE_REMOTE_INTERACTION ]: true
  };

  Flags.init(flags);

  const defaultGlobals = {
    backend: new Backend(),
    config: new Config(),
    deployment: new Deployment(),
    dialog: new Dialog(),
    fileSystem: new FileSystem(),
    plugins: new Plugins(),
    settings: new Settings(),
    startInstance: new StartInstance(),
    systemClipboard: new SystemClipboard(),
    tabStorage: new TabStorage(),
    workspace: new Workspace(),
    zeebeAPI: new ZeebeAPI()
  };

  const globals = {
    ...defaultGlobals,
    ...(options.globals || {})
  };

  const cache = options.cache || new Cache();
  const tabsProvider = options.tabsProvider || new TabsProvider();
  const onTabChanged = options.onTabChanged || noop;
  const onWorkspaceChanged = options.onWorkspaceChanged;
  const onTabShown = options.onTabShown || noop;
  const onMenuUpdate = options.onMenuUpdate || noop;
  const onReady = options.onReady || noop;
  const onError = options.onError || noop;
  const onWarning = options.onWarning || noop;

  const appRef = createRef();

  let rendered;
  rendered = render(
    <App
      ref={ appRef }
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

  return {
    app: appRef.current,
    ...rendered
  };
}


function createFile(name, options = {}) {
  const {
    contents = 'foo',
    lastModified,
    path = name
  } = options;

  return {
    contents,
    lastModified,
    name,
    path
  };
}

function updateFileStats(file, newAttrs, fileSystem) {

  const newFileStats = {
    ...file,
    ...newAttrs
  };

  fileSystem.setReadFileStatsResponse(newFileStats);

}


/**
 * @return {Promise<any>} promise for the timeout
 */
function waitSaved() {

  return new Promise((resolve) => {
    setTimeout(resolve, 300);
  });
}

/**
 * Set state and wait for the update to be committed.
 * Required for React 18 where setState is batched asynchronously.
 *
 * @param {Object} component - React component instance
 * @param {Object} newState - state to set
 * @return {Promise<void>}
 */
function setStateSync(component, newState) {
  return new Promise((resolve) => {
    component.setState(newState, resolve);
  });
}
