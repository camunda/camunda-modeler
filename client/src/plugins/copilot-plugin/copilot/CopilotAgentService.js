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

    const eventSource = new EventSourcePolyfill(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      heartbeatTimeout: 30 * 60 * 1000, // 30 minutes timeout
    });

    // Handle all events via onmessage (like ClusterService does)
    eventSource.onmessage = (event) => {
      try {
        console.log('[CopilotAgent] SSE event received:', event.data);
        const data = JSON.parse(event.data);
        onEvent(data);

        // Close connection on execution_complete event (case-insensitive)
        const eventType = (data.type || '').toUpperCase();
        if (eventType === 'EXECUTION_COMPLETE') {
          console.log(
            '[CopilotAgent] Received EXECUTION_COMPLETE event, closing SSE connection',
          );
          eventSource.close();
          this.activeConnections.delete(conversationId);
        }
      } catch (e) {
        console.error(
          '[CopilotAgent] Failed to parse SSE event:',
          e,
          'Raw data:',
          event.data,
        );
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
    eventSource.onerror = (error) => {
      console.error(
        '[CopilotAgent] SSE connection error:',
        error,
        'readyState:',
        eventSource.readyState,
      );

      // Check if the connection is closed
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log('[CopilotAgent] SSE connection closed');
        this.activeConnections.delete(conversationId);
        onEvent({
          type: 'ERROR',
          status: 'ERROR',
          content: 'Connection closed unexpectedly',
        });
      }
    };

    return {
      eventSource,
      unsubscribe: () => {
        console.log(
          '[CopilotAgent] Closing SSE connection for conversation:',
          conversationId,
        );
        eventSource.close();
        this.activeConnections.delete(conversationId);
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
    if (this.activeConnections.has(conversationId)) {
      return this.activeConnections.get(conversationId);
    }

    const connection = await this.#createSseConnection(conversationId, onEvent);
    this.activeConnections.set(conversationId, connection);
    return connection;
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

  async sendMessage(payload, signal) {
    console.log('[CopilotAgent] Sending message:', payload.content);
    const response = await fetch(`${this.baseUrl}/api/internal/copilot/converse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.#getToken()}`
      },
      body: JSON.stringify(payload),
      signal
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async sendToolResult(payload, signal) {
    console.log('[CopilotAgent] Sending tool result for:', payload.toolName);
    const response = await fetch(`${this.baseUrl}/api/internal/copilot/continueWithToolResult`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.#getToken()}`
      },
      body: JSON.stringify(payload),
      signal
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async haltConversation(conversationId, signal) {
    console.log('[CopilotAgent] Halting conversation for:', conversationId);
    const response = await fetch(`${this.baseUrl}/api/internal/copilot/haltConversation/${conversationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.#getToken()}`
      },
      signal
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  #getToken() {
    return '';
  }
}

export default new CopilotAgentService();
