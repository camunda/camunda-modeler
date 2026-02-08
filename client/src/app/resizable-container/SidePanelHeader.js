/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useState, useEffect, useCallback } from 'react';

import {
  getLabel
} from 'bpmn-js/lib/features/label-editing/LabelUtil';

import {
  is,
  getBusinessObject
} from 'bpmn-js/lib/util/ModelUtil';

import {
  isExpanded,
  isEventSubProcess,
  isInterrupting
} from 'bpmn-js/lib/util/DiUtil';

import * as css from './SidePanelHeader.less';



/**
 * Shared element header displayed at the top of all side panel tabs.
 *
 * Shows the element type pill, optional template pill with icon,
 * element name, and technical ID.
 */
export default function SidePanelHeader({ injector }) {

  const [ elementInfo, setElementInfo ] = useState(null);

  const updateElementInfo = useCallback(() => {
    if (!injector) {
      setElementInfo(null);
      return;
    }

    try {
      const selection = injector.get('selection');
      const canvas = injector.get('canvas');

      const selected = selection.get();

      let element;

      if (selected.length === 1) {
        element = selected[0];
      } else if (selected.length === 0) {
        element = canvas.getRootElement();
      } else {

        // multiple elements selected
        setElementInfo(null);
        return;
      }

      const businessObject = getBusinessObject(element);

      // element label / name
      const name = is(element, 'bpmn:Process')
        ? businessObject.name || ''
        : getLabel(element) || '';

      const id = element.id || businessObject.id || '';

      // template info
      const templateIcon = businessObject.get('zeebe:modelerTemplateIcon') || null;

      let templateName = null;

      try {
        const elementTemplates = injector.get('elementTemplates', false);

        if (elementTemplates) {
          const template = elementTemplates.get(element);

          if (template && template.name) {
            templateName = template.name;
          }
        }
      } catch (e) {

        // elementTemplates service may not be available
      }

      // type label
      const concreteType = getConcreteType(element);
      const typeLabel = concreteType
        .replace(/(\B[A-Z])/g, ' $1')
        .replace(/(\bNon Interrupting)/g, '($1)');

      setElementInfo({
        typeLabel,
        name,
        id,
        templateName,
        templateIcon
      });
    } catch (e) {
      setElementInfo(null);
    }
  }, [ injector ]);

  useEffect(() => {
    if (!injector) {
      return;
    }

    updateElementInfo();

    const eventBus = injector.get('eventBus');

    const events = [
      'selection.changed',
      'element.changed',
      'commandStack.changed',
      'import.done'
    ];

    events.forEach(event => eventBus.on(event, updateElementInfo));

    return () => {
      events.forEach(event => eventBus.off(event, updateElementInfo));
    };
  }, [ injector, updateElementInfo ]);

  if (!elementInfo) {
    return null;
  }

  const {
    typeLabel,
    name,
    id,
    templateName,
    templateIcon
  } = elementInfo;

  return (
    <div className={ css.SidePanelHeader }>
      <div className="side-panel-header__pills">
        { typeLabel && <span className="side-panel-header__pill">{ typeLabel }</span> }
        { templateName && (
          <span className="side-panel-header__pill">
            { templateIcon && (
              <img
                className="side-panel-header__pill-icon"
                src={ templateIcon }
                width="14"
                height="14"
                alt="" />
            ) }
            { templateName }
          </span>
        ) }
      </div>
      <div className={ `side-panel-header__name${ name ? '' : ' side-panel-header__name--empty' }` }>
        { name || 'Unnamed element' }
      </div>
      { id && <div className="side-panel-header__id">{ id }</div> }
    </div>
  );
}


// helpers //////////

/**
 * Get the concrete type of an element, taking into account event definitions,
 * sub-process variants, and flow types.
 *
 * Adapted from bpmn-js-properties-panel PanelHeaderProvider.
 *
 * @param {Object} element
 * @returns {string}
 */
function getConcreteType(element) {
  const { type: elementType } = element;

  let type = getRawType(elementType);

  // (1) event definition types
  const eventDefinition = getEventDefinition(element);

  if (eventDefinition) {
    type = `${getEventDefinitionPrefix(eventDefinition)}${type}`;

    // (1.1) interrupting / non interrupting
    if (
      (is(element, 'bpmn:StartEvent') && !isInterrupting(element)) ||
      (is(element, 'bpmn:BoundaryEvent') && !isCancelActivity(element))
    ) {
      type = `${type}NonInterrupting`;
    }

    return type;
  }

  // (2) sub process types
  if (is(element, 'bpmn:SubProcess') && !is(element, 'bpmn:Transaction')) {
    if (isEventSubProcess(element)) {
      type = `Event${type}`;
    } else {
      const expanded = isExpanded(element) && !isPlane(element);
      type = `${expanded ? 'Expanded' : 'Collapsed'}${type}`;
    }
  }

  // (3) conditional + default flows
  if (isDefaultFlow(element)) {
    type = 'DefaultFlow';
  }

  if (isConditionalFlow(element)) {
    type = 'ConditionalFlow';
  }

  return type;
}

function getRawType(type) {
  return type.split(':')[1];
}

function getEventDefinition(element) {
  const businessObject = getBusinessObject(element);
  const eventDefinitions = businessObject.eventDefinitions;

  return eventDefinitions && eventDefinitions[0];
}

function getEventDefinitionPrefix(eventDefinition) {
  const rawType = getRawType(eventDefinition.$type);

  return rawType.replace('EventDefinition', '');
}

function isCancelActivity(element) {
  const businessObject = getBusinessObject(element);

  return businessObject && businessObject.cancelActivity !== false;
}

function isDefaultFlow(element) {
  const businessObject = getBusinessObject(element);
  const sourceBusinessObject = getBusinessObject(element.source);

  if (!is(element, 'bpmn:SequenceFlow') || !sourceBusinessObject) {
    return false;
  }

  return sourceBusinessObject.default &&
    sourceBusinessObject.default === businessObject &&
    (is(sourceBusinessObject, 'bpmn:Gateway') || is(sourceBusinessObject, 'bpmn:Activity'));
}

function isConditionalFlow(element) {
  const businessObject = getBusinessObject(element);
  const sourceBusinessObject = getBusinessObject(element.source);

  if (!is(element, 'bpmn:SequenceFlow') || !sourceBusinessObject) {
    return false;
  }

  return businessObject.conditionExpression && is(sourceBusinessObject, 'bpmn:Activity');
}

function isPlane(element) {
  const di = element && (element.di || getBusinessObject(element).di);

  return is(di, 'bpmndi:BPMNPlane');
}
