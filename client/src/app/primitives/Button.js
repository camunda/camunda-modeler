import React, { Component } from 'react';

import classNames from 'classnames';

import {
  Base,
  Disabled,
  Primary,
} from './Button.css';


export default class Button extends Component {

  render() {

    const {
      disabled,
      primary,
      ...rest
    } = this.props;

    return (
      <button className={
        classNames(Base, {
          [Disabled]: disabled,
          [Primary]: primary
        })
      } { ...rest } />
    );
  }
}