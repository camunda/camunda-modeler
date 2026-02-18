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

import { ValueVariable } from '@carbon/icons-react';

export default function VariableOutlineStatusBarItem(props) {
  const {
    onToggle,
    layout
  } = props;

  const { variablesPanel = {} } = layout;

  return <Fill slot="status-bar__app" group="7_1_side_panel_variables">
    <button
      className={ classnames(
        'btn',
        { 'btn--active': variablesPanel.open }
      ) }
      onClick={ onToggle }
      title="Variables"
    >
      <ValueVariable />
    </button>
  </Fill>;
}
