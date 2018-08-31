import React, { Component } from 'react';

import classNames from 'classnames';

import buttonCss from './Button.less';
import dropdownButtonCss from './DropdownButton.less';


export default class DropdownButton extends Component {

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

  toggle = () => {
    const { disabled } = this.props;

    if (disabled) {
      return;
    }

    const { active } = this.state;

    this.setState({
      active: !active
    });
  }

  close = () => {
    this.setState({
      active: false
    });
  }

  renderDropdown() {
    const { items } = this.props;

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
    } else {
      return (
        <div
          className="dropdown"
          onClick={ this.onDropdownClick }
        >
          { this.props.children }
        </div>
      );
    }

  }

  render() {

    const {
      disabled,
      text,
      className,
      ...rest
    } = this.props;

    const {
      active
    } = this.state;

    return (
      <div ref={ this.ref }
        className={
          classNames(
            dropdownButtonCss.DropdownButton,
            {
              disabled,
              active
            },
            className
          )
        }
        { ...rest }>
        <button className={
          classNames(buttonCss.Button, {
            disabled,
            active
          })
        } onClick={ this.toggle }>
          { text }
          <span className="caret"></span>
        </button>
        {
          active && this.renderDropdown()
        }
      </div>

    );
  }
}