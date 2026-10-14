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
 * Keeps track of the user's telemetry consent state.
 *
 * Events are currently not sent anywhere; a tracking backend
 * can be plugged in via `track`.
 */
export default class TrackingHandler {

  constructor() {
    this.enabled = false;
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new TrackingHandler();
    }

    return this.instance;
  }

  isEnabled() {
    return this.enabled;
  }

  track(name, props) {}

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }
}
