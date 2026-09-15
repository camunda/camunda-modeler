/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useId, useRef, useState } from 'react';

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
  const [ open, setOpen ] = useState(false);
  const [ activeIndex, setActiveIndex ] = useState(-1);
  const [ query, setQuery ] = useState('');

  const filteredOptions = options.filter(option => {
    return option.toLowerCase().includes(query.toLowerCase());
  });

  useEffect(() => {
    const handlePointerDown = event => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
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
    if (event.key === 'Escape') {
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
          aria-expanded={ open }
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
          } }
          onClick={ () => {
            setQuery('');
            setOpen(true);
          } }
          onKeyDown={ handleKeyDown }
        />
      </div>
      { open && filteredOptions.length > 0 && (
        <ul className="form-combobox-options" id={ listboxId } role="listbox">
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