/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

import classnames from 'classnames';

import './Icon.less';


export default function Icon(props) {

  const {
    className,
    name
  } = props;

  return <span className={ classnames(`app-icon-${name}`, className) }></span>;
}