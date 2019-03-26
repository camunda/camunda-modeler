/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* global sinon */

import { Dialog, FileSystem } from '.';

const stub = sinon.stub;

export default class Remotes {
  constructor(overrides = {}) {
    this.globals = {
      dialog: stub(new Dialog()),
      fileSystem: stub(new FileSystem()),
      ...overrides
    };

    this.actualCalls = [];
    this.expectedCalls = [];
  }

  getGlobals() {
    return this.globals;
  }

  /**
   * Expect externals to be called.
   */
  expectCalls(calls = []) {
    calls.forEach(call => {
      const [ remote, method, response ] = call;

      remote[method]
    });

    this.expectedCalls = [
      ...this.calls,
      calls
    ];
  }

  expectAndReset() {
    
  }
}