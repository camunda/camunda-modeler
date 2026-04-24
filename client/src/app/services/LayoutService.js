/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { merge } from 'min-dash';


/**
 * Service for managing application layout (panels, side panels).
 *
 * @param {object} deps
 * @param {function} deps.setState - State update function.
 * @param {function} deps.getState - Returns current state snapshot.
 */
export default class LayoutService {

  constructor({ setState, getState }) {
    this._setState = setState;
    this._getState = getState;
  }

  /**
   * Handle layout changes by merging new layout into current layout.
   *
   * @param {object} newLayout
   */
  handleLayoutChanged = (newLayout) => {
    this._setState(({ layout }) => {
      const latestLayout = merge({}, layout, newLayout);

      return { layout: latestLayout };
    });
  };

  /**
   * Set layout directly (replacing existing layout).
   *
   * @param {object} layout
   */
  setLayout(layout) {
    this._setState({
      layout
    });
  }

  /**
   * Open a bottom panel (log, linting, etc.)
   *
   * @param {string} [tab='log'] - The panel tab to open.
   */
  openPanel = (tab = 'log') => {
    const { layout = {} } = this._getState();

    const { panel = {} } = layout;

    this.handleLayoutChanged({
      panel: {
        ...panel,
        open: true,
        tab
      }
    });
  };

  /**
   * Close the bottom panel.
   */
  closePanel() {
    const { layout = {} } = this._getState();

    const { panel = {} } = layout;

    this.handleLayoutChanged({
      panel: {
        ...panel,
        open: false
      }
    });
  }

  /**
   * Open the side panel.
   *
   * @param {string} [tab='properties'] - The side panel tab to open.
   */
  openSidePanel = (tab = 'properties') => {
    const { layout = {} } = this._getState();

    const { sidePanel = {} } = layout;

    this.handleLayoutChanged({
      sidePanel: {
        ...sidePanel,
        open: true,
        tab
      }
    });
  };

  /**
   * Close the side panel.
   */
  closeSidePanel() {
    const { layout = {} } = this._getState();

    const { sidePanel = {} } = layout;

    this.handleLayoutChanged({
      sidePanel: {
        ...sidePanel,
        open: false
      }
    });
  }

  /**
   * Register layout-related actions on the given action registry.
   *
   * @param {ActionRegistry} actionRegistry
   */
  registerActions(actionRegistry) {
    actionRegistry.register('open-log', () => this.openPanel('log'));
    actionRegistry.register('open-panel', (options) => this.openPanel(options.tab));
    actionRegistry.register('close-panel', () => this.closePanel());
  }
}
