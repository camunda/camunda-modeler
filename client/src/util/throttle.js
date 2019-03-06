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
 * Throttle function call according UI update cycle.
 *
 * @param  {Function} fn
 *
 * @return {Function} throttled fn
 */
export default function throttle(fn) {

  // noop during testing
  if (process.env.NODE_ENV === 'test') {
    return fn;
  }

  // else, ...
  var active = false;

  var lastArgs = [];
  var lastThis = undefined;

  return function(...args) {

    lastArgs = args;
    lastThis = this;

    if (active) {
      return;
    }

    active = true;

    fn.apply(lastThis, lastArgs);

    window.requestAnimationFrame(function() {
      lastArgs = lastThis = active = undefined;
    });
  };

}