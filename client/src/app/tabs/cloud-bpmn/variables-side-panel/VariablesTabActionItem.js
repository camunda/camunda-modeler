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

import { Variable } from '@camunda/design-system/icons';

import { Fill } from '../../../slot-fill';

import TabActionToggle from '../../../tab-actions/TabActionToggle';

import { DEFAULT_LAYOUT } from './VariablesSidePanel';

export default function VariablesTabActionItem(props) {
  const {
    layout,
    onLayoutChanged
  } = props;

  const { variablesSidePanel = DEFAULT_LAYOUT } = layout;

  const isActive = variablesSidePanel.open;

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
    <TabActionToggle
      label="Variables"
      icon={ Variable }
      pressed={ isActive }
      onClick={ onClick }
    />
  </Fill>;
}
