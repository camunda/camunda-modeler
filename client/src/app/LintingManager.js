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

import VersionMismatchChecker from './linting/VersionMismatchChecker';

const EMPTY_LINTING_STATE = [];

/**
 * Coordinates linting of tabs and the related linting state held by <App>.
 *
 * Owns the linting orchestration (running tab linters, merging version
 * mismatch warnings) and the corresponding `lintingState`, while delegating
 * persistence to the host <App> via `setState`.
 */
export default class LintingManager {

  /**
   * @param {import('./App').App} app
   */
  constructor(app) {
    this._app = app;
  }

  /**
   * Lint the given tab and store the results.
   *
   * @param {Tab} tab
   * @param {string} [contents]
   */
  lintTab = async (tab, contents) => {
    const app = this._app;

    const { tabsProvider } = app.props;

    const { type } = tab;

    const tabProvider = tabsProvider.getProvider(type);

    const plugins = app.getPlugins(`lintRules.${ type }`);

    const linter = await tabProvider.getLinter(plugins, tab, app.getConfig);

    let results = [];

    if (linter) {
      if (!contents) {
        contents = tab.file.contents;
      }

      results = await linter.lint(contents);
    }

    const getWarnings = VersionMismatchChecker({
      connectionCheckResult: app.state.connectionCheckResult,
      engineProfiles: app.state.engineProfiles
    });

    const warnings = getWarnings(tab);

    if (warnings.length) {
      results = [ ...results, ...warnings ];
    }

    app.setLintingState(tab, results);
  };

  handleConnectionCheckStarted = () => {
    this._app.setState({ connectionCheckResult: null });
  };

  handleConnectionStatusChanged = ({ tab, ...connectionCheckResult }) => {
    const app = this._app;

    const prev = app.state.connectionCheckResult;

    // Only re-lint when the data relevant to version mismatch
    // warning actually changes, not on every periodic poll
    const prevVersion = prev && prev.success && prev.response
      ? prev.response.gatewayVersion : null;
    const nextVersion = connectionCheckResult.success && connectionCheckResult.response
      ? connectionCheckResult.response.gatewayVersion : null;
    const relevantChange = (prev && prev.success) !== connectionCheckResult.success
      || prevVersion !== nextVersion;

    app.setState({ connectionCheckResult }, async () => {
      if (!relevantChange) {
        return;
      }

      const { activeTab } = app.state;

      if (activeTab && !app.isEmptyTab(activeTab)) {
        const contents = await app.getActiveTabContents();

        app.lintTab(activeTab, contents);
      }
    });
  };

  handleEngineProfileChanged = ({ tab, executionPlatform, executionPlatformVersion }) => {
    if (!tab || !tab.id) {
      return;
    }

    const app = this._app;

    app.setState(state => ({
      engineProfiles: {
        ...state.engineProfiles,
        [ tab.id ]: { executionPlatform, executionPlatformVersion }
      }
    }), async () => {
      if (app.state.activeTab === tab) {
        const contents = await app.getActiveTabContents();

        app.lintTab(tab, contents);
      } else {
        app.lintTab(tab);
      }
    });
  };

  getLintingState = (tab) => {
    return this._app.state.lintingState[ tab.id ] || EMPTY_LINTING_STATE;
  };

  setLintingState = (tab, results) => {
    const { tabs } = this._app.state;

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

    this._app.setState({
      lintingState
    });
  };
}
