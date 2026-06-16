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
 * Owns the modal lifecycle for <App>.
 *
 * Drives modals through the command bus and keeps the `currentModal` state of
 * the host <App> in sync.
 */
export default class ModalManager {

  /**
   * @param {import('./App').App} app
   */
  constructor(app) {
    this._app = app;
  }

  openModal(modal) {
    return this._app.triggerAction('open-modal', modal);
  }

  closeModal() {
    this._app.updateMenu(this._app.state.tabState);

    return this._app.triggerAction('close-modal');
  }

  setModal(currentModal) {
    this._app.setState({ currentModal });
  }

  showShortcuts() {
    return this.openModal('KEYBOARD_SHORTCUTS');
  }
}
