/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const ZEEBE_PROVIDER_KEY = 'zeebe';
const DESIGN_PROVIDER_KEY = 'design';


function ToggleExecutionProperties(editorActions, eventBus) {

  this.setEnabled(false);

  // we have to do this because we don't have a simple solution
  // to remove a provider for now
  const disableZeebeProvider = (event) => {
    if (!this.isEnabled()) {
      event.providers = event.providers.filter(p => p.key !== ZEEBE_PROVIDER_KEY);
    } else {
      event.providers = event.providers.filter(p => p.key !== DESIGN_PROVIDER_KEY);
    }
  };

  eventBus.on('propertiesPanel.getProviders', 100, disableZeebeProvider);

  editorActions.register('toggleExecutionProperties', () => {
    this.setEnabled(!this.isEnabled());
    eventBus.fire('propertiesPanel.providersChanged');
  });
}

ToggleExecutionProperties.prototype.isEnabled = function() {
  return this._enabled;
};

ToggleExecutionProperties.prototype.setEnabled = function(value) {
  return this._enabled = value;
};

ToggleExecutionProperties.$inject = [
  'editorActions',
  'eventBus'
];

export default {
  __init__: [
    'toggleExecutionProperties'
  ],
  toggleExecutionProperties: [ 'type', ToggleExecutionProperties ]
};

