/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const cache = {};

export function cachedFn(key, fn, dependencies = []) {
  if (cache[key] && cache[key].dependencies.every((dep, idx) => dep === dependencies[idx])) {
    return cache[key].fn;
  }

  cache[key] = {
    fn,
    dependencies
  };

  return fn;
}
