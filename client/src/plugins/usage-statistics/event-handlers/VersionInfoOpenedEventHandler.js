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

/**
 * Sends event when user opens version info overlay.
 */
export default class VersionInfoOpenedEventHandler extends BaseEventHandler {

  constructor(props) {
    const {
      onSend,
      subscribe
    } = props;

    super('versionInfoOpened', onSend);

    this._subscribe = subscribe;
  }

  onAfterEnable() {
    this._subscription = this._subscribe('versionInfo.opened', this.handleEvent);
  }

  onAfterDisable() {
    this._subscription && this._subscription.cancel();
  }

  handleEvent = payload => {
    return this.sendToET({ source: payload.source });
  }
}
