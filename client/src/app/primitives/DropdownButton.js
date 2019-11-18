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

import buttonCss from './Button.less';
import dropdownButtonCss from './DropdownButton.less';


export default class DropdownButton extends PureComponent {

  constructor(props, context) {
    super(props, context);

    this.state = {
      active: false
    };

    this.ref = React.createRef();
  }

  componentDidMount() {
    document.addEventListener('click', this.onGlobalClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onGlobalClick);
  }

  onGlobalClick = ({ target }) => {
    const node = this.ref.current;

    if (!node) {
      return;
    }

    if (node === target) {
      return;
    }

    if (node.contains(target)) {
      return;
    }

    this.close();
  }

  onItemClick = item => {
    if (typeof item.onClick === 'function') {
      item.onClick();
    }
  }

  onDropdownClick = () => {
    const {
      closeOnClick
    } = this.props;

    if (closeOnClick !== false) {
      this.close();
    }
  }

  toggle = (event) => {

    const { disabled } = this.props;

    event.preventDefault();
    event.stopPropagation();

    if (disabled) {
      return;
    }

    const { active } = this.state;

    this.setState({
      active: disabled || !active
    });
  }

  handleClick = (event) => {

    const {
      onClick,
      disabled
    } = this.props;

    event.preventDefault();
    event.stopPropagation();

    if (onClick) {
      this.setState({
        active: false
      });

      if (!disabled) {
        return onClick(event);
      }
    } else {
      this.toggle(event);
    }
  }

  close = () => {
    this.setState({
      active: false
    });
  }

  renderDropdown(items) {

    if (typeof items === 'function') {
      return (
        <div
          className="dropdown"
          onClick={ this.onDropdownClick }
        >
          { items() }
        </div>
      );
    }

    if (items && items.length) {
      return (
        <ul className="dropdown">
          {
            items.map((item, index) => {
              return (
                <li
                  key={ index }
                  className="item"
                  onClick={ () => {
                    this.onItemClick(item);
                    this.onDropdownClick();
                  } }>
                  { item.text }
                </li>
              );
            })
          }
        </ul>
      );
    }

    return null;
  }

  render() {

    const {
      disabled,
      multiButton,
      text,
      className,
      items,
      children,
      onClick,
      closeOnClick, // eslint-disable-line
      title,
      ...rest
    } = this.props;

    const {
      active
    } = this.state;

    return (
      <div
        ref={ this.ref }
        className={
          classNames(
            dropdownButtonCss.DropdownButton,
            {
              disabled,
              active,
              'multi-button': multiButton
            },
            className
          )
        }
        { ...rest }
      >
        <button
          className={
            classNames(buttonCss.Button, {
              disabled,
              active
            })
          }
          title={ title }
          onClick={ this.handleClick }
        >
          { text || children }
          <span
            className="dropdown-opener"
            onClick={ this.toggle }
            title={ title ? `${title} options` : 'Show options' }
          >
            <span className="caret"></span>
          </span>
        </button>
        {
          active && this.renderDropdown(items)
        }
      </div>

    );
  }
}
