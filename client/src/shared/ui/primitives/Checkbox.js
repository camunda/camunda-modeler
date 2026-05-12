/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useRef } from 'react';

import './checkbox.css';

/**
 * @param {object} props
 * @param {boolean} [props.checked]
 * @param {boolean} [props.indeterminate]
 * @param {boolean} [props.disabled]
 * @param {string} [props.label]
 * @param {string} [props.id]
 * @param {string} [props.className]
 * @param {function} [props.onChange]
 */
export default function Checkbox({
  checked = false,
  indeterminate = false,
  disabled = false,
  label,
  id,
  className,
  onChange,
  ...rest
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [ indeterminate ]);

  return (
    <label className={ `cm-checkbox${disabled ? ' cm-checkbox--disabled' : ''}${className ? ` ${className}` : ''}` }>
      <input
        ref={ inputRef }
        type="checkbox"
        className="cm-checkbox__input"
        checked={ checked }
        disabled={ disabled }
        id={ id }
        onChange={ onChange }
        { ...rest }
      />
      <span className="cm-checkbox__box">
        { checked && !indeterminate && (
          <svg viewBox="0 0 16 16" fill="none" className="cm-checkbox__icon">
            <path d="M3.5 8L6.5 11L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) }
        { indeterminate && (
          <svg viewBox="0 0 16 16" fill="none" className="cm-checkbox__icon">
            <path d="M4 8H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) }
      </span>
      { label && <span className="cm-checkbox__label">{ label }</span> }
    </label>
  );
}
