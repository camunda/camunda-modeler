/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const SIGNATURE_CAP = 5;
const RENDER_LOOP_CAP = 1;

const REACT_RENDER_LOOP_MESSAGES = [
  /Maximum update depth exceeded/
];

/**
 * Build a Sentry `beforeSend` callback that caps repeated reports per error
 * signature within a session, with a tighter cap for React render loops.
 *
 * Single broken installs and render loops can otherwise emit thousands of
 * events for the same error and consume the project quota.
 */
function createThrottler() {
  const counts = new Map();

  return function beforeSend(event) {
    const value = getExceptionValue(event);

    const isRenderLoop = REACT_RENDER_LOOP_MESSAGES.some(re => re.test(value));
    const cap = isRenderLoop ? RENDER_LOOP_CAP : SIGNATURE_CAP;

    const signature = getSignature(event);
    const count = counts.get(signature) || 0;

    if (count >= cap) {
      return null;
    }

    counts.set(signature, count + 1);
    return event;
  };
}

function getExceptionValue(event) {
  const values = event && event.exception && event.exception.values;

  if (values && values.length) {
    return (values[0] && values[0].value) || '';
  }

  return (event && event.message) || '';
}

function getSignature(event) {
  const values = event && event.exception && event.exception.values;

  if (values && values.length) {
    const v = values[0] || {};
    return (v.type || 'Error') + ':' + (v.value || '');
  }

  return (event && event.message) || 'unknown';
}

module.exports = { createThrottler };
