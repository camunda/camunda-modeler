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

import { IconButton } from '@carbon/react';
import { ValueVariableAlt } from '@carbon/icons-react';

import { Fill } from '../../../slot-fill';

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
    <IconButton
      className="btn--tab-action"
      kind="ghost"
      size="sm"
      isSelected={ isActive }
      label="Variables"
      onClick={ onClick }
    >
      <ValueVariableAlt />
    </IconButton>
  </Fill>;
}
