/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import BaseEventHandler from './BaseEventHandler';

const TWENTY_FOUR_HOURS_MS = 1000 * 60 * 60 * 24;

// Sends a ping event to ET when it is enabled for the first time
// and once every 24 hours.
export default class PingEventHandler extends BaseEventHandler {
  constructor(params) {

    const { onSend } = params;

    super('ping', onSend);

    this._intervalID = null;

    this.sentInitially = false;
  }

  setInterval = (func) => {
    setInterval(func, TWENTY_FOUR_HOURS_MS);
  }

  clearInterval = () => {
    clearInterval(this._intervalID);
  }

  onAfterEnable = () => {
    const { sendToET } = this;

    if (!this.sentInitially) {
      sendToET();

      this.sentInitially = true;
    }

    if (this._intervalID === null) {
      this._intervalID = this.setInterval(sendToET.bind(this));
    }
  }

  onAfterDisable = () => {
    if (this._intervalID !== null) {
      this.clearInterval(this._intervalID);
    }

    this._intervalID = null;
  }
}
