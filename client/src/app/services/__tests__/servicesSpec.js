/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import wireServices from '../wireServices';
import createDefaultServices from '../createDefaultServices';
import ActionRegistry from '../ActionRegistry';


describe('services', function() {


  describe('wireServices', function() {

    function createEventEmitter() {
      const listeners = {};

      return {
        on(event, handler) {
          listeners[event] = listeners[event] || [];
          listeners[event].push(handler);
        },
        off(event, handler) {
          listeners[event] = (listeners[event] || []).filter(h => h !== handler);
        },
        emit(event, ...args) {
          (listeners[event] || []).forEach(h => h(...args));
        },
        listeners
      };
    }


    it('should register layout actions', function() {

      // given
      const actionRegistry = new ActionRegistry();
      const openPanelSpy = sinon.spy();
      const closePanelSpy = sinon.spy();

      const services = {
        layout: { openPanel: openPanelSpy, closePanel: closePanelSpy }
      };

      // when
      wireServices({
        services,
        actionRegistry,
        eventEmitter: createEventEmitter()
      });

      actionRegistry.dispatch('open-log');
      actionRegistry.dispatch('open-panel', { tab: 'linting' });
      actionRegistry.dispatch('close-panel');

      // then
      expect(openPanelSpy).to.have.been.calledWith('log');
      expect(openPanelSpy).to.have.been.calledWith('linting');
      expect(closePanelSpy).to.have.been.called;
    });


    it('should register notification actions', function() {

      // given
      const actionRegistry = new ActionRegistry();
      const logEntrySpy = sinon.spy();
      const displayNotificationSpy = sinon.spy();

      const services = {
        notification: {
          logEntry: logEntrySpy,
          displayNotification: displayNotificationSpy
        }
      };

      // when
      wireServices({
        services,
        actionRegistry,
        eventEmitter: createEventEmitter()
      });

      actionRegistry.dispatch('log', {
        message: 'hello', category: 'test', action: null, silent: false
      });
      actionRegistry.dispatch('display-notification', { title: 'Test' });

      // then
      expect(logEntrySpy).to.have.been.calledWith('hello', 'test', null, false);
      expect(displayNotificationSpy).to.have.been.calledWith({ title: 'Test' });
    });


    it('should register linting actions and events', function() {

      // given
      const actionRegistry = new ActionRegistry();
      const emitter = createEventEmitter();
      const lintTabSpy = sinon.spy();
      const statusChangedSpy = sinon.spy();
      const checkStartedSpy = sinon.spy();
      const profileChangedSpy = sinon.spy();

      const services = {
        linting: {
          lintTab: lintTabSpy,
          handleConnectionStatusChanged: statusChangedSpy,
          handleConnectionCheckStarted: checkStartedSpy,
          handleEngineProfileChanged: profileChangedSpy
        }
      };

      // when
      wireServices({
        services,
        actionRegistry,
        eventEmitter: emitter
      });

      actionRegistry.dispatch('lint-tab', { tab: { id: '1' }, contents: 'xml' });
      emitter.emit('connectionManager.connectionStatusChanged', { success: true });
      emitter.emit('connectionManager.connectionCheckStarted');
      emitter.emit('tab.engineProfileChanged', { tab: { id: '1' } });

      // then
      expect(lintTabSpy).to.have.been.calledWith({ id: '1' }, 'xml');
      expect(statusChangedSpy).to.have.been.calledWith({ success: true });
      expect(checkStartedSpy).to.have.been.called;
      expect(profileChangedSpy).to.have.been.calledWith({ tab: { id: '1' } });
    });


    it('should return destroy function that removes subscriptions', function() {

      // given
      const actionRegistry = new ActionRegistry();
      const emitter = createEventEmitter();
      const statusChangedSpy = sinon.spy();

      const services = {
        linting: {
          lintTab: sinon.spy(),
          handleConnectionStatusChanged: statusChangedSpy,
          handleConnectionCheckStarted: sinon.spy(),
          handleEngineProfileChanged: sinon.spy()
        }
      };

      const destroy = wireServices({
        services,
        actionRegistry,
        eventEmitter: emitter
      });

      // when
      destroy();

      emitter.emit('connectionManager.connectionStatusChanged', 'payload');

      // then
      expect(statusChangedSpy).not.to.have.been.called;
    });


    it('should handle partial services gracefully', function() {

      // given
      const actionRegistry = new ActionRegistry();

      // when — only layout provided, no notification or linting
      wireServices({
        services: {
          layout: { openPanel: sinon.spy(), closePanel: sinon.spy() }
        },
        actionRegistry,
        eventEmitter: createEventEmitter()
      });

      // then — layout actions registered, others not
      expect(actionRegistry.has('open-panel')).to.be.true;
      expect(actionRegistry.has('log')).to.be.false;
      expect(actionRegistry.has('lint-tab')).to.be.false;
    });

  });


  describe('createDefaultServices', function() {

    it('should create layout, notification and linting services', function() {

      // given
      const deps = {
        setState: sinon.spy(),
        getState: () => ({ layout: {} }),
        tabsProvider: { getProvider: () => ({ getLinter: () => null }) },
        getPlugins: () => [],
        getConfig: () => ({})
      };

      // when
      const services = createDefaultServices(deps);

      // then
      expect(services.layout).to.exist;
      expect(services.notification).to.exist;
      expect(services.linting).to.exist;
    });


    it('should wire notification to layout.openPanel', function() {

      // given
      const state = { layout: {}, notifications: [], logEntries: [] };

      const deps = {
        setState: (updater) => {
          const patch = typeof updater === 'function' ? updater(state) : updater;
          Object.assign(state, patch);
        },
        getState: () => state,
        tabsProvider: { getProvider: () => ({ getLinter: () => null }) },
        getPlugins: () => [],
        getConfig: () => ({})
      };

      const services = createDefaultServices(deps);

      const openPanelSpy = sinon.spy(services.layout, 'openPanel');

      // when
      services.notification.logEntry('test message', 'info');

      // then — notification called layout.openPanel
      expect(openPanelSpy).to.have.been.calledWith('log');
    });

  });

});
