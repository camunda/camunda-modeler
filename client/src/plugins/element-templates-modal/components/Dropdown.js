/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { PureComponent } from 'react';

import classNames from 'classnames';

import CaretDownIcon from '../icons/CaretDown.svg';
import CaretUpIcon from '../icons/CaretUp.svg';

import css from './Dropdown.less';

export default class Dropdown extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      open: false
    };

    this.buttonRef = React.createRef();
    this.menuRef = React.createRef();
  }

  onGlobalMousedown = ignoreEvent => {
    const _onGlobalMousedown = event => {
      if (event === ignoreEvent) {
        return;
      }

      if (!this.menuRef.current) {
        document.removeEventListener('mousedown', _onGlobalMousedown);

        return;
      }

      const { target } = event;

      if (target !== this.buttonRef.current
          && !this.buttonRef.current.contains(target)
          && target !== this.menuRef.current
          && !this.menuRef.current.contains(target)) {
        this.setState({
          open: false
        });

        document.removeEventListener('mousedown', _onGlobalMousedown);
      }
    };

    return _onGlobalMousedown;
  }

  toggleOpen = (event) => {
    const { open } = this.state;

    this.setState({
      open: !open
    });

    document.addEventListener('mousedown', this.onGlobalMousedown(event));
  }

  clearTags = () => {
    const { onChange } = this.props;

    onChange([]);
  }

  toggleTag = tag => {
    const {
      onChange,
      tagsSelected
    } = this.props;

    if (tagsSelected.includes(tag)) {
      onChange(tagsSelected.filter(t => t !== tag));
    } else {
      onChange([
        ...tagsSelected,
        tag
      ]);
    }
  }

  render() {
    const {
      className,
      tagCounts,
      tagsSelected
    } = this.props;

    const { open } = this.state;

    let buttonText = 'Filter by Project';

    if (tagsSelected.length === 1) {
      buttonText = 'Filtered by 1 Project';
    } else if (tagsSelected.length > 1) {
      buttonText = `Filtered by ${ tagsSelected.length } Projects`;
    }

    return (
      <div className={ classNames(css.Dropdown, className) }>
        <button
          ref={ this.buttonRef }
          className={ classNames('dropdown__button', { 'dropdown__button--open': open || tagsSelected.length }) }
          onClick={ this.toggleOpen }>
          <span className="dropdown__button-text">
            { buttonText }
          </span>
          <span className="dropdown__button-caret">
            {
              open
                ? <CaretUpIcon width="10" height="10" />
                : <CaretDownIcon width="10" height="10" />
            }
          </span>
        </button>
        {
          open && (
            <ul className="dropdown__menu" ref={ this.menuRef }>
              <li
                className="dropdown__menu-item dropdown__menu-item--clear"
                key="__clear"
                disabled={ !tagsSelected.length }
                onClick={ this.clearTags }
              >
                Clear all
              </li>
              {
                Object.entries(tagCounts).map(([ tag, count ]) => {
                  return (
                    <li
                      className={ classNames('dropdown__menu-item', { 'dropdown__menu-item--selected': tagsSelected.includes(tag) }) }
                      key={ tag }
                      onClick={ () => this.toggleTag(tag) }>
                      <span className="dropdown__menu-item-name">{ tag }</span>
                      <span className="dropdown__menu-item-count">{ count }</span>
                    </li>
                  );
                })
              }
            </ul>
          )
        }
      </div>
    );
  }
}