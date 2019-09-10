/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export class Backend {
  constructor() {
    this.response = null;
  }

  setSendResponse(response) {
    this.response = response;
  }

  send() {
    return this.response;
  }
}

export class IpcRenderer {
  constructor() {
    this.response = null;

    this.listener = null;
  }

  setSendResponse(response) {
    this.sendResponse = response;
  }

  send(event, id, args) {
    this.listener(null, this.sendResponse);
  }

  on(event, callback) {
    this.listener = callback;
  }

  off(event) {
    this.listener = null;
  }

  once(event, callback) {
    this.listener = callback;
  }
}