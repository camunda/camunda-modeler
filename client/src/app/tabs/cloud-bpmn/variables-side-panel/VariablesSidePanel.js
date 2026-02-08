/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useCallback } from 'react';

import { ValueVariable } from '@carbon/icons-react';

import classNames from 'classnames';

import VariableOutline from '@bpmn-io/variable-outline';
import '@bpmn-io/variable-outline/dist/style.css';

import ResizableContainer from '../../../resizable-container/ResizableContainer';

import TabCloseIcon from '../../../../../resources/icons/TabClose.svg';

import * as css from './VariablesSidePanel.less';

export const MIN_WIDTH = 280;
export const MAX_WIDTH = 380;

export const DEFAULT_OPEN = false;
export const DEFAULT_WIDTH = 280;

export const DEFAULT_LAYOUT = {
  open: DEFAULT_OPEN,
  width: DEFAULT_WIDTH
};

export default function VariablesSidePanel(props) {
  const {
    injector,
    layout,
    onLayoutChanged
  } = props;

  const { variablesSidePanel = DEFAULT_LAYOUT } = layout;

  const {
    open = DEFAULT_OPEN,
    width = DEFAULT_WIDTH
  } = variablesSidePanel;

  const onResized = useCallback(({ open, width }) => {
    onLayoutChanged({
      variablesSidePanel: {
        ...DEFAULT_LAYOUT,
        ...variablesSidePanel,
        open,
        width
      }
    });
  }, [ onLayoutChanged, variablesSidePanel ]);

  const onClose = useCallback(() => {
    onLayoutChanged({
      variablesSidePanel: {
        ...DEFAULT_LAYOUT,
        ...variablesSidePanel,
        open: false
      }
    });
  }, [ onLayoutChanged, variablesSidePanel ]);

  return (
    <ResizableContainer
      className={ classNames(css.VariablesSidePanel, 'variables-side-panel') }
      direction="left"
      open={ open }
      width={ width }
      minWidth={ MIN_WIDTH }
      maxWidth={ MAX_WIDTH }
      onResized={ onResized }
    >
      <div className="variables-side-panel__header">
        <div className="variables-side-panel__title">
          <ValueVariable className="variables-side-panel__title-icon" />
          <span>Variables</span>
        </div>
        <div className="variables-side-panel__actions">
          <button
            className="variables-side-panel__action"
            title="Close panel"
            onClick={ onClose }
          >
            <TabCloseIcon />
          </button>
        </div>
      </div>

      <div className="variables-side-panel__body">
        <VariableOutline injector={ injector } />
      </div>
    </ResizableContainer>
  );
}
