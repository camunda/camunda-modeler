/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import LintingService from './LintingService';

/**
 * Descriptor for the linting service.
 *
 * No inter-service dependencies.
 */
export default {
  name: 'linting',

  create({ setState, getState, tabsProvider, getPlugins, getConfig }) {
    return new LintingService({
      setState,
      getState,
      tabsProvider,
      getPlugins,
      getConfig
    });
  },

  actions(service) {
    return {
      'lint-tab': (options) => {
        const { tab, contents } = options;
        return service.lintTab(tab, contents);
      }
    };
  },

  events(service) {
    return {
      'connectionManager.connectionStatusChanged': service.handleConnectionStatusChanged,
      'connectionManager.connectionCheckStarted': service.handleConnectionCheckStarted,
      'tab.engineProfileChanged': service.handleEngineProfileChanged
    };
  }
};
