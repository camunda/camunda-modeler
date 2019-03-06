/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/**
 * This wraps the given async fn and ensures
 * it may only be executed serially.
 *
 * The promise for the currently running execution will be
 * cached. The function will only be re-evaluated once
 * a running execution for a given identity got completed.
 *
 * @param  {AsyncFunction} fn
 * @param  {Function} identity
 *
 * @return {AsyncFunction} promise for the to-be result
 */
export default function executeOnce(fn, identity) {

  const runningCache = {};

  if (typeof identity !== 'function') {
    identity = () => '_';
  }

  return function(...args) {

    const id = identity(...args);

    if (id in runningCache) {
      return runningCache[id];
    }

    const promise = fn(...args);

    runningCache[id] = promise;

    promise.finally(() => delete runningCache[id]);

    return promise;
  };

}