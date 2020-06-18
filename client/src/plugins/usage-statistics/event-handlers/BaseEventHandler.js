/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export default class BaseEventHandler {
  constructor(eventName, onSend) {
    this._payload = {
      event: eventName
    };

    this.eventName = eventName;

    this._isEnabled = false;

    this._onSend = onSend;
  }

  onAfterEnable = () => {}

  onAfterDisable = () => {}

  isEnabled = () => {
    return this._isEnabled;
  }

  enable = () => {
    this._isEnabled = true;

    this.onAfterEnable();
  }

  disable = () => {
    this._isEnabled = false;

    this.onAfterDisable();
  }

  sendToET = (data) => {

    if (!this.isEnabled()) {
      return;
    }

    this._onSend({
      ...this._payload,
      ...data
    });
  }
}
