/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

import classNames from 'classnames';

import './ComboBox.css';


export default function ComboBox(props) {
  const {
    className,
    id,
    onChange,
    options = [],
    value = '',
    ...restProps
  } = props;

  const generatedId = useId();
  const listboxId = `${ id || generatedId }-listbox`;
  const rootRef = useRef();
  const listboxRef = useRef();
  const [ open, setOpen ] = useState(false);
  const [ activeIndex, setActiveIndex ] = useState(-1);
  const [ query, setQuery ] = useState('');
  const [ listboxLayout, setListboxLayout ] = useState({
    openAbove: false,
    maxHeight: 180
  });

  const filteredOptions = options.filter(option => {
    return option.toLowerCase().includes(query.toLowerCase());
  });
  const expanded = open && filteredOptions.length > 0;

  useLayoutEffect(() => {
    if (!expanded) {
      return;
    }

    const updateLayout = () => {
      const bounds = getClippingBounds(rootRef.current);
      const rootBounds = rootRef.current.getBoundingClientRect();
      const spaceAbove = rootBounds.top - bounds.top - 2;
      const spaceBelow = bounds.bottom - rootBounds.bottom - 2;
      const preferredHeight = Math.min(listboxRef.current.scrollHeight, 180);
      const openAbove = spaceBelow < preferredHeight && spaceAbove > spaceBelow;

      setListboxLayout({
        openAbove,
        maxHeight: Math.max(0, Math.min(180, openAbove ? spaceAbove : spaceBelow))
      });
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    document.addEventListener('scroll', updateLayout, true);

    return () => {
      window.removeEventListener('resize', updateLayout);
      document.removeEventListener('scroll', updateLayout, true);
    };
  }, [ expanded, filteredOptions.length ]);

  useEffect(() => {
    const handlePointerDown = event => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setActiveIndex(-1);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const selectOption = option => {
    onChange(option);
    setOpen(false);
    setActiveIndex(-1);
    setQuery('');
  };

  const handleKeyDown = event => {
    if (event.key === 'Escape' && expanded) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      setActiveIndex(-1);
      setQuery('');
    } else if (event.key === 'ArrowDown' && filteredOptions.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(index => Math.min(index + 1, filteredOptions.length - 1));
    } else if (event.key === 'ArrowUp' && filteredOptions.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(index => index <= 0 ? filteredOptions.length - 1 : index - 1);
    } else if (event.key === 'Enter' && open && activeIndex >= 0) {
      event.preventDefault();
      selectOption(filteredOptions[activeIndex]);
    }
  };

  return (
    <div className={ classNames('form-combobox', className) } ref={ rootRef }>
      <div className="form-combobox-control">
        <input
          { ...restProps }
          id={ id }
          className="form-control"
          type="text"
          role="combobox"
          value={ value }
          aria-autocomplete="list"
          aria-controls={ listboxId }
          aria-expanded={ expanded }
          aria-activedescendant={ activeIndex >= 0 ? `${ listboxId }-option-${ activeIndex }` : undefined }
          onChange={ event => {
            onChange(event.target.value);
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          } }
          onFocus={ () => {
            setQuery('');
            setOpen(true);
            setActiveIndex(-1);
          } }
          onClick={ () => {
            setQuery('');
            setOpen(true);
            setActiveIndex(-1);
          } }
          onBlur={ () => {
            setOpen(false);
            setActiveIndex(-1);
            setQuery('');
          } }
          onKeyDown={ handleKeyDown }
        />
      </div>
      { expanded && (
        <ul
          className={ classNames('form-combobox-options', {
            'open-above': listboxLayout.openAbove
          }) }
          id={ listboxId }
          ref={ listboxRef }
          role="listbox"
          style={ { maxHeight: listboxLayout.maxHeight } }
        >
          { filteredOptions.map((option, index) => (
            <li
              className={ classNames('form-combobox-option', {
                active: index === activeIndex
              }) }
              id={ `${ listboxId }-option-${ index }` }
              key={ option }
              role="option"
              aria-selected={ option === value }
              onMouseDown={ event => event.preventDefault() }
              onClick={ () => selectOption(option) }
            >
              { option }
            </li>
          )) }
        </ul>
      ) }
    </div>
  );
}


function getClippingBounds(element) {
  const bounds = {
    top: 0,
    bottom: window.innerHeight
  };

  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    const style = window.getComputedStyle(parent);

    if (/(auto|clip|hidden|scroll)/.test(`${ style.overflow } ${ style.overflowY }`)) {
      const parentBounds = parent.getBoundingClientRect();

      bounds.top = Math.max(bounds.top, parentBounds.top);
      bounds.bottom = Math.min(bounds.bottom, parentBounds.bottom);
    }
  }

  return bounds;
}