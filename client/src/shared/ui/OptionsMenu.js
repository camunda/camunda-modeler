/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useRef } from 'react';

import classNames from 'classnames';

import { OverflowMenu, OverflowMenuItem } from '@carbon/react';

import * as css from './OptionsMenu.css';

/**
 * @typedef { {
 *   label: string,
 *   onSelect: () => void,
 *   danger?: boolean
 * } } OptionsMenuItem
 */

/**
 * An options (`...`) menu.
 *
 * Once an item is selected, the menu closes and the focus returns to the menu
 * button. The item's `onSelect` runs afterwards, so it may move the focus,
 * e.g. by opening a modal.
 *
 * @param {Object} props
 * @param {string} props.label - accessible label of the menu button
 * @param {OptionsMenuItem[]} props.items
 * @param {string} [props.className]
 */
export default function OptionsMenu({ label, items, className }) {
  const trigger = useRef(null);
  const selected = useRef(null);

  const onClose = () => {
    const item = selected.current;

    selected.current = null;

    if (item) {
      trigger.current?.focus();
      item.onSelect();
    }
  };

  // render the menu next to the button, e.g. inside of a modal
  return <span className={ classNames(css.OptionsMenu, className) } data-floating-menu-container>
    <OverflowMenu
      ref={ trigger }
      size="sm"
      flipped
      align="left"
      iconDescription={ label }
      aria-label={ label }
      onClose={ onClose }
    >
      { items.map(item => <OverflowMenuItem
        key={ item.label }

        // do not submit an enclosing form
        type="button"
        itemText={ item.label }
        isDelete={ item.danger }
        onClick={ () => selected.current = item }
      />) }
    </OverflowMenu>
  </span>;
}
