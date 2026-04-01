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

import classNames from 'classnames';

import VariableOutline from '@bpmn-io/variable-outline';
import '@bpmn-io/variable-outline/dist/variable-outline.css';

import { utmTag } from '../../../../util/utmTag';
import ResizableContainer from '../../../resizable-container/ResizableContainer';
import SidePanelTitleBar from '../../../side-panel/SidePanelTitleBar';

import * as css from './VariablesSidePanel.less';

const DOCUMENTATION_URL = utmTag('https://docs.camunda.io/docs/components/modeler/desktop-modeler/variables/');

export const MIN_WIDTH = 280;
export const MAX_WIDTH = MIN_WIDTH * 3;

export const DEFAULT_OPEN = true;
export const DEFAULT_WIDTH = MIN_WIDTH;

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
      <SidePanelTitleBar title="Variables" onClose={ onClose } />

      <div className="variables-side-panel__body">
        <VariableOutline
          injector={ injector }
          learnMoreUrl={ DOCUMENTATION_URL }
        />
      </div>
    </ResizableContainer>
  );
}
