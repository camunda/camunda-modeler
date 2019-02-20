/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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