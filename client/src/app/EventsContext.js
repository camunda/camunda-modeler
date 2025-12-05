/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { createContext } from 'react';

import EventEmitter from 'events';

const eventEmitter = new EventEmitter();

export const EventsContext = createContext({
  subscribe: (event, listener) => {
    eventEmitter.on(event, listener);
    return {
      cancel: () => eventEmitter.off(event, listener)
    };
  }
});
