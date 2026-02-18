/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { forwardRef, useCallback } from 'react';

import { ValueVariable } from '@carbon/icons-react';

import ResizableContainer from './ResizableContainer';

import CloseIcon from '../../../resources/icons/Close.svg';

import * as css from './VariablesPanelContainer.less';

export const MIN_WIDTH = 280;
export const MAX_WIDTH = 380;

export const DEFAULT_OPEN = false;
export const DEFAULT_WIDTH = 280;

export const DEFAULT_LAYOUT = {
  open: DEFAULT_OPEN,
  width: DEFAULT_WIDTH
};

export default forwardRef(function VariablesPanelContainer(props, ref) {
  const {
    layout,
    onLayoutChanged,
    children
  } = props;

  const { variablesPanel = DEFAULT_LAYOUT } = layout;

  const {
    open = DEFAULT_OPEN,
    width = DEFAULT_WIDTH
  } = variablesPanel;

  const onResized = useCallback(({ open, width }) => {
    onLayoutChanged({
      variablesPanel: {
        ...variablesPanel,
        open,
        width
      }
    });
  }, [ onLayoutChanged, variablesPanel ]);

  const onClose = useCallback(() => {
    onLayoutChanged({
      variablesPanel: {
        ...variablesPanel,
        open: false
      }
    });
  }, [ onLayoutChanged, variablesPanel ]);

  return (
    <ResizableContainer
      className={ `${css.VariablesPanelContainer} variables-panel` }
      direction="left"
      open={ open }
      width={ width }
      minWidth={ MIN_WIDTH }
      maxWidth={ MAX_WIDTH }
      onResized={ onResized }
    >
      <div className="variables-panel__header">
        <div className="variables-panel__title">
          <ValueVariable className="variables-panel__title-icon" />
          <span>Variables</span>
        </div>
        <div className="variables-panel__actions">
          <button
            className="variables-panel__action"
            title="Close panel"
            onClick={ onClose }
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      <div className="variables-panel__body">
        { children }
      </div>
    </ResizableContainer>
  );
});
