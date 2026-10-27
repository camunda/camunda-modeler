/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { use as chaiUse } from 'chai';
import sinonChai from 'sinon-chai';

chaiUse(sinonChai);

// Chrome reports a ResizeObserver loop as an uncaught error, although it delivers
// the pending notifications in the next frame. Third-party code we render
// (e.g. floating-ui positioning) triggers it on slow machines.
//
// An `error` listener cannot stop it, as Karma registers `window.onerror` first;
// wrap the handler that mocha installs instead.
//
// eslint-disable-next-line mocha/no-top-level-hooks
before(function() {
  const onerror = window.onerror;

  window.onerror = function(message, ...args) {
    if (message === 'ResizeObserver loop completed with undelivered notifications.') {
      return true;
    }

    return onerror(message, ...args);
  };
});
