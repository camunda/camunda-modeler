import React, { Component } from 'react';

import classNames from 'classnames';

import style from './Button.less';


export default class Button extends Component {

  render() {

    const {
      disabled,
      primary,
      className,
      ...rest
    } = this.props;

    return (
      <button className={
        classNames(style.Button, {
          disabled,
          primary
        }, className)
      } { ...rest } />
    );
  }
}