/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { forEach } from 'min-dash';


export function flattenFormikValues(values, omit = []) {

  const flattenValues = {};


  // TODO: Simplify this
  forEach(values, (properties, prefix) => {
    forEach(properties, (value, name) => {
      const property = `${prefix}.${name}`;
      if (omit.includes(property)) {
        return;
      }
      flattenValues[property] = value;
    });
  });

  return flattenValues;
}