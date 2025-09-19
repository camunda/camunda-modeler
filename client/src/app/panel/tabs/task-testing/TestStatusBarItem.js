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

import { MagicWandFilled } from '@carbon/icons-react';

import { TAB_ID } from './TaskTestingTab';

import * as css from './TestStatusBarItem.less';

export default function TestStatusBarItem(props) {
  const {
    layout,
    onToggle
  } = props;

  const { panel = {} } = layout;

  return <Fill slot="status-bar__file" group="8_task_testing">
    <button
      className={ classnames(
        css.TestStatusBarItem,
        'btn',
        {
          'btn--active': panel.open && panel.tab === TAB_ID
        }
      ) }
      onClick={ onToggle }
      title="Toggle test view"
    >
      <MagicWandFilled />
    </button>
  </Fill>;
}
