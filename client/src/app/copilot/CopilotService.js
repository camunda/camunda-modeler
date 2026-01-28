/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

class CopilotService {
  constructor() {
    this.listeners = new Map();
  }

  subscribe(conversationId, onEvent) {
    this.listeners.set(conversationId, onEvent);
  }

  unsubscribe(conversationId) {
    this.listeners.delete(conversationId);
  }

  async sendMessage(payload) {
    const onEvent = this.listeners.get(payload.conversationId);

    if (!onEvent) {
      return;
    }

    onEvent({
      conversationId: payload.conversationId,
      type: "THINKING",
      status: "IN_PROGRESS",
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    onEvent({
      conversationId: payload.conversationId,
      type: "THINKING",
      status: "IN_PROGRESS",
      content: `Echo: ${payload.content}`,
    });

    onEvent({
      conversationId: payload.conversationId,
      type: "EXECUTION_COMPLETE",
      status: "COMPLETED",
    });
  }

  async sendToolResult() {}
}

export default new CopilotService();
