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
  debounce as _debounce
} from 'min-dash';

/**
 * Debounce function call according UI update cycle.
 *
 * @param  {Function} fn
 *
 * @return {Function} debounced fn
 */
export default function debounce(fn) {

  // noop during testing
  if (process.env.NODE_ENV === 'test') {
    return fn;
  }

  return _debounce(fn, 300);
}