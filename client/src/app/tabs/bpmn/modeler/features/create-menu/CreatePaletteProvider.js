/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const LOWER_PRIORITY = 900;

const CREATE_ICON = `<svg width="46" height="46" viewBox="-2 -2 9.82 9.82" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
  <path d="M1.3 3.4c.3 0 .5-.2.5-.5s-.2-.4-.5-.4c-.2 0-.4.1-.4.4 0 .3.2.5.4.5zM3 3.4c.2 0 .4-.2.4-.5s-.2-.4-.4-.4c-.3 0-.5.1-.5.4 0 .3.2.5.5.5zM4.6 3.4c.2 0 .4-.2.4-.5s-.2-.4-.4-.4c-.3 0-.5.1-.5.4 0 .3.2.5.5.5z"/>
</svg>`;

/**
 * A palette provider that opens a React-based popover
 * instead of the default popup menu.
 */
export default function CreatePaletteProvider(palette, translate, eventBus) {
  this._palette = palette;
  this._translate = translate;
  this._eventBus = eventBus;

  palette.registerProvider(LOWER_PRIORITY, this);
}

CreatePaletteProvider.$inject = [
  'palette',
  'translate',
  'eventBus'
];

CreatePaletteProvider.prototype.getPaletteEntries = function() {
  const translate = this._translate;
  const eventBus = this._eventBus;

  return {
    'create': {
      group: 'create',
      html: `<div class="entry">${CREATE_ICON}</div>`,
      title: translate('Create element'),
      action: {
        click: function(event) {
          const target = event && event.target || document.querySelector('.djs-palette [data-action="create"]');
          const rect = target.closest('[data-action="create"]').getBoundingClientRect();

          eventBus.fire('createMenu.open', {
            anchor: {
              x: rect.right,
              y: rect.top
            }
          });
        }
      }
    }
  };
};
