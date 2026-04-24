/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import LayoutService from './LayoutService';
import NotificationService from './NotificationService';
import LintingService from './LintingService';


/**
 * Create the default set of application services.
 *
 * @param {object} deps
 * @param {function} deps.setState
 * @param {function} deps.getState
 * @param {object}   deps.tabsProvider
 * @param {function} deps.getPlugins
 * @param {function} deps.getConfig
 *
 * @returns {{ layout: LayoutService, notification: NotificationService, linting: LintingService }}
 */
export default function createDefaultServices({ setState, getState, tabsProvider, getPlugins, getConfig }) {

  const layout = new LayoutService({ setState, getState });

  const notification = new NotificationService({
    setState,
    getState,
    openPanel: (...args) => layout.openPanel(...args)
  });

  const linting = new LintingService({
    setState,
    getState,
    tabsProvider,
    getPlugins,
    getConfig
  });

  return { layout, notification, linting };
}
