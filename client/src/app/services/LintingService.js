/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { reduce } from 'min-dash';

import VersionMismatchChecker from '../linting/VersionMismatchChecker';


const EMPTY_LINTING_STATE = [];


/**
 * Service for managing linting state and connection checking.
 *
 * @param {object} deps
 * @param {function} deps.setState - State update function.
 * @param {function} deps.getState - Returns current state snapshot.
 * @param {object} deps.tabsProvider - Tab provider for accessing linters
 * @param {function} deps.getPlugins - Gets plugins by type
 * @param {function} deps.getConfig - Gets configuration values
 */
export default class LintingService {

  constructor({ setState, getState, tabsProvider, getPlugins, getConfig }) {
    this._setState = setState;
    this._getState = getState;
    this._tabsProvider = tabsProvider;
    this._getPlugins = getPlugins;
    this._getConfig = getConfig;
  }

  /**
   * Lint a tab's contents and update the linting state.
   *
   * @param {object} tab - The tab to lint.
   * @param {*} [contents] - Optional contents to lint (defaults to tab file contents).
   */
  lintTab = async (tab, contents) => {
    const { type } = tab;

    const tabProvider = this._tabsProvider.getProvider(type);

    const plugins = this._getPlugins(`lintRules.${ type }`);

    const linter = await tabProvider.getLinter(plugins, tab, this._getConfig);

    let results = [];

    if (linter) {
      if (!contents) {
        contents = tab.file.contents;
      }

      results = await linter.lint(contents);
    }

    const getWarnings = VersionMismatchChecker({
      connectionCheckResult: this._getState().connectionCheckResult,
      engineProfiles: this._getState().engineProfiles
    });

    const warnings = getWarnings(tab);

    if (warnings.length) {
      results = [ ...results, ...warnings ];
    }

    this.setLintingState(tab, results);
  };

  /**
   * Get the linting state for a tab.
   *
   * @param {object} tab
   * @returns {Array} Linting results.
   */
  getLintingState = (tab) => {
    return this._getState().lintingState[ tab.id ] || EMPTY_LINTING_STATE;
  };

  /**
   * Set the linting state for a tab.
   *
   * @param {object} tab
   * @param {Array} results
   */
  setLintingState = (tab, results) => {
    const { tabs } = this._getState();

    const lintingState = reduce(tabs, (lintingState, t) => {
      if (t === tab) {
        return lintingState;
      }

      return {
        ...lintingState,
        [ t.id ]: this.getLintingState(t)
      };
    }, {
      [ tab.id ]: results
    });

    this._setState({
      lintingState
    });
  };

  /**
   * Handle connection check started event.
   */
  handleConnectionCheckStarted = () => {
    this._setState({ connectionCheckResult: null });
  };

  /**
   * Handle connection status change event.
   * Re-lints the active tab when relevant data changes.
   *
   * @param {object} params
   * @param {object} params.tab
   */
  handleConnectionStatusChanged = ({ tab, ...connectionCheckResult }) => {
    const prev = this._getState().connectionCheckResult;

    // Only re-lint when the data relevant to version mismatch
    // warning actually changes, not on every periodic poll
    const prevVersion = prev && prev.success && prev.response
      ? prev.response.gatewayVersion : null;
    const nextVersion = connectionCheckResult.success && connectionCheckResult.response
      ? connectionCheckResult.response.gatewayVersion : null;
    const relevantChange = (prev && prev.success) !== connectionCheckResult.success
      || prevVersion !== nextVersion;

    this._setState({ connectionCheckResult }, () => {
      if (!relevantChange) {
        return;
      }

      const { activeTab } = this._getState();

      if (activeTab && activeTab.id !== '__empty') {
        this.lintTab(activeTab);
      }
    });
  };

  /**
   * Handle engine profile changed event.
   * Updates stored engine profiles and re-lints the tab.
   *
   * @param {object} params
   * @param {object} params.tab
   * @param {string} params.executionPlatform
   * @param {string} params.executionPlatformVersion
   */
  handleEngineProfileChanged = ({ tab, executionPlatform, executionPlatformVersion }) => {
    if (!tab || !tab.id) {
      return;
    }

    this._setState(state => ({
      engineProfiles: {
        ...state.engineProfiles,
        [ tab.id ]: { executionPlatform, executionPlatformVersion }
      }
    }), () => {

      // Re-lint to pick up version mismatch warning
      this.lintTab(tab);
    });
  };

  /**
   * Register linting-related actions on the given action registry.
   *
   * @param {ActionRegistry} actionRegistry
   */
  registerActions(actionRegistry) {
    actionRegistry.register('lint-tab', (options) => {
      const { tab, contents } = options;
      return this.lintTab(tab, contents);
    });
  }

  /**
   * Subscribe to application events relevant to linting.
   *
   * @param {object} eventEmitter - object with `on(event, handler)` / `off(event, handler)`
   * @returns {Function} destroy — call to unsubscribe all events
   */
  subscribeEvents(eventEmitter) {
    const subscriptions = [];

    function on(event, handler) {
      eventEmitter.on(event, handler);
      subscriptions.push({ event, handler });
    }

    on('connectionManager.connectionStatusChanged',
      this.handleConnectionStatusChanged);
    on('connectionManager.connectionCheckStarted',
      this.handleConnectionCheckStarted);
    on('tab.engineProfileChanged',
      this.handleEngineProfileChanged);

    return function destroy() {
      for (const { event, handler } of subscriptions) {
        eventEmitter.off(event, handler);
      }
    };
  }
}
