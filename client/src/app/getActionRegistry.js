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
 * Build the map of action handlers for the given <App> instance.
 *
 * Each handler receives the action `options` and may use the provided
 * `app` instance to read state and delegate to its public methods.
 *
 * State (e.g. the active tab) is read lazily inside each handler so the
 * behavior matches a fresh read at dispatch time.
 *
 * @param {import('./App').App} app
 *
 * @return {Map<string, (options: any) => any>}
 */
export default function getActionRegistry(app) {

  const getActiveTab = () => app.state.activeTab;

  /**
   * @type {Array<[ string, (options: any) => any ]>}
   */
  const entries = [

    [ 'set-tab-group', ({ id, group }) => app.setTabGroup(id, group) ],

    [ 'lint-tab', ({ tab, contents }) => app.lintTab(tab, contents) ],

    [ 'select-tab', (options) => {
      if (options === 'next') {
        app.navigate(1);
      }

      if (options === 'previous') {
        app.navigate(-1);
      }
    } ],

    [ 'create-bpmn-diagram', () => app.createDiagram('bpmn') ],
    [ 'create-dmn-diagram', () => app.createDiagram('dmn') ],
    [ 'create-form', () => app.createDiagram('form') ],
    [ 'create-cloud-form', () => app.createDiagram('cloud-form') ],
    [ 'create-cloud-bpmn-diagram', () => app.createDiagram('cloud-bpmn') ],
    [ 'create-cloud-dmn-diagram', () => app.createDiagram('cloud-dmn') ],
    [ 'create-diagram', (options) => app.createDiagram(options.type) ],

    [ 'reopen-file', (options) => app.openFiles([ options.file ]) ],

    [ 'open-diagram', (options) => {
      const { path } = options;

      if (path) {
        return app.readFileFromPath(path).then(file => app.openFiles([ file ]));
      }

      return app.showOpenFilesDialog();
    } ],

    [ 'save-all', () => app.saveAllTabs() ],
    [ 'save-tab', (options) => app.saveTab(options.tab) ],
    [ 'save', () => app.saveTab(getActiveTab()) ],
    [ 'save-as', () => app.saveTab(getActiveTab(), { saveAs: true }) ],

    [ 'window-focused', () => app.emit('app.focused') ],
    [ 'window-blurred', () => app.emit('app.blurred') ],

    [ 'quit', () => app.quit() ],

    [ 'close-all-tabs', () => app.closeTabs(() => true) ],
    [ 'close-tab', (options) => app.closeTabs(t => options && t.id === options.tabId) ],

    [ 'close-active-tab', () => {
      const activeId = app.state.activeTab.id;

      return app.closeTabs(t => t.id === activeId);
    } ],

    [ 'close-other-tabs', (options) => {
      const activeId = options && options.tabId || app.state.activeTab.id;

      return app.closeTabs(t => t.id !== activeId);
    } ],

    [ 'reopen-last-tab', () => app.reopenLastTab() ],

    [ 'reveal-in-file-explorer', (options) => app.revealInFileExplorer(options.filePath) ],

    [ 'show-shortcuts', () => app.showShortcuts() ],

    [ 'update-menu', (options) => app.updateMenu(options) ],

    [ 'export-as', () => app.exportAs(getActiveTab()) ],

    [ 'show-dialog', (options) => app.showDialog(options) ],

    [ 'open-modal', (options) => app.setModal(options) ],
    [ 'close-modal', () => app.setModal(null) ],

    [ 'open-external-url', (options) => app.openExternalUrl(options) ],

    [ 'check-file-changed', () => app.checkFileChanged(getActiveTab()) ],

    [ 'resize', () => app.resizeTab() ],

    [ 'reload-modeler', () => app.reloadModeler() ],
    [ 'restart-modeler', () => app.reloadModeler(true) ],

    [ 'log', ({ action, category, message, silent }) => app.logEntry(message, category, action, silent) ],

    [ 'open-log', () => app.openPanel('log') ],
    [ 'open-panel', (options) => app.openPanel(options.tab) ],
    [ 'close-panel', () => app.closePanel() ],

    [ 'display-notification', (options) => app.displayNotification(options) ],

    [ 'emit-event', ({ type, payload }) => app.emitWithTab(type, getActiveTab(), payload) ],

    [ 'toggle-panel', () => {
      const { panel } = app.state.layout;

      return panel.open ? app.closePanel() : app.openPanel(panel.tab);
    } ],

    [ 'settings-open', (options) => app.emit('app.settings-open', options) ],

    [ 'open-deployment', () => app.emitWithTab('app.open-deployment', getActiveTab()) ],
    [ 'open-connection-selector', () => app.emitWithTab('app.open-connection-selector', getActiveTab()) ]
  ];

  return new Map(entries);
}
