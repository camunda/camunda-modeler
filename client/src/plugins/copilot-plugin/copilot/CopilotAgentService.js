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
        });

        // CONNECTED is a connection handshake, not a chat event
        if (eventType === 'CONNECTED') {
          return;
        }

        onEvent(data);
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
    eventSource.onerror = (error) => {

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

  async sendMessage(payload, mcpServers) {

    const isEmpty = Object.keys(mcpServers).length === 0;

    const mcpToolsJsonString = isEmpty ? undefined : JSON.stringify(mcpServers);

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
    return 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik5FSTFSa1JGUkVaRVJUQTFSalU0T1VJNE5EQXdOMFF5TUVZek1ERkdRVGcxUmpsRE1ERkdOQSJ9.eyJodHRwczovL2NhbXVuZGEuY29tL29yZ3MiOlt7ImlkIjoiOTM2ZjE3OGQtM2FiOS00MzczLWI3YTAtZmVjZTRhY2NmY2Q0Iiwicm9sZXMiOlsiZGV2ZWxvcGVyIiwiYW5hbHlzdCJdfSx7ImlkIjoiNzY3ZDU5M2YtZmEwMy00Mzk2LTkxN2YtODQ1YmJiZWNkN2E5Iiwicm9sZXMiOlsibW9kZWxlciIsImFuYWx5c3QiLCJhZG1pbiJdfSx7ImlkIjoiZGMwNjA4YzQtMDA4My00MDEwLWE1NTEtZTQxODYyMDczY2Y2Iiwicm9sZXMiOlsib3duZXIiXX0seyJpZCI6IjY0OGQzZGRhLTkyYjMtNGJjNy1iZTZkLWY1NTgwMDM5ODAxYSIsInJvbGVzIjpbImFkbWluIiwib3BlcmF0aW9uc2VuZ2luZWVyIiwiYW5hbHlzdCIsInRhc2t1c2VyIiwiZGV2ZWxvcGVyIiwidmlzaXRvciIsIm1vZGVsZXIiXX0seyJpZCI6IjhjOGIxZjdmLTY4MzYtNDQ2NS1hN2JkLWI2MWIxZTAyOTM0ZiIsInJvbGVzIjpbImRldmVsb3BlciJdfV0sImh0dHBzOi8vY2FtdW5kYS5jb20vb3JnSWRzIjpbIjkzNmYxNzhkLTNhYjktNDM3My1iN2EwLWZlY2U0YWNjZmNkNCIsIjc2N2Q1OTNmLWZhMDMtNDM5Ni05MTdmLTg0NWJiYmVjZDdhOSIsImRjMDYwOGM0LTAwODMtNDAxMC1hNTUxLWU0MTg2MjA3M2NmNiIsIjY0OGQzZGRhLTkyYjMtNGJjNy1iZTZkLWY1NTgwMDM5ODAxYSIsIjhjOGIxZjdmLTY4MzYtNDQ2NS1hN2JkLWI2MWIxZTAyOTM0ZiJdLCJodHRwczovL2NhbXVuZGEuY29tL3JvbGVzIjpbXSwiaHR0cHM6Ly9jYW11bmRhLmNvbS9zZXR0aW5ncyI6eyJwZXJzb25hIjp7ImJwbW5FeHBlcmllbmNlIjoiQmFzaWMgcHJvY2VzcyBkZXNpZ24iLCJjbGllbnQiOiJKYXZhU2NyaXB0L05vZGVKUyIsImNvbXBsZXRlIjpmYWxzZSwibmV4dFN0ZXAiOjEsInJvbGUiOiJTb2Z0d2FyZSBEZXZlbG9wZXIiLCJ3YXNTaG93biI6dHJ1ZX0sInRoZW1lIjoic3lzdGVtIn0sImh0dHBzOi8vY2FtdW5kYS5jb20vbWV0YSI6eyJjcmVhdGVkQXQiOiIyMDI1LTA1LTA1VDE1OjA4OjEwLjM5NloiLCJlbWFpbCI6ImZyYW5jZXNjby5lc3Bvc2l0b0BjYW11bmRhLmNvbSIsImZhbWlseV9uYW1lIjoiRXNwb3NpdG8iLCJnaXZlbl9uYW1lIjoiRnJhbmNlc2NvIiwibmFtZSI6IkZyYW5jZXNjbyBFc3Bvc2l0byIsInRlYW0iOiJFbmdpbmVlcmluZ19DYW11bmRhIENvcGlsb3QifSwiaHR0cHM6Ly9jYW11bmRhLmNvbS90bXBfZW1haWwiOiJmcmFuY2VzY28uZXNwb3NpdG9AY2FtdW5kYS5jb20iLCJpc3MiOiJodHRwczovL3dlYmxvZ2luLmNsb3VkLmRldi51bHRyYXdvbWJhdC5jb20vIiwic3ViIjoic2FtbHB8T2t0YXxmcmFuY2VzY28uZXNwb3NpdG9AY2FtdW5kYS5jb20iLCJhdWQiOlsiY2xvdWQuZGV2LnVsdHJhd29tYmF0LmNvbSIsImh0dHBzOi8vY2FtdW5kYS1leGNpdGluZ2Rldi5ldS5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNzY5NjE1MTg2LCJleHAiOjE3Njk3MDE1ODYsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJhenAiOiJaUEN6bDNiZThkdnlRMTFLQ25YM1BmRlpkYTlXOGhvUCIsInBlcm1pc3Npb25zIjpbXX0.szzpE8I3sistn3IyhzTPSNJFX4IoxtT1MIN_zL9Bz6Ntcttw-hrheCt71hHQtQcY03Y_VkiNTQF5VuQC0GpTX37LDVem4sVafZCnuQpSuPTdqLj_HpgYDv9revG6KW4NMw8cMhgZ9yLBdf-J6HE92f5eFTwQl-Mqd1obYsd5f7Sa0kjj1cnfrMS4_qgwwbdoY1VNvunT0IAYvl-9lfDi5Q5MXFN9SWklf7zoBOudr6LAm6qJ6vDIPO2QJdZrF8UaTOg2ZmY1pFMMlR8WaYcnkP0w5MWdRc_-wxkpo_M2BmlFqsdBvBR3EoWDpP04fUKJ6E5s1PWUK2nB6PWMD6ZARQ';
  }
}

export default new CopilotAgentService();
