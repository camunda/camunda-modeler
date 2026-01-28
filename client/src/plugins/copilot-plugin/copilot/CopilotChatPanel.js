/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';

import { CopilotChat } from '@camunda/copilot-chat';
import '@camunda/copilot-chat/style.css';

import { useCopilotAdapter } from './useCopilotAdapter';

export function CopilotChatPanel({ triggerAction, activeTab, mcpServers, modeler }) {
  const { sendMessage, isBusy, stopGeneration, resetConversation } =
    useCopilotAdapter({ triggerAction, activeTab, mcpServers, modeler });

  console.log('mcpServers in CopilotChatPanel:', mcpServers);
  return (
    <CopilotChat
      onSendMessage={ sendMessage }
      isBusy={ isBusy }
      onStopGeneration={ stopGeneration }
      onResetConversation={ resetConversation }
      workareaSelector=".copilot-container"
      emptyStateTitle="Welcome to Copilot"
      emptyStateDescription="Ask me anything about documentation"
    />
  );
}
