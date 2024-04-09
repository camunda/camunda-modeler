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
import {
  Slot
} from '../slot-fill';
import * as css from './StatusBar.less';


export function StatusBar(props) {
  return (
    <footer className={ css.StatusBar }>
      <div className="status-bar__file">
        <Slot name="status-bar__file" />
      </div>
      <div className="status-bar__app">
        <Slot name="status-bar__app" />
      </div>
    </footer>
  );
}
