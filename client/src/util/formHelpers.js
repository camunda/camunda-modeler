/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { getExtensionElements } from './extensionElementsHelpers';


/**
 * Return all form fields existing in the business object, and
 * an empty array if none exist.
 *
 * @param {ModdleElement} element
 *
 * @return {Array<ModdleElement>} a list of form fields
 */
export function getFormFields(element) {
  const formData = getFormData(element);
  return (formData && formData.get('fields')) || [];
}

/**
 * Return camunda form data existing in the business object
 *
 * @param {ModdleElement} element
 *
 * @return {ModdleElement}
 */
function getFormData(element) {
  return (getElements(element, 'camunda:FormData') || [])[0];
}

/**
 * Return zeebe form definition existing in the business object
 *
 * @param {ModdleElement} element
 *
 * @return {ModdleElement}
 */
export function getFormDefinition(element) {
  return getElements(element, 'zeebe:FormDefinition')[0];
}

function getElements(element, type, property) {
  const elements = getExtensionElements(element, type);

  return !property ? elements : (elements[0] || {})[property] || [];
}
