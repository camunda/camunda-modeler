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

import {
  toSemverMinor
} from '../../EngineProfile';

import cmp from 'semver-compare';


const formJSVersions = {
  'Camunda Cloud': {
    '1.0': '0.0.1',
    '1.1': '0.1.0',
    '1.2': '0.1.0',
    '1.3': '0.1.0',
    '8.0': '0.2.0'
  },
  'Camunda Platform': {
    '7.15': '0.0.1',
    '7.16': '0.1.0',
    '7.17': '0.2.0'
  }
};

const executionPlatformLabels = {
  'Camunda Cloud': {
    '1.0': 'Camunda Platform 8 (Zeebe 1.0)',
    '1.1': 'Camunda Platform 8 (Zeebe 1.1)',
    '1.2': 'Camunda Platform 8 (Zeebe 1.2)',
    '1.3': 'Camunda Platform 8 (Zeebe 1.3)',
    '8.0': 'Camunda Platform 8'
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
      executionPlatformVersion: _executionPlatformVersion
    } = schema;

    if (!executionPlatform) {
      return [];
    }

    // normalize execution platform version
    // (account for <major>.<minor> vs <major>.<minor>.<patch> parsed from form)
    const executionPlatformVersion = toSemverMinor(_executionPlatformVersion);

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
          label: label || (text && textToLabel(text)) || id,
          message: `A <${ capitalize(type) }> is not supported by ${ getExecutionPlatformLabel(executionPlatform, executionPlatformVersion) }`,
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

  return formJSVersions[ executionPlatform ][ executionPlatformVersion ];
}

function getExecutionPlatformLabel(executionPlatform, executionPlatformVersion) {
  if (executionPlatformLabels[ executionPlatform ] && executionPlatformLabels[ executionPlatform ][ executionPlatformVersion ]) {
    return executionPlatformLabels[ executionPlatform ][ executionPlatformVersion ];
  }

  return `${ executionPlatform } ${ executionPlatformVersion }`;
}

function capitalize(string) {
  return `${ string.slice(0, 1).toUpperCase()}${ string.slice(1) }`;
}