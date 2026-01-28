/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { useMemo } from "react";
import { useAgentAdapter } from "@camunda/copilot-chat";

import CopilotService from "./CopilotService";

const createTransport = () => ({
  subscribe: (conversationId, onEvent) => {
    CopilotService.subscribe(conversationId, onEvent);
  },
  unsubscribe: (conversationId) => {
    CopilotService.unsubscribe(conversationId);
  },
  sendMessage: (payload) => CopilotService.sendMessage(payload),
  sendToolResult: (payload) => CopilotService.sendToolResult(payload),
});

const getStatusLabel = (eventType, toolName) => {
  const labels = {
    THINKING: "Thinking...",
    EXECUTION_PLAN: "Planning execution...",
    TOOL_PLANNING: toolName
      ? `Planning to use ${toolName}...`
      : "Planning tool use...",
    TOOL_INVOKE: toolName ? `Running ${toolName}...` : "Running tool...",
    TOOL_RESULT: toolName ? `${toolName} completed` : "Tool completed",
  };
  return labels[eventType] || "Thinking...";
};

export const useCopilotAdapter = () => {
  const transport = useMemo(() => createTransport(), []);

  return useAgentAdapter({
    transport,
    frontendTools: [],
    getStatusLabel,
  });
};
