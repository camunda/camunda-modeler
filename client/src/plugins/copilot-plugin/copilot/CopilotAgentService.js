/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { EventSourcePolyfill } from 'event-source-polyfill';


/**
 * CopilotAgentService using Server-Sent Events (SSE) for real-time communication.
 */
class CopilotAgentService {
  constructor() {
    this.baseUrl = 'http://localhost:8081';
    this.activeConnections = new Map();
  }

  /**
   * Creates an SSE connection for the given conversation ID with authorization headers.
   * Uses onmessage handler like ClusterService does for reliable event delivery.
   * @param {string} conversationId - The conversation ID to subscribe to
   * @param {function} onEvent - Callback function for handling events
   * @returns {Promise<object>} - Object with unsubscribe method
   */
  async #createSseConnection(conversationId, onEvent) {
    const url = `${this.baseUrl}/api/internal/copilot/subscribe/${conversationId}`;
    const token = this.#getToken();

    console.log('[CopilotAgent] Creating SSE connection:', url);

    let intentionallyClosed = false;

    // Store callback in a mutable wrapper so it can be updated
    let currentCallback = onEvent;

    const eventSource = new EventSourcePolyfill(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      heartbeatTimeout: 30 * 60 * 1000, // 30 minutes timeout
    });

    // Helper to close the connection gracefully
    const closeConnection = () => {
      intentionallyClosed = true;
      eventSource.close();
      this.activeConnections.delete(conversationId);
    };

    // Handle all events via onmessage (like ClusterService does)
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const eventType = (data.type || '').toUpperCase();
        const eventStatus = (data.status || '').toUpperCase();

        console.log('[CopilotAgent] SSE event:', {
          type: eventType,
          status: eventStatus,
          content: data.content?.substring(0, 50),
          toolName: data.toolName,
          toolArguments: data.toolArguments ? 'present' : 'absent',
        });

        // CONNECTED is a connection handshake, not a chat event
        if (eventType === 'CONNECTED') {
          return;
        }

        // Use the current callback (which may have been updated)
        currentCallback(data);
      } catch (e) {
        console.error('[CopilotAgent] Failed to parse SSE event:', e);
      }
    };

    // Handle connection open
    eventSource.onopen = (_) => {
      console.log(
        '[CopilotAgent] SSE connection opened for conversation:',
        conversationId,
        'readyState:',
        eventSource.readyState,
      );
    };

    // Handle connection errors
    eventSource.onerror = (_) => {

      // Don't log error if connection was intentionally closed
      if (intentionallyClosed) {
        return;
      }

      // SSE connections commonly trigger error events during reconnection attempts.
      // Only log for debugging - don't emit ERROR events to the UI for transient errors.
      console.warn(
        '[CopilotAgent] SSE connection error (will retry):',
        'readyState:',
        eventSource.readyState,
      );
    };

    return {
      eventSource,
      unsubscribe: () => {
        console.log(
          '[CopilotAgent] Closing SSE connection for conversation:',
          conversationId,
        );
        closeConnection();
      },

      // Method to update the callback without recreating the connection
      updateCallback: (newCallback) => {
        currentCallback = newCallback;
      },
    };
  }

  /**
   * Subscribe to events for a conversation.
   * @param {string} conversationId - The conversation ID
   * @param {function} onEvent - Callback for events
   * @returns {Promise<object>} - Object with unsubscribe method
   */
  async subscribe(conversationId, onEvent) {

    // If connection already exists, update the callback and return existing connection
    if (this.activeConnections.has(conversationId)) {
      const existingConnection = this.activeConnections.get(conversationId);

      // Update the callback wrapper to use the new onEvent
      existingConnection.updateCallback(onEvent);
      console.log('[CopilotAgent] Updated callback for existing connection:', conversationId);
      return existingConnection;
    }

    const connection = await this.#createSseConnection(conversationId, onEvent);
    this.activeConnections.set(conversationId, connection);
    return connection;
  }

  /**
   * Update the callback for an existing connection.
   * @param {string} conversationId - The conversation ID
   * @param {function} onEvent - New callback for events
   */
  updateCallback(conversationId, onEvent) {
    const connection = this.activeConnections.get(conversationId);
    if (connection) {
      connection.updateCallback(onEvent);
      console.log('[CopilotAgent] Updated callback for connection:', conversationId);
    }
  }

  /**
   * Get all active conversation IDs.
   * @returns {string[]} - Array of active conversation IDs
   */
  getActiveConversationIds() {
    return Array.from(this.activeConnections.keys());
  }

  /**
   * Unsubscribe from a conversation.
   * @param {string} conversationId - The conversation ID
   */
  unsubscribe(conversationId) {
    const connection = this.activeConnections.get(conversationId);
    connection?.unsubscribe();
    this.haltConversation(conversationId);
  }

  async sendMessage(payload, mcpServers, modeler) {

    const isEmpty = Object.keys(mcpServers).length === 0;

    const mcpToolsJsonString = isEmpty ? undefined : JSON.stringify(mcpServers);

    const { xml } = await modeler.saveXML({ format: false });

    const response = await fetch(
      `${this.baseUrl}/api/internal/copilot/converse`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.#getToken()}`,
        },
        body: JSON.stringify({
          ...payload,
          context: {
            'latest_bpmn_xml': xml
          },
          mcpToolsJsonString
        }),
      },
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async sendToolResult(payload) {
    const response = await fetch(
      `${this.baseUrl}/api/internal/copilot/continueWithToolResult`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.#getToken()}`,
        },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async haltConversation(conversationId, signal) {
    console.log('[CopilotAgent] Halting conversation for:', conversationId);
    const response = await fetch(
      `${this.baseUrl}/api/internal/copilot/haltConversation/${conversationId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.#getToken()}`,
        },
        signal,
      },
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Handle empty response body gracefully
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  #getToken() {
    return '';
  }
}

export default new CopilotAgentService();
