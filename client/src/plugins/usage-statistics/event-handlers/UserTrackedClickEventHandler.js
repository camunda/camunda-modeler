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

const TRACKED_LINK_PARENT_IDS = [ 'version-info-overlay', 'welcome-page-cloud', 'welcome-page-platform', 'welcome-page-learn-more' ];

/**
  * Sends event when user clicks a link or button contained within a tracked html container.
 */
export default class UserTrackedClickEventHandler extends BaseEventHandler {

  constructor(props) {
    const {
      onSend
    } = props;

    super('userTrackedClick', onSend);
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
    const payload = this._getEventPayload(target);

    if (payload) {
      this.sendToET(payload);
    }
  };

  _getEventPayload(target) {

    for (const parent of TRACKED_LINK_PARENT_IDS) {

      if (target.matches(`#${parent} a[href]`)) {
        const payload = { parent, label: target.textContent };

        // Only provide href for external links
        if (target.href.startsWith('http') && !target.href.startsWith('http://localhost')) {
          payload.link = target.href;
          payload.type = 'external-link';
        }
        else {
          payload.type = 'internal-link';
        }

        return payload;
      }

      if (target.matches(`#${parent} button`)) {
        return { parent, label: target.textContent, type: 'button' };
      }
    }

    return null;
  }
}
