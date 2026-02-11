/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const NO_CONNECTION_ID = 'NO_CONNECTION';

/**
 * Event handler for tracking connection status changes.
 *
 * Tracks events when:
 * - Connection status changes (success <-> error)
 * - Active connection changes (even if both successful)
 *
 * Does NOT track:
 * - Continuous failures (only first failure)
 * - Continuous successes on same connection (only first success)
 */
export default class ConnectionEventHandler {
  constructor(props) {
    const {
      subscribe,
      track
    } = props;

    this.track = track;
    this.lastConnectionState = null;

    subscribe('connectionManager.connectionStatusChanged', this.onConnectionStatusChanged);
  }

  onConnectionStatusChanged = (event) => {
    if (!event) {
      return;
    }

    // Extract payload from event object
    const payload = event.payload || event;

    const {
      connectionId,
      connection,
      success,
      reason,
      isLocal
    } = payload;

    // Skip if no connection or NO_CONNECTION selected
    if (!connection || !connectionId || connectionId === NO_CONNECTION_ID) {
      return;
    }

    // Build current state
    const currentState = {
      connectionId,
      success,
      reason
    };

    // Check if we should emit an event
    if (!this.shouldEmitEvent(currentState, this.lastConnectionState)) {
      return;
    }

    // Build and send telemetry payload
    const telemetryPayload = {
      success,
      targetType: connection.targetType === 'camundaCloud' ? 'SaaS' : 'Self-Managed',
      isLocal,
      reason: success ? null : (reason || null)
    };

    this.track('connection:statusChanged', telemetryPayload);

    // Update last state
    this.lastConnectionState = currentState;
  };

  /**
   * Determines if we should emit an event based on state change.
   *
   * @param {Object} current - Current connection state
   * @param {Object} previous - Previous connection state
   * @returns {boolean} - Whether to emit an event
   */
  shouldEmitEvent(current, previous) {

    // No previous state = first check = emit
    if (!previous) {
      return true;
    }

    // Connection changed (even if both success) = emit
    if (current.connectionId !== previous.connectionId) {
      return true;
    }

    // Status changed (success <-> error) = emit
    if (current.success !== previous.success) {
      return true;
    }

    // Same connection, same status = don't emit
    return false;
  }
}
