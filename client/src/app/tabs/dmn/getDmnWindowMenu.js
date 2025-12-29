/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export default function getBpmnWindowMenu(state) {
  return [
    ...getZoomEntries(state),
    ...getPropertiesPanelEntries(state),
    ...getGridEntries(state),
    ...getOverviewEntries(state)
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

function getPropertiesPanelEntries({ propertiesPanel }) {
  return propertiesPanel ? [ {
    label: 'Toggle Properties Panel',
    accelerator: 'CommandOrControl+P',
    action: 'toggleProperties'
  } ] : [];
}

function getOverviewEntries({ overview }) {
  return overview ? [ {
    label: 'Toggle Overview',
    accelerator: 'CommandOrControl+P',
    action: 'toggleOverview'
  }, {
    label: 'Reset Overview',
    accelerator: 'CommandOrControl+Shift+P',
    action: 'resetOverview'
  } ] : [];
}

function getGridEntries({ grid }) {
  return grid ? [ {
    label: 'Toggle Grid',
    accelerator: 'CommandOrControl+G',
    action: 'toggleGrid'
  } ] : [];
}
