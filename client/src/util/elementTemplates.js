/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { CloudElementTemplatesValidator } from 'camunda-bpmn-js/lib/camunda-cloud/ElementTemplatesValidator';

import { filter } from 'min-dash';

const elementTemplatesValidator = new CloudElementTemplatesValidator();

export function getCloudTemplates(templates) {
  return filterTemplatesBySchema(templates, true);
}

export function getPlatformTemplates(templates) {
  return filterTemplatesBySchema(templates, false);
}

function filterTemplatesBySchema(templates, shouldApply) {
  return filter(templates, template => {
    const { $schema } = template;
    return !!elementTemplatesValidator.isSchemaValid($schema) === shouldApply;
  });
}