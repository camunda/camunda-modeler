/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { expect } from 'chai';
import sinon from 'sinon';

import getActionRegistry from '../getActionRegistry';


describe('getActionRegistry', function() {

  function createApp(overrides = {}) {
    const activeTab = { id: 'tab-1' };

    return {
      state: {
        activeTab,
        layout: { panel: { open: false, tab: 'log' } }
      },
      setTabGroup: sinon.spy(),
      lintTab: sinon.spy(),
      navigate: sinon.spy(),
      createDiagram: sinon.spy(),
      openFiles: sinon.spy(),
      readFileFromPath: sinon.stub().resolves({}),
      showOpenFilesDialog: sinon.spy(),
      saveAllTabs: sinon.spy(),
      saveTab: sinon.spy(),
      emit: sinon.spy(),
      emitWithTab: sinon.spy(),
      quit: sinon.spy(),
      closeTabs: sinon.spy(),
      reopenLastTab: sinon.spy(),
      revealInFileExplorer: sinon.spy(),
      showShortcuts: sinon.spy(),
      updateMenu: sinon.spy(),
      exportAs: sinon.spy(),
      showDialog: sinon.spy(),
      setModal: sinon.spy(),
      openExternalUrl: sinon.spy(),
      checkFileChanged: sinon.spy(),
      resizeTab: sinon.spy(),
      reloadModeler: sinon.spy(),
      logEntry: sinon.spy(),
      openPanel: sinon.spy(),
      closePanel: sinon.spy(),
      displayNotification: sinon.spy(),
      ...overrides
    };
  }

  it('should return a Map of handlers', function() {

    // when
    const registry = getActionRegistry(createApp());

    // then
    expect(registry).to.be.an.instanceof(Map);
    expect(registry.size).to.be.greaterThan(0);
  });


  it('should route <save> to the active tab', function() {

    // given
    const app = createApp();
    const registry = getActionRegistry(app);

    // when
    registry.get('save')();

    // then
    expect(app.saveTab).to.have.been.calledWith(app.state.activeTab);
  });


  it('should route <save-as> with saveAs option', function() {

    // given
    const app = createApp();
    const registry = getActionRegistry(app);

    // when
    registry.get('save-as')();

    // then
    expect(app.saveTab).to.have.been.calledWith(app.state.activeTab, { saveAs: true });
  });


  it('should read active tab lazily at dispatch time', function() {

    // given
    const app = createApp();
    const registry = getActionRegistry(app);

    const newTab = { id: 'tab-2' };
    app.state.activeTab = newTab;

    // when
    registry.get('save')();

    // then
    expect(app.saveTab).to.have.been.calledWith(newTab);
  });


  it('should route <create-bpmn-diagram> to createDiagram', function() {

    // given
    const app = createApp();
    const registry = getActionRegistry(app);

    // when
    registry.get('create-bpmn-diagram')();

    // then
    expect(app.createDiagram).to.have.been.calledWith('bpmn');
  });


  it('should navigate next/previous on <select-tab>', function() {

    // given
    const app = createApp();
    const registry = getActionRegistry(app);

    // when
    registry.get('select-tab')('next');
    registry.get('select-tab')('previous');

    // then
    expect(app.navigate).to.have.been.calledWith(1);
    expect(app.navigate).to.have.been.calledWith(-1);
  });


  it('should toggle the panel based on layout state', function() {

    // given
    const app = createApp();
    app.state.layout.panel.open = true;

    const registry = getActionRegistry(app);

    // when
    registry.get('toggle-panel')();

    // then
    expect(app.closePanel).to.have.been.called;
  });
});
