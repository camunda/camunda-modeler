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

export default function VariableOutlineStatusBarItem(props) {
  const {
    onToggle,
    layout
  } = props;

  const { panel = {} } = layout;

  return <Fill slot="status-bar__file" group="9_variables">
    <button
      className={ classnames(
        'btn',
        { 'btn--active': panel.open && panel.tab === 'variable-outline' }
      ) }
      onClick={ onToggle }
    > Variables </button>
  </Fill>;
}
