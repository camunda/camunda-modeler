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

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@camunda/design-system';

import { EllipsisVertical } from '@camunda/design-system/icons';

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
  const selected = useRef(false);

  const select = (item) => {
    selected.current = true;
    trigger.current?.focus();
    item.onSelect();
  };

  // keep the focus where the selected item moved it, e.g. into a modal
  const onCloseAutoFocus = (event) => {
    if (selected.current) {
      event.preventDefault();
    }

    selected.current = false;
  };

  // not modal: an item may open a modal while the menu closes
  return <DropdownMenu modal={ false }>
    <DropdownMenuTrigger asChild>
      <Button
        ref={ trigger }

        // do not submit an enclosing form
        type="button"
        variant="ghost"
        size="icon-sm"
        className={ className }
        aria-label={ label }
      >
        <EllipsisVertical aria-hidden="true" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" onCloseAutoFocus={ onCloseAutoFocus }>
      { items.map(item => <DropdownMenuItem
        key={ item.label }
        variant={ item.danger ? 'destructive' : 'default' }
        onSelect={ () => select(item) }
      >
        { item.label }
      </DropdownMenuItem>) }
    </DropdownMenuContent>
  </DropdownMenu>;
}
