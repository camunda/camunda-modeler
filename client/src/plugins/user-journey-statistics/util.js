/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import {
  find,
  keys
} from 'min-dash';

const TAB_TYPES = {
  BPMN: 'bpmn',
  CLOUD_BPMN: 'cloud-bpmn',
  CLOUD_DMN: 'cloud-dmn',
  CLOUD_FORM: 'cloud-form',
  DMN: 'dmn',
  FORM: 'form'
};

const TAB_TYPES_BY_RESOUCE_TYPE = {
  'bpmn': [ TAB_TYPES.BPMN, TAB_TYPES.CLOUD_BPMN ],
  'dmn': [ TAB_TYPES.DMN, TAB_TYPES.CLOUD_DMN ],
  'form': [ TAB_TYPES.FORM, TAB_TYPES.CLOUD_FORM ]
};

export function getResourceType(tabType) {
  return find(keys(TAB_TYPES_BY_RESOUCE_TYPE), function(resourceType) {
    return TAB_TYPES_BY_RESOUCE_TYPE[ resourceType ].includes(tabType);
  });
}

export function getTemplateIds(modeler) {
  const templateIds = [];

  modeler && modeler.get('elementRegistry').getAll().forEach((element) => {
    const template = getTemplateIdFromElement(element);
    if (template) {
      templateIds.push(template);
    }
  });

  return templateIds;
}

function getTemplateIdFromElement(element) {
  const businessObject = getBusinessObject(element);

  return businessObject && businessObject.modelerTemplate;
}
