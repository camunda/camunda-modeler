/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useState } from 'react';
import classNames from 'classnames';

import { map } from 'min-dash';

import { Overlay, Section } from '..';

import * as css from './OverlayDropdown.less';

const LIST_ITEM_SELECTOR = 'li[role="menuitem"]';

/**
 * @typedef {{ text: String, onClick: Function, icon?: React.Component }} Item
 */

/**
 * @typedef {{ key: String, label: String, items: Array<Item>, maxHeight: Number | String }} ItemGroup
 */


/**
 * Dropdown displayed as an overlay.
 * @param {Object} props
 * @param {Node} props.buttonRef
 * @param {React.ReactChildren} props.children
 * @param {String} [props.className]
 * @param {Array<Item> | Array<ItemGroup>} props.items
 * @param {Function} [props.onClose]
 * @param {Object} [props.overlayConfig]
 * @param {Boolean} [props.overlayState]
 */
export function OverlayDropdown(props) {
  const {
    buttonRef,
    children,
    className = '',
    items,
    onClose,
    shouldOpen,
    overlayConfig,
    overlayState,
    ...restProps
  } = props;

  const [ open, setOpen ] = useState(false);

  React.useEffect(() => {
    setOpen(shouldOpen);
  }, [ shouldOpen ]);

  const toggle = () => {
    if (!overlayState) {
      setOpen(open => !open);
    } else {
      onClose();
    }
  };

  const close = () => {
    setOpen(false);
    onClose && onClose();
  };

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
        <Overlay
          { ...overlayConfig }
          className={ css.OverlayDropdown }
          onClose={ close }
          anchor={ buttonRef.current }>
          {
            isGrouped(items) ? (
              map(items, (group) =>
                <OptionGroup
                  key={ group.key }
                  label={ group.label }
                  items={ group.items }
                  labelSuffix={ group.labelSuffix }
                  maxHeight={ group.maxHeight }
                  onSelect={ onSelect } />
              )
            ) : (
              <Section>
                <Options items={ items } onSelect={ onSelect } />
              </Section>
            )
          }
        </Overlay>
      ) }
    </React.Fragment>
  );
}

function OptionGroup(props) {
  const {
    items,
    label,
    labelSuffix,
    maxHeight,
    onSelect
  } = props;

  return (
    <Section maxHeight={ maxHeight }>
      { label ?
        (
          <Section.Header>
            { label }{ labelSuffix }
          </Section.Header>
        ) : null
      }
      <Options items={ items } onSelect={ onSelect }></Options>
    </Section>
  );
}

function Options(props) {
  const { items, onSelect } = props;

  return (
    <Section.Body>
      <ul role="menu">
        {
          items.map((item, index) =>
            <Option
              key={ index }
              icon={ item.icon }
              text={ item.text }
              onClick={ () => onSelect(item) } />
          )
        }
      </ul>
    </Section.Body>
  );
}

function Option(props) {
  const {
    onClick,
    text,
    icon: IconComponent
  } = props;

  const handleKeydown = (event) => {
    const {
      key,
      keyCode,
      currentTarget
    } = event;

    if (key === 'ArrowDown' || keyCode == 40) {
      focusNext(currentTarget);
    } else if (key === 'ArrowUp' || keyCode == 38) {
      focusPrevious(currentTarget);
    }
  };

  return (
    <li role="menuitem" onKeyDown={ handleKeydown }>
      <button type="button" title={ text } onClick={ onClick }>
        { IconComponent && <IconComponent /> }
        { text }
      </button>
    </li>
  );
}


// helper ///////////

function isGrouped(items) {
  return items.length && items[0].key;
}

/**
 *
 * @param {Node} focusElement
 */
function focusNext(focusElement) {
  const { nextSibling } = focusElement;

  // (1) focus immediate neighbor
  if (nextSibling) {
    return nextSibling.querySelector('button').focus();
  }

  // (2) try to find neighbor in other section
  const currenSection = focusElement.closest('section');
  const { nextElementSibling: nextSection } = currenSection;

  if (nextSection) {
    return nextSection.querySelector(`${LIST_ITEM_SELECTOR} button`).focus();
  }

  // (3) when on end of sections, try first one
  const parentContainer = focusElement.closest('[role="dialog"]');

  const lastSection = parentContainer.querySelector('section:last-child');
  const firstSection = parentContainer.querySelector('section:first-child');

  if (currenSection === lastSection) {
    return firstSection.querySelector(`${LIST_ITEM_SELECTOR} button`).focus();
  }
}

/**
 *
 * @param {Node} focusElement
 */
function focusPrevious(focusElement) {
  const { previousSibling } = focusElement;

  // (1) focus immediate neighbor
  if (previousSibling) {
    return previousSibling.querySelector('button').focus();
  }

  // (2) try to find neighbor in other section
  const currenSection = focusElement.closest('section');
  const { previousElementSibling: previousSection } = currenSection;

  if (previousSection) {
    return previousSection.querySelector(`${LIST_ITEM_SELECTOR}:last-child button`).focus();
  }

  // (3) when on start of sections, try last one
  const parentContainer = focusElement.closest('[role="dialog"]');

  const lastSection = parentContainer.querySelector('section:last-child');
  const firstSection = parentContainer.querySelector('section:first-child');

  if (currenSection === firstSection) {
    return lastSection.querySelector(`${LIST_ITEM_SELECTOR}:last-child button`).focus();
  }
}
