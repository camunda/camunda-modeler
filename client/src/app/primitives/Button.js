import React, { Component } from 'react';

import classNames from 'classnames';

import css from './Button.less';


export default class Button extends Component {

  render() {

    const {
      disabled,
      className,
      ...rest
    } = this.props;

    return (
      <button className={
        classNames(css.Button, {
          disabled
        }, className)
      } { ...rest } />
    );
  }
}