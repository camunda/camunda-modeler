/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';

import classnames from 'classnames';

import { Fill } from '../../../slot-fill';

import Icon from '../../../../../resources/icons/Chemistry.svg';

import * as css from './TestStatusBarItem.less';


export default function TestStatusBarItem(props) {
  const {
    layout,
    onToggle
  } = props;

  const { panel = {} } = layout;

  return <Fill slot="status-bar__file" group="9_aaa_test">
    <button
      className={ classnames(
        css.TestStatusBarItem,
        'btn',
        {
          'btn--active': panel.open && panel.tab === 'test'
        }
      ) }
      onClick={ onToggle }
      title="Toggle test view"
    >
      <Icon width="16" height="16" viewBox="0 0 32 32" />
    </button>
  </Fill>;
}
