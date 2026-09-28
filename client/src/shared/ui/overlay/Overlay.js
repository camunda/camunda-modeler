/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useMemo, useState } from 'react';

import { isString } from 'min-dash';

import classNames from 'classnames';

import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverHeader,
  PopoverTitle
} from '@camunda/design-system';

import {
  FocusTrap,
  KeyboardInteractionTrap
} from '../trap';

import * as css from './Overlay.css';

const DEFAULT_OFFSET = {
  bottom: 1,
  left: 0
};

/**
 * Anchored overlay, exposed to plugins via `global.components`; keep the props
 * and subcomponents stable.
 *
 * @typedef {object} OverlayProps
 * @prop {Node} anchor
 * @prop {{ top?: number, bottom?: number, left?: number, right?: number }} [offset={}]
 * @prop {string | number} [maxHeight]
 * @prop {string | number} [maxWidth]
 * @prop {string | number} [minHeight]
 * @prop {string | number} [minWidth]
 * @prop {string} [className]
 * @prop {function} [onClose]
 * @prop {boolean} [enableFocusTrap=true] evaluated once at mount time
 * @prop {boolean} [enableEscapeTrap=true]
 * @prop {boolean} [enableGlobalClickTrap=true]
 * @prop {boolean} [enableCloseTrap=true]
 * @prop {boolean} [enableKeyboardTrap=true]
 *
 * @param {OverlayProps} props
 */
export function Overlay(props) {
  const {
    anchor,
    className,
    children,
    id,
    maxHeight,
    maxWidth,
    minHeight,
    minWidth,
    offset = {},
    onClose,
    enableFocusTrap = true,
    enableEscapeTrap = true,
    enableGlobalClickTrap = true,
    enableCloseTrap = true,
    enableKeyboardTrap = true
  } = props;

  if (!anchor) {
    throw new Error('Overlay must receive an `anchor` prop.');
  }

  // the portal renders the content after the first commit
  const [ content, setContent ] = useState(null);

  const [ focusTrapEnabled ] = useState(enableFocusTrap);

  const anchorRef = useMemo(() => ({ current: anchor }), [ anchor ]);

  // loop Tab inside the overlay, as a non-modal popover lets focus leave
  useEffect(() => {
    if (!focusTrapEnabled || !content) {
      return;
    }

    const focusTrap = FocusTrap(() => content);

    focusTrap.mount();

    return () => focusTrap.unmount();
  }, [ content ]);

  const close = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleOpenChange = (open) => {
    if (!open) {
      close();
    }
  };

  const handlePointerDownOutside = (event) => {

    // the anchor toggles the overlay itself
    if (!enableGlobalClickTrap || anchor.contains(event.target)) {
      event.preventDefault();
    }
  };

  const placement = getPlacement(offset);

  const style = {
    ...toCssVariable('--overlay-max-height', maxHeight),
    ...toCssVariable('--overlay-max-width', maxWidth),
    ...toCssVariable('--overlay-min-height', minHeight),
    ...toCssVariable('--overlay-min-width', minWidth)
  };

  const Wrapper = enableKeyboardTrap ? KeyboardInteractionTrap : React.Fragment;

  return (
    <Popover open onOpenChange={ handleOpenChange }>
      <PopoverAnchor virtualRef={ anchorRef } />
      <Wrapper>
        <PopoverContent
          ref={ setContent }
          id={ id }
          className={ classNames(css.Overlay, className) }
          style={ style }
          { ...placement }
          onOpenAutoFocus={ event => !enableFocusTrap && event.preventDefault() }
          onCloseAutoFocus={ event => !enableCloseTrap && event.preventDefault() }
          onEscapeKeyDown={ event => !enableEscapeTrap && event.preventDefault() }
          onPointerDownOutside={ handlePointerDownOutside }
          onFocusOutside={ event => event.preventDefault() }
        >
          { children }
        </PopoverContent>
      </Wrapper>
    </Popover>
  );
}

Overlay.Body = Body;

Overlay.Title = Title;

Overlay.Footer = Footer;


function Title(props) {
  const {
    children,
    className,
    ...rest
  } = props;

  return (
    <PopoverHeader className={ classNames('overlay__header', className) } { ...rest }>
      <PopoverTitle className="overlay__title">
        { children }
      </PopoverTitle>
    </PopoverHeader>
  );
}

function Body(props) {
  const {
    children,
    className,
    ...rest
  } = props;

  return (
    <div className={ classNames('overlay__body', className) } { ...rest }>
      { children }
    </div>
  );
}

function Footer(props) {
  const {
    children,
    className,
    ...rest
  } = props;

  return (
    <div className={ classNames('overlay__footer', className) } { ...rest }>
      { children }
    </div>
  );
}


// helpers //////////

/**
 * Map the offset API to popover placement: above the anchor by default, below
 * it with `offset.top`; left-aligned by default, right-aligned with
 * `offset.right`.
 */
function getPlacement(offset) {
  const below = 'top' in offset;
  const alignRight = 'right' in offset;

  return {
    side: below ? 'bottom' : 'top',
    sideOffset: below ? offset.top : (offset.bottom || DEFAULT_OFFSET.bottom),
    align: alignRight ? 'end' : 'start',
    alignOffset: alignRight ? offset.right : (offset.left || DEFAULT_OFFSET.left)
  };
}

function toCssVariable(name, value) {
  if (!value) {
    return {};
  }

  return {
    [ name ]: isString(value) ? value : `${ value }px`
  };
}
