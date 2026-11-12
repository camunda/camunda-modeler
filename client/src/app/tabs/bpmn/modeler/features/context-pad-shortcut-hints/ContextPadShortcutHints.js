/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { html } from 'diagram-js/lib/ui';
import PaletteTooltipComponent from 'diagram-js/lib/features/palette/PaletteTooltipComponent';

import {
  APPEND_ELEMENT_SHORTCUT,
  REPLACE_ELEMENT_SHORTCUT
} from '../../../../../KeyboardBindings';

/**
 * @typedef {import('diagram-js/lib/core/Canvas').default} Canvas
 * @typedef {import('diagram-js/lib/core/EventBus').default} EventBus
 * @typedef {import('diagram-js/lib/features/hover-tooltip/HoverTooltip').default} HoverTooltip
 */

const ACTION_SHORTCUTS = {
  append: APPEND_ELEMENT_SHORTCUT,
  replace: REPLACE_ELEMENT_SHORTCUT
};

const PAD_ENTRY_SELECTOR = '.djs-context-pad .entry, .djs-create-pad-entry, .djs-append-indicator';

const APPEND_ENTRY_SELECTOR = '[data-entry-id="append"]';

const TOOLTIP_OFFSET = 8;

/**
 * Adds keyboard shortcut hints to context-pad and append-pad actions.
 *
 * @param {EventBus} eventBus
 * @param {Canvas} canvas
 * @param {HoverTooltip} hoverTooltip
 */
export default function ContextPadShortcutHints(eventBus, canvas, hoverTooltip) {
  const container = canvas.getContainer();

  eventBus.on('contextPad.open', ({ current }) => {
    if (!current) {
      return;
    }

    Object.entries(ACTION_SHORTCUTS).forEach(([ id, shortcut ]) => {
      const entry = current.entries[ id ];
      const control = current.html.querySelector(`[data-action="${ id }"]`);

      if (!entry || !entry.title || !control) {
        return;
      }

      control.setAttribute('aria-label', entry.title);
      control.setAttribute('aria-keyshortcuts', shortcut);
      control.removeAttribute('title');
    });
  });

  eventBus.on('createPad.open', event => {
    const pad = (event.current && event.current.html) || event.html;

    if (!pad) {
      return;
    }

    const appendEntry = pad.querySelector(APPEND_ENTRY_SELECTOR);

    if (!appendEntry) {
      return;
    }

    appendEntry.setAttribute('aria-keyshortcuts', APPEND_ELEMENT_SHORTCUT);

    const tooltipWrapper = appendEntry.closest('.djs-create-pad-tooltip');

    if (tooltipWrapper) {
      tooltipWrapper.classList.add('djs-create-pad-tooltip--shortcut');
    }
  });

  hoverTooltip.add({
    container,
    selector: PAD_ENTRY_SELECTOR,
    getContent: (target) => {
      const shortcut = getShortcut(target);
      const title = getTitle(target);

      if (!shortcut || !title) {
        return null;
      }

      return html`<${PaletteTooltipComponent}
        title=${ title }
        shortcut=${ shortcut }
      />`;
    },
    getPosition: (target) => {
      const bounds = target.getBoundingClientRect();

      return {
        x: bounds.left + bounds.width / 2,
        y: bounds.top - TOOLTIP_OFFSET,
        placement: 'top'
      };
    }
  });
}

ContextPadShortcutHints.$inject = [ 'eventBus', 'canvas', 'hoverTooltip' ];

function getShortcut(target) {
  const id = target.classList.contains('djs-append-indicator')
    ? 'append'
    : target.getAttribute('data-action') || target.getAttribute('data-entry-id');

  return ACTION_SHORTCUTS[ id ];
}

function getTitle(target) {
  const title = target.getAttribute('aria-label') || target.getAttribute('title');

  if (target.classList.contains('djs-append-indicator') && title) {
    target.setAttribute('aria-label', title);
    target.setAttribute('aria-keyshortcuts', APPEND_ELEMENT_SHORTCUT);
    target.removeAttribute('title');
  }

  return title;
}
