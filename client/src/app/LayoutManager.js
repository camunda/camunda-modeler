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
 * Owns the layout for <App>, including the bottom panel and the side panel.
 *
 * Reads and writes the `layout` state of the host <App> via `setState`.
 */
export default class LayoutManager {

  /**
   * @param {import('./App').App} app
   */
  constructor(app) {
    this._app = app;
  }

  setLayout(layout) {
    this._app.setState({
      layout
    });
  }

  handleLayoutChanged(newLayout) {
    this._app.setState(({ layout }) => ({
      layout: merge({}, layout, newLayout)
    }));
  }

  openPanel(tab = 'log') {
    const { layout = {} } = this._app.state;

    const { panel = {} } = layout;

    this.handleLayoutChanged({
      panel: {
        ...panel,
        open: true,
        tab
      }
    });
  }

  closePanel() {
    const { layout = {} } = this._app.state;

    const { panel = {} } = layout;

    this.handleLayoutChanged({
      panel: {
        ...panel,
        open: false
      }
    });
  }

  openSidePanel(tab = 'properties') {
    const { layout = {} } = this._app.state;

    const { sidePanel = {} } = layout;

    this.handleLayoutChanged({
      sidePanel: {
        ...sidePanel,
        open: true,
        tab
      }
    });
  }

  closeSidePanel() {
    const { layout = {} } = this._app.state;

    const { sidePanel = {} } = layout;

    this.handleLayoutChanged({
      sidePanel: {
        ...sidePanel,
        open: false
      }
    });
  }
}
