/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import Flags from '../../../util/Flags';

const TWENTY_FOUR_HOURS_MS = 1000 * 60 * 60 * 24;

export default class PingEventHandler {
  constructor(props) {

    const {
      track,
      subscribe
    } = props;

    this.track = track;
    this.getGlobal = props.getGlobal;
    this.config = props.config;
    this.sentInitially = false;
    this._intervalID = null;

    subscribe('telemetry.enabled', () => {
      this.configurePing();
    });

    subscribe('telemetry.disabled', () => {
      clearInterval(this._intervalID);
    });
  }

  getPlugins = () => {
    const { appPlugins } = this.getGlobal('plugins');

    if (!appPlugins) {
      return [];
    }

    return appPlugins.map(plugin => plugin.name);
  };

  getFlags = () => {
    const maskedFlags = Object.assign({}, Flags.data);

    // Mask non-boolean values to <true>, indicating the flag was set.
    // This shall ensure custom strings are not leaked via telemetry.
    for (const key in maskedFlags) {
      maskedFlags[key] = !!maskedFlags[key];
    }

    return maskedFlags;
  };

  setInterval = (func) => {
    return setInterval(func, TWENTY_FOUR_HOURS_MS);
  };

  configurePing = () => {
    const plugins = this.getPlugins(),
          flags = this.getFlags();

    const payload = { plugins, flags };

    if (!this.sentInitially) {
      this.trackPing(payload);

      this.sentInitially = true;
    }

    if (this._intervalID === null) {
      this._intervalID = this.setInterval(() => this.trackPing(payload));
    }
  };

  trackPing(payload) {
    this.track('ping', payload);
  }

}
