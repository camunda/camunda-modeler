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
    this.config = params.config;
    this.getGlobal = params.getGlobal;
  }

  getPlugins = () => {
    const { appPlugins } = this.getGlobal('plugins');

    if (!appPlugins) {
      return [];
    }

    return appPlugins.map(plugin => plugin.name);
  }

  setInterval = (func) => {
    return setInterval(func, TWENTY_FOUR_HOURS_MS);
  }

  clearInterval = () => {
    clearInterval(this._intervalID);
  }

  onAfterEnable = () => {
    const plugins = this.getPlugins();

    if (!this.sentInitially) {
      this.sendToET({ plugins });

      this.sentInitially = true;
    }

    if (this._intervalID === null) {
      this._intervalID = this.setInterval(() => this.sendToET({ plugins }));
    }
  }

  onAfterDisable = () => {
    if (this._intervalID !== null) {
      this.clearInterval(this._intervalID);
    }

    this._intervalID = null;
  }
}
