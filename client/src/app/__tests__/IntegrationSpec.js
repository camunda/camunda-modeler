/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';

import { App } from '../App';

import {
  Backend,
  Cache,
  Config,
  Dialog,
  FileSystem,
  Plugins,
  Workspace
} from './mocks';

import {
  findRenderedComponentWithType,
  renderIntoDocument
} from 'react-dom/test-utils';

import { TabsProvider } from '../';

import { BpmnEditor } from '../tabs/bpmn/BpmnEditor';

import { MultiSheetTab } from '../tabs/MultiSheetTab';

/* global sinon */


describe('Integration', function() {

  describe('reimport', function() {

    let app, file2, tab1, tab2;

    beforeEach(async function() {
      app = createApp();

      const file1 = createFile('1.bpmn');

      file2 = createFile('2.bpmn');

      const openedTabs = await app.openFiles([
        file1,
        file2
      ]);

      tab1 = openedTabs[0];
      tab2 = openedTabs[1];
    });


    it('should reimport on externally changed file', async function() {

      // given
      const multiSheetTab = findRenderedComponentWithType(app, MultiSheetTab);

      await ensureLastXML(multiSheetTab);

      // when
      await app.updateTab(tab2, {
        file: {
          ...file2,
          contents: 'bar'
        }
      });

      // then
      const modeler = findRenderedComponentWithType(app, BpmnEditor).getModeler();

      expect(modeler.xml).to.eql('bar');
    });


    it('should NOT reimport on tab selection with unsaved changes', async function() {

      // given
      const multiSheetTab = findRenderedComponentWithType(app, MultiSheetTab);

      const modeler = findRenderedComponentWithType(app, BpmnEditor).getModeler();

      const unsavedXML = ensureUnsavedChanges(modeler);

      await ensureLastXML(multiSheetTab);

      await app.selectTab(tab1);

      expect(app.state.activeTab).to.equal(tab1);

      // when
      await app.selectTab(tab2);

      // then
      expect(app.state.activeTab).to.equal(tab2);

      expect(modeler.xml).to.eql(unsavedXML);
    });

  });


  describe('modals', function() {
    const modalRoot = document.createElement('div');
    modalRoot.id = 'modal-root';


    beforeEach(() => {
      document.body.appendChild(modalRoot);
    });


    afterEach(() => {
      document.body.removeChild(modalRoot);
    });


    it('should show shortcuts modals', async function() {

      // given
      const onError = sinon.spy();

      const app = createApp({ onError });

      // when
      await app.showShortcuts();

      // then
      expect(onError).not.to.have.been.called;
    });

  });

});


// helpers /////////////

function noop() {}

function createApp(options = {}) {
  const cache = options.cache || new Cache();

  let globals = {
    backend: new Backend(),
    config: new Config(),
    dialog: new Dialog(),
    fileSystem: new FileSystem(),
    plugins: new Plugins(),
    workspace: new Workspace()
  };

  if (options.globals) {
    globals = {
      ...globals,
      ...options.globals
    };
  }

  const onError = options.onError || noop,
        onMenuUpdate = options.onMenuUpdate || noop,
        onReady = options.onReady || noop,
        onTabChanged = options.onTabChanged || noop,
        onTabShown = options.onTabShown || noop,
        onWarning = options.onWarning || noop,
        onWorkspaceChanged = options.onWorkspaceChanged || noop;

  const tabsProvider = new TabsProvider();

  return renderIntoDocument(
    <App
      cache={ cache }
      globals={ globals }
      onError={ onError }
      onMenuUpdate={ onMenuUpdate }
      onReady={ onReady }
      onTabChanged={ onTabChanged }
      onTabShown={ onTabShown }
      onWarning={ onWarning }
      onWorkspaceChanged={ onWorkspaceChanged }
      tabsProvider={ tabsProvider }
    />
  );
}


function createFile(name, path, contents = 'foo', lastModified) {

  if (!path) {
    path = name;
  }

  return {
    contents,
    name,
    path,
    lastModified
  };
}

/**
 * Ensure a given modeler is dirty.
 *
 * @param {Object} modeler - Modeler mock.
 *
 * @returns {string}
 */
function ensureUnsavedChanges(modeler) {
  const commandStack = modeler.get('commandStack');

  const unsavedXML = 'bar';

  modeler.xml = unsavedXML;

  commandStack.execute(1);

  return unsavedXML;
}

/**
 * Ensure lastXML by switching back and forth between sheets.
 *
 * @param {Object} multiSheetTab - MultiSheetTab.
 */
async function ensureLastXML(multiSheetTab) {
  const sheets = multiSheetTab.getCached().sheets;

  await multiSheetTab.switchSheet(sheets[ 1 ]);

  expect(multiSheetTab.getCached().activeSheet.type).to.eql('xml');

  await multiSheetTab.switchSheet(sheets[ 0 ]);

  expect(multiSheetTab.getCached().activeSheet.type).to.eql('bpmn');
}