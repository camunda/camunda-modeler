/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

import classNames from 'classnames';

import css from './Tabbed.less';


export default function TabContainer(props) {

  return (
    <div className={ classNames(css.TabContainer, props.className) }>
      { props.children }
    </div>
  );
}