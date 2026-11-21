/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const TRACKED_LINK_PARENT_IDS = [
  'version-info-overlay',
  'welcome-page-cloud',
  'welcome-page-platform',
  'welcome-page-learn-more',
  'welcome-page-open',
  'welcome-page-local',
  'welcome-page-local-setup',
  'welcome-page-promotion'
];

export default class LinkEventHandler {
  constructor(props) {
    this.track = props.track;

    document.addEventListener('click', this.trackClick);
  }

  trackClick = ({ target }) => {
    let payload, payloadType;

    for (const parent of TRACKED_LINK_PARENT_IDS) {

      // the click may land on the label or icon inside the link or button
      const link = target.closest(`#${parent} a[href]`);
      const button = target.closest(`#${parent} button`);

      if (link) {
        payload = {
          parent,
          label: link.textContent
        };
        payloadType = 'link';

        // Only provide href for external links
        if (link.href.startsWith('http') && !link.href.startsWith('http://localhost')) {
          payload.link = link.href;
          payload.type = 'external-link';
        } else {
          payload.type = 'internal-link';
        }
      }

      if (button) {
        payloadType = 'button';
        payload = {
          parent,
          label: button.textContent,
          type: payloadType
        };
      }
    }

    if (payloadType) {
      const action = payloadType === 'link' ? 'opened' : 'clicked';
      const event = `${payloadType}:${action}`;

      this.track(event, payload);
    }

  };
}
