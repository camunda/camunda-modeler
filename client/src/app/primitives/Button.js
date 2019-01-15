import React, { PureComponent } from 'react';

import classNames from 'classnames';

import css from './Button.less';


export default class Button extends PureComponent {

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