/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import LintingService from '../LintingService';


describe('LintingService', function() {

  function createLintingService(options = {}) {
    const state = {
      tabs: [],
      activeTab: { id: '__empty' },
      lintingState: {},
      connectionCheckResult: null,
      engineProfiles: {},
      ...options.initialState
    };

    let stateCallback = null;

    const tabsProvider = options.tabsProvider || {
      getProvider: () => ({
        getLinter: () => null
      })
    };

    const service = new LintingService({
      setState: (updater, callback) => {
        const patch = typeof updater === 'function' ? updater(state) : updater;
        Object.assign(state, patch);
        if (callback) {
          stateCallback = callback;
        }
      },
      getState: () => state,
      tabsProvider,
      getPlugins: options.getPlugins || (() => []),
      getConfig: options.getConfig || (() => ({}))
    });

    return {
      service,
      state,
      flushCallback: () => {
        if (stateCallback) {
          stateCallback();
          stateCallback = null;
        }
      }
    };
  }


  describe('#getLintingState', function() {

    it('should return empty array for unknown tab', function() {

      // given
      const { service } = createLintingService();

      // when
      const result = service.getLintingState({ id: 'unknown' });

      // then
      expect(result).to.eql([]);
    });


    it('should return stored linting state', function() {

      // given
      const results = [ { id: 'issue-1' } ];
      const { service } = createLintingService({
        initialState: {
          lintingState: { 'tab-1': results }
        }
      });

      // when
      const result = service.getLintingState({ id: 'tab-1' });

      // then
      expect(result).to.equal(results);
    });

  });


  describe('#setLintingState', function() {

    it('should set linting state for a tab', function() {

      // given
      const tab = { id: 'tab-1' };
      const results = [ { id: 'issue-1' } ];
      const { service, state } = createLintingService({
        initialState: { tabs: [ tab ] }
      });

      // when
      service.setLintingState(tab, results);

      // then
      expect(state.lintingState['tab-1']).to.equal(results);
    });


    it('should preserve other tabs linting state', function() {

      // given
      const tab1 = { id: 'tab-1' };
      const tab2 = { id: 'tab-2' };
      const results1 = [ { id: 'issue-1' } ];
      const results2 = [ { id: 'issue-2' } ];

      const { service, state } = createLintingService({
        initialState: {
          tabs: [ tab1, tab2 ],
          lintingState: { 'tab-1': results1 }
        }
      });

      // when
      service.setLintingState(tab2, results2);

      // then
      expect(state.lintingState['tab-1']).to.eql(results1);
      expect(state.lintingState['tab-2']).to.equal(results2);
    });

  });


  describe('#handleConnectionCheckStarted', function() {

    it('should clear connectionCheckResult', function() {

      // given
      const { service, state } = createLintingService({
        initialState: { connectionCheckResult: { success: true } }
      });

      // when
      service.handleConnectionCheckStarted();

      // then
      expect(state.connectionCheckResult).to.be.null;
    });

  });


  describe('#handleConnectionStatusChanged', function() {

    it('should update connectionCheckResult', function() {

      // given
      const { service, state } = createLintingService();

      // when
      service.handleConnectionStatusChanged({
        tab: { id: 'tab-1' },
        success: true,
        response: { gatewayVersion: '1.0' }
      });

      // then
      expect(state.connectionCheckResult.success).to.be.true;
    });


    it('should not re-lint when connection status is unchanged', function() {

      // given
      const { service, flushCallback } = createLintingService({
        initialState: {
          connectionCheckResult: { success: true, response: { gatewayVersion: '1.0' } },
          activeTab: { id: 'tab-1', type: 'bpmn', file: { contents: '' } }
        }
      });

      const lintTabSpy = sinon.spy(service, 'lintTab');

      // when
      service.handleConnectionStatusChanged({
        tab: { id: 'tab-1' },
        success: true,
        response: { gatewayVersion: '1.0' }
      });
      flushCallback();

      // then
      expect(lintTabSpy).not.to.have.been.called;
    });

  });


  describe('#handleEngineProfileChanged', function() {

    it('should store engine profile', function() {

      // given
      const tab = { id: 'tab-1', type: 'bpmn', file: { contents: '' } };
      const { service, state } = createLintingService({
        initialState: { tabs: [ tab ] }
      });

      // when
      service.handleEngineProfileChanged({
        tab,
        executionPlatform: 'Camunda Cloud',
        executionPlatformVersion: '8.3'
      });

      // then
      expect(state.engineProfiles['tab-1']).to.eql({
        executionPlatform: 'Camunda Cloud',
        executionPlatformVersion: '8.3'
      });
    });


    it('should ignore events without tab', function() {

      // given
      const { service, state } = createLintingService();

      // when
      service.handleEngineProfileChanged({
        tab: null,
        executionPlatform: 'Camunda Cloud',
        executionPlatformVersion: '8.3'
      });

      // then
      expect(state.engineProfiles).to.eql({});
    });

  });

});
