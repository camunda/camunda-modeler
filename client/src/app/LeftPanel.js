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

import { Slot } from './slot-fill';

import * as css from './LeftPanel.less';

export default function LeftPanel(props) {
  return (
    <aside className={ css.LeftPanel }>
      <div className="nav">
        <Slot name="left-panel_nav" />
      </div>
      <div className="content">
        <Slot name="left-panel_content" />
      </div>
      {
        props.children
      }
    </aside>
  );
}

