/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { groupBy } from 'min-dash';

const SECRET_REFERENCE_PREFIX = 'camunda.secrets.';

const DEFAULT_GROUP_LABEL = 'Credential properties';

/**
 * The stable per-field key used for form values: the property id when present,
 * otherwise its binding name (configuration-template fields may omit `id`).
 *
 * @param {Object} property
 * @returns {string|undefined}
 */
export function getFieldKey(property) {
  return property.id ?? property.binding?.name;
}

/**
 * Seed the form values from each field's default. Secret fields without an
 * explicit default start with the `camunda.secrets.` prefix ready to complete.
 *
 * @param {Array<Object>} properties
 * @returns {Object<string, string>}
 */
export function getInitialFieldValues(properties) {
  const values = {};

  for (const property of properties) {
    const key = property && getFieldKey(property);

    if (key) {
      values[key] = getInitialFieldValue(property);
    }
  }

  return values;
}

/**
 * Group fields by declared configuration-template groups, with undeclared and
 * ungrouped fields collected in a trailing default group.
 *
 * @param {Array<Object>} properties
 * @param {Array<Object>} groups
 * @returns {Array<{ id: string, label: string, properties: Array<Object> }>}
 */
export function getFieldGroups(properties, groups = []) {
  const groupedProperties = groupBy(properties, 'group');
  const fieldGroups = [];
  const defaultProperties = [];

  Object.entries(groupedProperties).forEach(([ groupId, groupProperties ]) => {
    const group = groups.find(candidate => candidate.id === groupId);

    if (!group) {
      defaultProperties.push(...groupProperties);

      return;
    }

    fieldGroups.push({
      id: group.id,
      label: group.label,
      properties: groupProperties
    });
  });

  if (defaultProperties.length) {
    fieldGroups.push({
      id: 'default',
      label: DEFAULT_GROUP_LABEL,
      properties: defaultProperties
    });
  }

  return fieldGroups;
}

/**
 * Evaluate a configuration-template field `condition` against the current values.
 *
 * @param {Object} [condition]
 * @param {Object<string, string>} values
 * @returns {boolean}
 */
export function isConditionMet(condition, values) {
  if (!condition) {
    return true;
  }

  if (Array.isArray(condition.allMatch)) {
    return condition.allMatch.every(nested => isConditionMet(nested, values));
  }

  if (condition.property !== undefined && Object.hasOwn(condition, 'isEmpty')) {
    const value = values[condition.property];
    const empty = value === undefined || value === null || value === '';

    return condition.isEmpty === empty;
  }

  if (condition.property !== undefined && Array.isArray(condition.oneOf)) {
    return condition.oneOf.includes(values[condition.property] ?? '');
  }

  if (condition.property !== undefined) {
    return (values[condition.property] ?? '') === (condition.equals ?? '');
  }

  return true;
}

/**
 * Filter the fields whose condition is currently met.
 *
 * @param {Array<Object>} properties
 * @param {Object<string, string>} values
 * @returns {Array<Object>}
 */
export function getVisibleProperties(properties, values) {
  return properties.filter(property => isConditionMet(property.condition, values));
}

function getInitialFieldValue(property) {
  if (property.value !== undefined) {
    return String(property.value);
  }

  return property.secret ? SECRET_REFERENCE_PREFIX : '';
}
