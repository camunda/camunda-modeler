/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import LayoutService from '../LayoutService';
import ActionRegistry from '../ActionRegistry';


describe('LayoutService', function() {

  function createLayoutService(initialState = {}) {
    const state = { layout: {}, ...initialState };

    return {
      service: new LayoutService({
        setState: (updater) => {
          const patch = typeof updater === 'function' ? updater(state) : updater;
          Object.assign(state, patch);
        },
        getState: () => state
      }),
      state
    };
  }


  describe('#handleLayoutChanged', function() {

    it('should merge layout', function() {

      // given
      const { service, state } = createLayoutService({
        layout: { panel: { open: false } }
      });

      // when
      service.handleLayoutChanged({ panel: { open: true } });

      // then
      expect(state.layout.panel.open).to.be.true;
    });

  });


  describe('#setLayout', function() {

    it('should replace layout', function() {

      // given
      const { service, state } = createLayoutService({
        layout: { panel: { open: true } }
      });

      // when
      service.setLayout({ sidePanel: { open: true } });

      // then
      expect(state.layout).to.eql({ sidePanel: { open: true } });
    });

  });


  describe('#openPanel', function() {

    it('should open panel with default tab', function() {

      // given
      const { service, state } = createLayoutService();

      // when
      service.openPanel();

      // then
      expect(state.layout.panel.open).to.be.true;
      expect(state.layout.panel.tab).to.equal('log');
    });


    it('should open panel with specified tab', function() {

      // given
      const { service, state } = createLayoutService();

      // when
      service.openPanel('linting');

      // then
      expect(state.layout.panel.tab).to.equal('linting');
    });

  });


  describe('#closePanel', function() {

    it('should close panel', function() {

      // given
      const { service, state } = createLayoutService({
        layout: { panel: { open: true, tab: 'log' } }
      });

      // when
      service.closePanel();

      // then
      expect(state.layout.panel.open).to.be.false;
    });

  });


  describe('#openSidePanel', function() {

    it('should open side panel with default tab', function() {

      // given
      const { service, state } = createLayoutService();

      // when
      service.openSidePanel();

      // then
      expect(state.layout.sidePanel.open).to.be.true;
      expect(state.layout.sidePanel.tab).to.equal('properties');
    });

  });


  describe('#closeSidePanel', function() {

    it('should close side panel', function() {

      // given
      const { service, state } = createLayoutService({
        layout: { sidePanel: { open: true, tab: 'properties' } }
      });

      // when
      service.closeSidePanel();

      // then
      expect(state.layout.sidePanel.open).to.be.false;
    });

  });


  describe('#registerActions', function() {

    it('should register open-log action', function() {

      // given
      const { service } = createLayoutService();
      const actionRegistry = new ActionRegistry();

      // when
      service.registerActions(actionRegistry);
      actionRegistry.dispatch('open-log');

      // then
      expect(actionRegistry.has('open-log')).to.be.true;
    });


    it('should register open-panel action', function() {

      // given
      const { service } = createLayoutService();
      const actionRegistry = new ActionRegistry();
      const openPanelSpy = sinon.spy(service, 'openPanel');

      // when
      service.registerActions(actionRegistry);
      actionRegistry.dispatch('open-panel', { tab: 'linting' });

      // then
      expect(openPanelSpy).to.have.been.calledWith('linting');
    });


    it('should register close-panel action', function() {

      // given
      const { service } = createLayoutService({
        layout: { panel: { open: true, tab: 'log' } }
      });
      const actionRegistry = new ActionRegistry();
      const closePanelSpy = sinon.spy(service, 'closePanel');

      // when
      service.registerActions(actionRegistry);
      actionRegistry.dispatch('close-panel');

      // then
      expect(closePanelSpy).to.have.been.called;
    });

  });

});
