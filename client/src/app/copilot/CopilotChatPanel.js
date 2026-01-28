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

export function CopilotChatPanel() {
  const { sendMessage, isBusy, stopGeneration, resetConversation } =
    useCopilotAdapter();

  return (
    <CopilotChat
      onSendMessage={ sendMessage }
      isBusy={ isBusy }
      onStopGeneration={ stopGeneration }
      onResetConversation={ resetConversation }
      workareaSelector="body"
      emptyStateTitle="Welcome to Copilot"
      emptyStateDescription="Ask me anything about documentation"
    />
  );
}
