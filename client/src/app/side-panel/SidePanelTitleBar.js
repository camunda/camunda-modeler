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

import TabCloseIcon from '../../../resources/icons/TabClose.svg';

import * as css from './SidePanelTitleBar.less';


export default function SidePanelTitleBar({ title, onClose }) {
  return (
    <div className={ css.SidePanelTitleBar }>
      <div className="side-panel-title-bar__title">
        <span>{ title }</span>
      </div>
      { onClose && (
        <div className="side-panel-title-bar__actions">
          <button
            className="side-panel-title-bar__action"
            title="Close panel"
            onClick={ onClose }
          >
            <TabCloseIcon />
          </button>
        </div>
      ) }
    </div>
  );
}
