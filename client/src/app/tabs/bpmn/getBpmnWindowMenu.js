/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import {
  getGridMenuEntries as getGridEntries
} from '../util/grid';


export default function getBpmnWindowMenu(state) {
  return [
    ...getZoomEntries(state),
    ...getSidePanelEntries(state),
    ...getGridEntries(state)
  ];
}

function getZoomEntries({ zoom }) {
  return zoom ? [ {
    label: 'Zoom In',

    // We use Ctrl + = instead of Ctrl + + which works as expected but is shown incorrectly.
    // cf. https://github.com/camunda/camunda-modeler/issues/2286
    accelerator: 'CommandOrControl+=',
    action: 'zoomIn'
  }, {
    label: 'Zoom Out',
    accelerator: 'CommandOrControl+-',
    action: 'zoomOut'
  }, {
    label: 'Zoom to Actual Size',
    accelerator: 'CommandOrControl+0',
    action: 'resetZoom'
  }, {
    label: 'Zoom to Fit Diagram',
    accelerator: 'CommandOrControl+1',
    action: 'zoomFit'
  }, {
    type: 'separator'
  } ] : [];
}

function getSidePanelEntries({ propertiesPanel, variablesPanel }) {
  const entries = [];

  if (propertiesPanel) {
    entries.push({
      label: 'Toggle Properties Panel',
      accelerator: 'CommandOrControl+P',
      action: 'toggleProperties'
    });
  }

  if (variablesPanel) {
    entries.push({
      label: 'Toggle Variables Panel',
      accelerator: 'CommandOrControl+Alt+P',
      action: 'toggleVariables'
    });
  }

  return entries;
}