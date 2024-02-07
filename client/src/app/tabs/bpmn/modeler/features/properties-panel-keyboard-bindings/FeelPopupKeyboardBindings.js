/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export default class FeelPopupKeyboardBindings {
  constructor(eventBus) {
    this._eventBus = eventBus;

    eventBus.on('feelPopup.opened', this._addEventListeners);
  }

  _addEventListeners = (event) => {
    const container = event.domNode;

    container.addEventListener('focusin', this.handleFocusin);
    container.addEventListener('focusout', this.handleFocusout);

    this._eventBus.once('feelPopup.close', () => {
      container.removeEventListener('focusin', this.handleFocusin);
      container.removeEventListener('focusout', this.handleFocusout);
    });
  };

  handleFocusin = () => {
    this._eventBus.fire('feelPopup.focusin');
  };

  handleFocusout = () => {
    this._eventBus.fire('feelPopup.focusout');
  };
}

FeelPopupKeyboardBindings.$inject = [ 'eventBus' ];
