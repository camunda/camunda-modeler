export default function getBpmnWindowMenu(state) {
  return [
    ...getZoomEntries(state),
    ...getPropertiesPanelEntries(state)
  ];
}

function getZoomEntries({ zoom }) {
  return zoom ? [{
    label: 'Zoom In',
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
  }] : [];
}

function getPropertiesPanelEntries({ propertiesPanel }) {
  return propertiesPanel ? [{
    label: 'Toggle Properties Panel',
    accelerator: 'CommandOrControl+P',
    action: 'toggleProperties'
  }, {
    label: 'Reset Properties Panel',
    accelerator: 'CommandOrControl+Shift+P',
    action: 'resetProperties'
  }] : [];
}
