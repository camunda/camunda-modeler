/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  useFloating,
  offset,
  flip,
  shift,
  size,
  autoUpdate
} from '@floating-ui/react-dom';

import './select.css';


/**
 * @param {object} props
 * @param {string} [props.value] - Currently selected value
 * @param {function} [props.onChange] - Called with new value
 * @param {Array<{value: string, label: string, disabled?: boolean}>} props.options
 * @param {string} [props.placeholder]
 * @param {boolean} [props.disabled]
 * @param {string} [props.className]
 * @param {string} [props.id]
 */
export default function Select({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  disabled = false,
  className,
  id,
  ...rest
}) {
  const [ open, setOpen ] = useState(false);
  const [ highlightedIndex, setHighlightedIndex ] = useState(-1);
  const triggerRef = useRef(null);
  const listRef = useRef(null);

  const { refs, floatingStyles } = useFloating({
    open,
    placement: 'bottom-start',
    middleware: [
      offset(4),
      flip(),
      shift({ padding: 8 }),
      size({
        apply({ availableHeight, rects, elements }) {
          elements.floating.style.maxHeight = `${Math.min(availableHeight - 8, 300)}px`;
          elements.floating.style.width = `${rects.reference.width}px`;
        }
      })
    ],
    whileElementsMounted: autoUpdate
  });

  const enabledOptions = useMemo(
    () => options.filter(o => !o.disabled),
    [ options ]
  );

  const selectedOption = options.find(o => o.value === value);

  const openDropdown = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    const idx = enabledOptions.findIndex(o => o.value === value);
    setHighlightedIndex(idx >= 0 ? idx : 0);
  }, [ disabled, enabledOptions, value ]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setHighlightedIndex(-1);
    triggerRef.current?.focus();
  }, []);

  const selectOption = useCallback((option) => {
    if (option.disabled) return;
    onChange?.(option.value);
    closeDropdown();
  }, [ onChange, closeDropdown ]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e) => {
      if (
        !triggerRef.current?.contains(e.target) &&
        !listRef.current?.contains(e.target)
      ) {
        closeDropdown();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [ open, closeDropdown ]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (!open || highlightedIndex < 0) return;

    const list = listRef.current;
    if (!list) return;

    const items = list.querySelectorAll('[role="option"]:not([aria-disabled="true"])');
    items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [ open, highlightedIndex ]);

  const onTriggerKeyDown = useCallback((e) => {
    if (disabled) return;

    switch (e.key) {
    case 'Enter':
    case ' ':
    case 'ArrowDown':
      e.preventDefault();
      openDropdown();
      break;
    case 'ArrowUp':
      e.preventDefault();
      openDropdown();
      break;
    }
  }, [ disabled, openDropdown ]);

  const onListKeyDown = useCallback((e) => {
    switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      setHighlightedIndex(i =>
        i < enabledOptions.length - 1 ? i + 1 : 0
      );
      break;
    case 'ArrowUp':
      e.preventDefault();
      setHighlightedIndex(i =>
        i > 0 ? i - 1 : enabledOptions.length - 1
      );
      break;
    case 'Home':
      e.preventDefault();
      setHighlightedIndex(0);
      break;
    case 'End':
      e.preventDefault();
      setHighlightedIndex(enabledOptions.length - 1);
      break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      if (highlightedIndex >= 0) {
        selectOption(enabledOptions[highlightedIndex]);
      }
      break;
    case 'Escape':
      e.preventDefault();
      closeDropdown();
      break;
    case 'Tab':
      closeDropdown();
      break;
    default:
      // Type-ahead: jump to first option starting with typed char
      if (e.key.length === 1) {
        const char = e.key.toLowerCase();
        const idx = enabledOptions.findIndex(
          o => o.label.toLowerCase().startsWith(char)
        );
        if (idx >= 0) {
          setHighlightedIndex(idx);
        }
      }
    }
  }, [ enabledOptions, highlightedIndex, selectOption, closeDropdown ]);

  const highlightedValue = highlightedIndex >= 0
    ? enabledOptions[highlightedIndex]?.value
    : undefined;

  return (
    <div className={ `cm-select${className ? ` ${className}` : ''}` } { ...rest }>
      <button
        ref={ (node) => {
          triggerRef.current = node;
          refs.setReference(node);
        } }
        type="button"
        role="combobox"
        id={ id }
        aria-expanded={ open }
        aria-haspopup="listbox"
        aria-activedescendant={ highlightedValue ? `cm-select-option-${highlightedValue}` : undefined }
        className={ `cm-select__trigger${disabled ? ' cm-select__trigger--disabled' : ''}` }
        disabled={ disabled }
        onClick={ () => open ? closeDropdown() : openDropdown() }
        onKeyDown={ onTriggerKeyDown }
      >
        <span className="cm-select__value">
          { selectedOption ? selectedOption.label : (
            <span className="cm-select__placeholder">{ placeholder }</span>
          ) }
        </span>
        <svg className="cm-select__chevron" viewBox="0 0 16 16" fill="none">
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      { open && (
        <div
          ref={ (node) => {
            listRef.current = node;
            refs.setFloating(node);
          } }
          role="listbox"
          className="cm-select__dropdown"
          style={ floatingStyles }
          onKeyDown={ onListKeyDown }
          tabIndex={ -1 }
        >
          {
            options.map((option) => {
              const isHighlighted = option.value === highlightedValue;
              const isSelected = option.value === value;

              return (
                <div
                  key={ option.value }
                  id={ `cm-select-option-${option.value}` }
                  role="option"
                  aria-selected={ isSelected }
                  aria-disabled={ option.disabled || undefined }
                  className={
                    'cm-select__option' +
                    (isHighlighted ? ' cm-select__option--highlighted' : '') +
                    (isSelected ? ' cm-select__option--selected' : '') +
                    (option.disabled ? ' cm-select__option--disabled' : '')
                  }
                  onPointerDown={ (e) => {
                    e.preventDefault();
                    if (!option.disabled) {
                      selectOption(option);
                    }
                  } }
                  onPointerMove={ () => {
                    if (!option.disabled) {
                      const idx = enabledOptions.findIndex(o => o.value === option.value);
                      if (idx >= 0) setHighlightedIndex(idx);
                    }
                  } }
                >
                  <span>{ option.label }</span>
                  { isSelected && (
                    <svg className="cm-select__check" viewBox="0 0 16 16" fill="none">
                      <path d="M3.5 8L6.5 11L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) }
                </div>
              );
            })
          }
        </div>
      ) }
    </div>
  );
}
