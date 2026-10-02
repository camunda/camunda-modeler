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

import { IconButton } from '@camunda/design-system';

import { X } from '@camunda/design-system/icons';

import * as css from './SidePanelTitleBar.css';


export default function SidePanelTitleBar({ title, onClose }) {
  return (
    <div className={ css.SidePanelTitleBar }>
      <div className="side-panel-title-bar__title">
        <span>{ title }</span>
      </div>
      { onClose && (
        <IconButton variant="ghost" size="sm" label="Close panel" icon={ X } onClick={ onClose } />
      ) }
    </div>
  );
}
