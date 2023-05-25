/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { isModelElement } from 'diagram-js/lib/model';
import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import MixpanelHandler from '../MixpanelHandler';

export default class ModelingEventHandler {
  constructor(props) {

    const {
      subscribe,
      track
    } = props;

    this.track = track;
    this.bpmnJSTracking = null;

    this.subscribeToModelingEvents(subscribe);

    subscribe('telemetry.enabled', () => {
      if (this.bpmnJSTracking) {
        this.bpmnJSTracking.enable();
      }
    });

    subscribe('telemetry.disabled', () => {
      if (this.bpmnJSTracking) {
        this.bpmnJSTracking.disable();
      }
    });
  }

  subscribeToModelingEvents = (subscribe) => {

    subscribe('bpmn.modeler.created', async (event) => {
      const { modeler } = event;

      this.bpmnJSTracking = modeler.get('bpmnJSTracking');

      // if telemetry is enabled already, enable bpmnJSTracking
      if (MixpanelHandler.getInstance().isEnabled()) {
        this.bpmnJSTracking.enable();
      }

      this.bpmnJSTracking.on('tracking.event', (trakingEvent) => {
        const { name, data } = trakingEvent;

        // format event name to be consistent
        const eventName = name.replace('.', ':');

        const serializableData = filterData(name, data);

        this.track(eventName, serializableData);
      });
    });
  };

}


// helpers //////////

function replaceDiagramElement(object) {
  return {
    id: object.id,
    type: object.type,
    templateId: getTemplateIdFromElement(object)
  };
}

function filterDiagramElements(data) {
  const replacer = (key, value) => {

    if (isModelElement(value)) {
      return replaceDiagramElement(value);
    }

    if (Array.isArray(value)) {
      return value.map((item) => {
        if (isModelElement(item)) {
          return replaceDiagramElement(item);
        }

        return item;
      });
    }

    return value;
  };

  return JSON.parse(JSON.stringify(data, replacer));
}

function getTemplateIdFromElement(element) {
  const businessObject = getBusinessObject(element);

  return businessObject && businessObject.modelerTemplate;
}

function getTemplateIdFromEntry(data) {
  let entryId = data.entryId;

  if (entryId.includes('replace.template-')) {
    entryId = entryId.replace('replace.template-', '');
  } else if (entryId.includes('append.template-')) {
    entryId = entryId.replace('append.template-', '');
  } else if (entryId.includes('create.template-')) {
    entryId = entryId.replace('create.template-', '');
  }
  return entryId;
}

function filterData(eventName, data) {

  // replace diagram elements with serializable data
  let serializableData = filterDiagramElements(data);

  // get template id from popup menu entry
  if (eventName === 'popupMenu.trigger') {
    serializableData.templateId = getTemplateIdFromEntry(data);
  }

  return serializableData;
}