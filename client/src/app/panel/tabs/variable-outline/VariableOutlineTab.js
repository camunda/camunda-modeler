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

import VariableOutline from '@bpmn-io/variable-outline';
import '@bpmn-io/variable-outline/dist/style.css';
import './VariableOutlineTab.less';

import { Fill } from '../../../slot-fill';

import VariableOutlineStatusBarItem from './VariableOutlineStatusBarItem';

export default function VariableTab(props) {
  const {
    layout = {},
    injector,
    id,
    onAction
  } = props;

  const onToggle = () => {
    const { panel = {} } = layout;

    if (!panel.open || panel.tab !== 'variable-outline') {
      onAction('open-panel', { tab: 'variable-outline' });
    } else if (panel.tab === 'variable-outline') {
      onAction('close-panel');
    }
  };

  return <>
    <Fill slot="sidePanel.variables"
      id="variable-outline"
      label="Variables"
      layout={ layout }
      priority={ 5 }>
      <div className="cds--g10" style={ { height: '100%' } }>
        <VariableOutline injector={ injector } key={ id } />
      </div>
    </Fill>

    {/* <VariableOutlineStatusBarItem
      layout={ layout }
      onToggle={ onToggle } /> */}
  </>;
}
