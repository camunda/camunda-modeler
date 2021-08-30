/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import {
  isNil,
  isString
} from 'min-dash';

import cmp from 'semver-compare';

const formJSVersions = {
  'Camunda Cloud': {
    '1.0': '0.0.1',
    '1.1': '0.1.0'
  },
  'Camunda Platform': {
    '7.15': '0.0.1'
  }
};


export default class FormLinter {
  static lint(contents) {
    let schema;

    if (isString(contents)) {
      schema = JSON.parse(contents);
    } else {
      schema = contents;
    }

    const {
      executionPlatform,
      executionPlatformVersion
    } = schema;

    if (!executionPlatform) {
      return [];
    }

    const types = [
      'button',
      'default',
      'textfield'
    ];

    const formJSVersion = getFormJSVersion(executionPlatform, executionPlatformVersion);

    if (!isNil(formJSVersion) && cmp(formJSVersion, '0.1.0') >= 0) {
      types.push(
        'checkbox',
        'number',
        'radio',
        'select',
        'text'
      );
    }

    return schema.components.reduce((results, formField) => {
      const {
        id,
        label,
        text,
        type
      } = formField;

      if (!types.includes(type)) {
        results.push({
          id,
          label: label || textToLabel(text),
          message: `Form field of type <${ type }> not supported by ${ executionPlatform } ${ executionPlatformVersion }`,
          category: 'error'
        });
      }

      return results;
    }, []);
  }
}

// helpers //////////

function textToLabel(text = '...') {
  if (text.length > 10) {
    return `${ text.substring(0, 30) }...`;
  }

  return text;
}

function getFormJSVersion(executionPlatform, executionPlatformVersion) {
  if (!formJSVersions[ executionPlatform ]) {
    return null;
  }

  return formJSVersions[ executionPlatform ][ executionPlatformVersion ] || null;
}