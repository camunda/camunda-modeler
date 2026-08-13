/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { getFieldKey } from './credentialForm';

/**
 * Build the cluster-variable value from the entered field values. Each field's
 * binding name (falling back to its id) is a `property` key — a dotted name like
 * `authentication.accessKey` nests into sub-objects. Empty values are omitted.
 *
 * @param {Array<Object>} fields
 * @param {Object<string, string>} values
 * @returns {Object}
 */
export function buildConfig(fields, values) {
  const config = {};

  for (const field of fields) {
    const key = field.binding?.name ?? field.id;
    const value = values[getFieldKey(field)];

    if (key && value !== undefined && value !== '') {
      setPath(config, key, toConfigValue(field, value));
    }
  }

  return config;
}

/**
 * Parse a stored cluster-variable value (object or JSON-serialized string) into a
 * plain map. A value that no longer parses reads as empty rather than throwing.
 *
 * @param {Object|string|null} value
 * @returns {Object<string, unknown>}
 */
export function parseConfig(value) {
  if (!value) {
    return {};
  }

  if (typeof value === 'object') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return {};
  }
}

/**
 * Map a stored cluster-variable value back to form field values, keyed by field
 * id. Dotted binding names are read from their nested sub-objects.
 *
 * @param {Array<Object>} properties
 * @param {Object|string|null} value
 * @returns {Object<string, string>}
 */
export function toFieldValues(properties, value) {
  const config = parseConfig(value);

  const values = {};

  for (const property of properties) {
    const fieldKey = property && getFieldKey(property);

    if (!fieldKey) {
      continue;
    }

    const bindingKey = property.binding?.name ?? property.id;

    const stored = getPath(config, bindingKey);

    if (stored !== undefined) {
      values[fieldKey] = String(stored);
    }
  }

  return values;
}

/**
 * Set a value at a dotted path, creating intermediate objects.
 *
 * @param {Object} target
 * @param {string} path
 * @param {*} value
 */
function setPath(target, path, value) {
  const keys = path.split('.');
  const forbiddenKeys = [ '__proto__', 'constructor', 'prototype' ];

  if (keys.some((key) => forbiddenKeys.includes(key))) {
    return;
  }

  let node = target;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];

    if (typeof node[key] !== 'object' || node[key] === null) {
      node[key] = {};
    }

    node = node[key];
  }

  node[keys[keys.length - 1]] = value;
}

/**
 * Read the value at a dotted path, or undefined when any segment is missing.
 *
 * @param {Object} source
 * @param {string} path
 * @returns {*}
 */
function getPath(source, path) {
  return path.split('.').reduce(
    (node, key) => (node && typeof node === 'object') ? node[key] : undefined,
    source
  );
}

/**
 * Whether a field must be filled in.
 *
 * @param {Object} field
 * @returns {boolean}
 */
export function isFieldRequired(field) {
  return field.constraints?.notEmpty === true;
}

/**
 * Validate a field value against configuration-template constraints.
 *
 * @param {Object} field
 * @param {*} value
 * @returns {string|null}
 */
export function getFieldError(field, value) {
  const stringValue = value == null ? '' : String(value);
  const { label } = field;
  const { maxLength, minLength, notEmpty, pattern: patternConstraint } = field.constraints || {};

  if (notEmpty && stringValue.trim() === '') {
    return label ? `${ label } must not be empty.` : 'Must not be empty.';
  }

  if (maxLength && stringValue.length > maxLength) {
    return label
      ? `${ label } cannot exceed ${ maxLength } characters.`
      : `Cannot exceed ${ maxLength } characters.`;
  }

  if (minLength && stringValue.length < minLength) {
    return label
      ? `${ label } must be at least ${ minLength } characters.`
      : `Must be at least ${ minLength } characters.`;
  }

  if (patternConstraint) {
    const pattern = typeof patternConstraint === 'string'
      ? patternConstraint
      : patternConstraint.value;

    if (!new RegExp(pattern).test(stringValue)) {
      const message = typeof patternConstraint === 'object' && patternConstraint.message
        ? patternConstraint.message
        : `must match pattern ${ pattern }.`;

      if (label) {
        return `${ label } ${ message }`;
      }

      return typeof patternConstraint === 'object' && patternConstraint.message
        ? message
        : `Must match pattern ${ pattern }.`;
    }
  }

  return null;
}

function toConfigValue(field, value) {
  if (field.type === 'Boolean') {
    return value === true || value === 'true';
  }

  if (field.type === 'Number') {
    return typeof value === 'number' ? value : Number(value);
  }

  return String(value);
}
