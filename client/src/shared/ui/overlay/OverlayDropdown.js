/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useRef, useState } from 'react';
import classNames from 'classnames';

import { Overlay } from '..';

import css from './OverlayDropdown.less';

/**
 * @typedef {{ text: string, onClick: Function }} Item
 */

/**
 * Dropdown displayed as an overlay above the status bar.
 * @param {{ children: React.ReactChildren, items: Item[], className?: string }} props
 */
export function OverlayDropdown(props) {
  const { children, className = '', items, ...restProps } = props;

  const buttonRef = useRef(null);
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(open => !open);
  const close = () => setOpen(false);

  const onSelect = item => {
    item.onClick();
    close();
  };

  return (
    <React.Fragment>
      <button
        { ...restProps }
        onClick={ toggle }
        className={ classNames(className, 'btn', { 'btn--active': open }) }
        ref={ buttonRef }
        type="button"
      >
        { children }
      </button>
      { open && (
        <Overlay className={ css.OverlayDropdown } onClose={ close } anchor={ buttonRef.current }>
          <Options items={ items } onSelect={ onSelect } />
        </Overlay>
      ) }
    </React.Fragment>
  );
}

function Options(props) {
  const { items, onSelect } = props;

  return (
    <ul>
      {
        items.map((item, index) =>
          <Option key={ index } text={ item.text } onClick={ () => onSelect(item) } />
        )
      }
    </ul>
  );
}

function Option(props) {
  const { text, onClick } = props;

  return (
    <li onClick={ onClick }>
      <button type="button">{ text }</button>
    </li>
  );
}
