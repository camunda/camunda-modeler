/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export class ResourcesProvider {
  constructor(resourceLoader, processApplications) {
    this._processApplications = processApplications;

    resourceLoader.register(this);
  }

  getResources() {
    const items = this._processApplications.getItems();

    const resources = items.map((item) => {
      switch (item.metadata?.type) {
      case 'bpmn':
        return handleBpmnItem(item);
      case 'dmn':
        return handleDmnItem(item);
      case 'form':
        return handleFormItem(item);
      default:
        return null;
      }
    }).filter(Boolean).flat();

    return resources;
  }
}

ResourcesProvider.$inject = [ 'resources.resourceLoader', 'processApplications' ];

export const ResourcesProviderModule = {
  __init__: [ 'resourcesProvider' ],
  resourcesProvider: [ 'type', ResourcesProvider ]
};

/**
 * @param {{ metadata: { ids: string[] } }} item
 */
function handleBpmnItem(item) {
  const metadata = item.metadata;

  return metadata.processes.map((process) => ({
    name: process.name,
    type: 'bpmnProcess',
    processId: process.id
  }));
}

/**
 * @param {{ metadata: { ids: string[] } }} item
 */
function handleDmnItem(item) {
  const metadata = item.metadata;

  return metadata.decisions.map((decision) => ({
    name: decision.name,
    type: 'dmnDecision',
    decisionId: decision.id
  }));
}

/**
 * @param {{ metadata: { ids: string[] } }} item
 */
function handleFormItem(item) {
  const metadata = item.metadata;

  return metadata.forms.map((form) => ({
    name: form.name,
    type: 'form',
    formId: form.id
  }));
}
