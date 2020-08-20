/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import CamundaPropertiesProvider from 'bpmn-js-properties-panel/lib/provider/camunda/CamundaPropertiesProvider';

import entryFactory from 'bpmn-js-properties-panel/lib/factory/EntryFactory';


export default class PropertiesProvider extends CamundaPropertiesProvider {
  constructor(eventBus, canvas, bpmnFactory, elementRegistry, elementTemplates, translate, config) {
    super(eventBus, canvas, bpmnFactory, elementRegistry, elementTemplates, translate);

    this._translate = translate;
    this._config = config;

    const getTabs = this.getTabs;

    this.getTabs = element => {
      const tabs = getTabs(element);

      const generalTab = tabs.find(({ id }) => id === 'general');

      if (!generalTab) {
        return tabs;
      }

      const { groups } = generalTab;

      const generalGroup = groups.find(({ id }) => id === 'general');

      if (!generalGroup) {
        return tabs;
      }

      const { entries } = generalGroup;

      this.addElementTemplatesModalEntry(entries);

      return tabs;
    };
  }

  addElementTemplatesModalEntry = entries => {
    const elementTemplateChooserEntry = entries.find(({ id }) => id === 'elementTemplate-chooser');

    if (!elementTemplateChooserEntry) {
      return;
    }

    const index = entries.indexOf(elementTemplateChooserEntry);

    const { openElementTemplatesModal } = this._config;

    entries.splice(index + 1, 0, entryFactory.link({
      id: 'elementTemplatesModal',
      label: this._translate('Select Element Template'),
      handleClick: openElementTemplatesModal
    }));
  }
}

PropertiesProvider.$inject = [
  'eventBus',
  'canvas',
  'bpmnFactory',
  'elementRegistry',
  'elementTemplates',
  'translate',
  'config.propertiesProvider'
];