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

import { ValueVariableAlt } from '@carbon/icons-react';

import classNames from 'classnames';

import { Fill } from '../../../slot-fill';

import { DEFAULT_LAYOUT } from './VariablesSidePanel';

export default function VariablesStatusBarItem(props) {
  const {
    layout,
    onLayoutChanged
  } = props;

  const { variablesSidePanel = DEFAULT_LAYOUT } = layout;

  const onClick = () => {
    onLayoutChanged({
      variablesSidePanel: {
        ...DEFAULT_LAYOUT,
        ...variablesSidePanel,
        open: !variablesSidePanel.open
      }
    });
  };

  return <Fill slot="tab-actions" priority={ 3 }>
    <button
      className={ classNames(
        'btn--tab-action',
        { 'btn--active': variablesSidePanel.open }
      ) }
      onClick={ onClick }
      title="Variables"
    >
      <ValueVariableAlt />
    </button>
  </Fill>;
}
