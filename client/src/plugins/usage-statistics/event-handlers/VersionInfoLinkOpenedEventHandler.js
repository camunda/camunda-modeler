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

const VERSION_INFO_OVERLAY_ID = 'version-info-overlay';
const LINK_SELECTOR = `#${VERSION_INFO_OVERLAY_ID} a[href]`;

/**
  * Sends event when user opens a link from the version info overlay.
 */
export default class VersionInfoLinkOpenedEventHandler extends BaseEventHandler {

  constructor(props) {
    const {
      onSend
    } = props;

    super('versionInfoLinkOpened', onSend);
  }

  // In Chromium, a click event is dispatched also when user activates a link with the keyboard.
  onAfterEnable() {
    document.addEventListener('click', this.handleLinkOpened);
  }

  onAfterDisable() {
    document.removeEventListener('click', this.handleLinkOpened);
  }

  /**
   *
   * @param {MouseEvent} event
   */
  handleLinkOpened = event => {
    const { target } = event;

    if (!target.matches(LINK_SELECTOR)) {
      return;
    }

    const label = target.textContent;

    this.sendToET({ label });
  }
}
