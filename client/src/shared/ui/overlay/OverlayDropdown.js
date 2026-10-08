/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@camunda/design-system';

/**
 * @typedef {{ text: String, onClick: Function, icon?: React.Component }} Item
 */

/**
 * @typedef {{ key: String, label: String, items: Array<Item>, maxHeight: Number | String }} ItemGroup
 */


/**
 * Button that opens a dropdown menu.
 * @param {Object} props
 * @param {Node} props.buttonRef
 * @param {React.ReactChildren} props.children
 * @param {String} [props.className]
 * @param {Array<Item> | Array<ItemGroup>} props.items
 * @param {Function} [props.onClose]
 * @param {Object} [props.overlayConfig] - `minWidth` and `maxWidth` of the menu
 * @param {Boolean} [props.overlayState] - when set, the button calls `onClose` instead of opening the menu
 * @param {Boolean} [props.shouldOpen]
 */
export function OverlayDropdown(props) {
  const {
    buttonRef,
    children,
    className = '',
    items,
    onClose,
    shouldOpen,
    overlayConfig = {},
    overlayState,
    ...restProps
  } = props;

  const [ open, setOpen ] = useState(false);

  useEffect(() => {
    setOpen(!!shouldOpen);
  }, [ shouldOpen ]);

  const handleOpenChange = (open) => {
    if (open && overlayState) {
      return onClose();
    }

    setOpen(open);

    if (!open && onClose) {
      onClose();
    }
  };

  const groups = isGrouped(items) ? items : [ { key: 'items', items } ];

  return (
    <DropdownMenu open={ open } onOpenChange={ handleOpenChange }>
      <DropdownMenuTrigger asChild>
        <button
          { ...restProps }
          className={ classNames(className, 'btn', { 'btn--active': open }) }
          ref={ buttonRef }
          type="button"
        >
          { children }
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        loop
        style={ { minWidth: overlayConfig.minWidth, maxWidth: overlayConfig.maxWidth } }
      >
        {
          groups.map((group, index) => (
            <DropdownMenuGroup key={ group.key }>
              { index > 0 && <DropdownMenuSeparator /> }
              { group.label && <DropdownMenuLabel>{ group.label }{ group.labelSuffix }</DropdownMenuLabel> }
              <div style={ group.maxHeight ? { maxHeight: group.maxHeight, overflowY: 'auto' } : undefined }>
                {
                  group.items.map(({ text, icon: Icon, onClick }, index) => (
                    <DropdownMenuItem key={ index } title={ text } onSelect={ onClick }>
                      { Icon && <Icon aria-hidden="true" /> }
                      { text }
                    </DropdownMenuItem>
                  ))
                }
              </div>
            </DropdownMenuGroup>
          ))
        }
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


// helper ///////////

function isGrouped(items) {
  return items.length && items[0].key;
}

