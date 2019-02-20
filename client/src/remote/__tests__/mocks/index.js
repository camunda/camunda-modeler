/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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