/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/**
 * The set of actions handled directly by <App> via its action registry.
 *
 * Keep in sync with the handlers defined in `getActionRegistry.js`. Actions
 * not listed here are forwarded to the active tab's `triggerAction`.
 */
export type AppAction =
  | 'set-tab-group'
  | 'lint-tab'
  | 'select-tab'
  | 'create-bpmn-diagram'
  | 'create-dmn-diagram'
  | 'create-form'
  | 'create-cloud-form'
  | 'create-cloud-bpmn-diagram'
  | 'create-cloud-dmn-diagram'
  | 'create-diagram'
  | 'reopen-file'
  | 'open-diagram'
  | 'save-all'
  | 'save-tab'
  | 'save'
  | 'save-as'
  | 'window-focused'
  | 'window-blurred'
  | 'quit'
  | 'close-all-tabs'
  | 'close-tab'
  | 'close-active-tab'
  | 'close-other-tabs'
  | 'reopen-last-tab'
  | 'reveal-in-file-explorer'
  | 'show-shortcuts'
  | 'update-menu'
  | 'export-as'
  | 'show-dialog'
  | 'open-modal'
  | 'close-modal'
  | 'open-external-url'
  | 'check-file-changed'
  | 'resize'
  | 'reload-modeler'
  | 'restart-modeler'
  | 'log'
  | 'open-log'
  | 'open-panel'
  | 'close-panel'
  | 'display-notification'
  | 'emit-event'
  | 'toggle-panel'
  | 'settings-open'
  | 'open-deployment'
  | 'open-connection-selector';

export type ActionHandler = (options?: any) => any;

/**
 * Map of action name to handler, as produced by `getActionRegistry`.
 */
export type ActionRegistry = Map<AppAction, ActionHandler>;
