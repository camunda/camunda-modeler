/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useCallback, useState } from 'react';

import {
  Slot
} from '../slot-fill';

import { PanelToggleHint } from './PanelToggleHint';

import * as css from './TabActions.less';


export function TabActions(props) {

  const { activeTab, config } = props;

  const [ anchor, setAnchor ] = useState(null);

  const anchorRef = useCallback(node => {
    setAnchor(node);
  }, []);

  return (
    <div className={ css.TabActions } ref={ anchorRef }>
      <Slot name="tab-actions" />
      <PanelToggleHint activeTab={ activeTab } anchor={ anchor } config={ config } />
    </div>
  );
}
