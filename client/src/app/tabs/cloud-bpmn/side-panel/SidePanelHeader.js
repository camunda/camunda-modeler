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

import iconsByType from './icons';

import * as css from './SidePanelHeader.less';

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

      const headerProvider = PanelHeaderProvider(injector);

      const elementLabel = headerProvider.getElementLabel(element);
      const typeLabel = headerProvider.getTypeLabel(element);
      const ElementIcon = headerProvider.getElementIcon(element);
      const documentationRef = headerProvider.getDocumentationRef(element);

      setElementInfo({
        typeLabel,
        name: elementLabel || '',
        ElementIcon,
        documentationRef
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
    ElementIcon,
    documentationRef
  } = elementInfo;

  return (
    <div className={ css.SidePanelHeader }>
      <div className="side-panel-header__icon">
        { ElementIcon && (
          typeof ElementIcon === 'function'
            ? <ElementIcon />
            : ElementIcon
        ) }
      </div>
      <div className="side-panel-header__labels">
        { typeLabel && <div className="side-panel-header__type">{ typeLabel }</div> }
        { name && <div className="side-panel-header__name">{ name }</div> }
      </div>
      <div className="side-panel-header__actions">
        { documentationRef && (
          <a
            href={ documentationRef }
            title="Open documentation"
            target="_blank"
            rel="noopener noreferrer"
          >?</a>
        ) }
      </div>
    </div>
  );
}


// PanelHeaderProvider //////////

export const PanelHeaderProvider = (injector) => {
  return {
    getDocumentationRef: (element) => {
      const elementTemplates = getTemplatesService(injector);

      if (elementTemplates) {
        return getTemplateDocumentation(element, elementTemplates);
      }
    },

    getElementLabel: (element) => {
      if (is(element, 'bpmn:Process')) {
        return getBusinessObject(element).name;
      }

      return getLabel(element);
    },

    getElementIcon: (element) => {
      const concreteType = getConcreteType(element);

      let config;
      try {
        config = injector.get('config.elementTemplateIconRenderer', false);
      } catch (e) {

        // service may not be available
      }

      const { iconProperty = 'zeebe:modelerTemplateIcon' } = config || {};

      const templateIcon = getBusinessObject(element).get(iconProperty);

      if (templateIcon) {
        const TemplateIcon = () => (
          <img
            class="bio-properties-panel-header-template-icon"
            width="32"
            height="32"
            src={ templateIcon }
            alt=""
          />
        );

        return TemplateIcon;
      }

      return iconsByType[ concreteType ];
    },

    getTypeLabel: (element) => {
      const elementTemplates = getTemplatesService(injector);

      if (elementTemplates) {
        const template = getTemplate(element, elementTemplates);

        if (template && template.name) {
          return template.name;
        }
      }

      const concreteType = getConcreteType(element);

      return concreteType
        .replace(/(\B[A-Z])/g, ' $1')
        .replace(/(\bNon Interrupting)/g, '($1)');
    }
  };
};


// helpers //////////

export function getConcreteType(element) {
  const {
    type: elementType
  } = element;

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

function isCancelActivity(element) {
  const businessObject = getBusinessObject(element);

  return businessObject && businessObject.cancelActivity !== false;
}

function getEventDefinition(element) {
  const businessObject = getBusinessObject(element),
        eventDefinitions = businessObject.eventDefinitions;

  return eventDefinitions && eventDefinitions[0];
}

function getRawType(type) {
  return type.split(':')[1];
}

function getEventDefinitionPrefix(eventDefinition) {
  const rawType = getRawType(eventDefinition.$type);

  return rawType.replace('EventDefinition', '');
}

function isDefaultFlow(element) {
  const businessObject = getBusinessObject(element);
  const sourceBusinessObject = getBusinessObject(element.source);

  if (!is(element, 'bpmn:SequenceFlow') || !sourceBusinessObject) {
    return false;
  }

  return sourceBusinessObject.default && sourceBusinessObject.default === businessObject && (
    is(sourceBusinessObject, 'bpmn:Gateway') || is(sourceBusinessObject, 'bpmn:Activity')
  );
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

  // Backwards compatibility for bpmn-js<8
  const di = element && (element.di || getBusinessObject(element).di);

  return is(di, 'bpmndi:BPMNPlane');
}

function getTemplatesService(injector) {
  try {
    return injector.get('elementTemplates', false);
  } catch (e) {
    return null;
  }
}

function getTemplate(element, elementTemplates) {
  return elementTemplates.get(element);
}

function getTemplateDocumentation(element, elementTemplates) {
  const template = getTemplate(element, elementTemplates);

  return template && template.documentationRef;
}
