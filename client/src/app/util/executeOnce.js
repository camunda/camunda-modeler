/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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