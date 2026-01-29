/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useRef } from 'react';

import { CopilotChat } from '@camunda/copilot-chat';
import '@camunda/copilot-chat/style.css';

import { useCopilotAdapter } from './useCopilotAdapter';
import { backend } from '../../../globals';
import { isInput } from '../../../util/dom/isInput';

export function CopilotChatPanel({ triggerAction, activeTab, mcpServers, modeler }) {
  const { sendMessage, isBusy, stopGeneration, resetConversation } =
    useCopilotAdapter({ triggerAction, activeTab, mcpServers, modeler });

  const chatActiveRef = useRef(false);

  useEffect(() => {
    if (!triggerAction) {
      return;
    }

    const isChatNode = (node) => {
      const element = getElement(node);

      return Boolean(
        element &&
        element.closest &&
        element.closest('.copilot-chat-panel, .copilot-container, [data-copilot-chat-host]')
      );
    };

    const getChatState = () => {
      const activeElement = document.activeElement;
      const inputActive = Boolean(
        activeElement &&
        isChatNode(activeElement) &&
        isInput(activeElement)
      );

      const hasSelection = hasChatSelection(activeElement, isChatNode);

      return {
        inputActive,
        hasSelection
      };
    };

    const updateChatMenu = ({ inputActive, hasSelection }, options = {}) => {
      triggerAction('update-menu', {
        editMenu: getChatEditMenu({ inputActive, hasSelection }),
        ...options
      });
    };

    const handleFocusIn = (event) => {
      if (isChatNode(event.target)) {
        chatActiveRef.current = true;

        updateChatMenu(getChatState());
      } else if (chatActiveRef.current) {
        chatActiveRef.current = false;
        triggerAction('update-menu');
      }
    };

    const handleSelectionChange = () => {
      const state = getChatState();

      if (state.inputActive || state.hasSelection) {
        updateChatMenu(state);
      }
    };

    const handleContextMenu = (event) => {
      if (!isChatNode(event.target)) {
        return;
      }

      event.preventDefault();

      const state = getChatState();

      updateChatMenu(state, {
        contextMenu: getChatContextMenu(state)
      });

      backend.showContextMenu('copilot-chat');
    };

    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [ triggerAction ]);

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

function getElement(node) {
  if (!node) {
    return null;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    return node;
  }

  return node.parentElement || null;
}

function hasChatSelection(activeElement, isChatNode) {
  if (activeElement && isInput(activeElement)) {
    return hasInputSelection(activeElement);
  }

  const selection = window.getSelection();

  if (!selection || selection.isCollapsed) {
    return false;
  }

  const hasText = selection.toString().length > 0;

  return hasText && (isChatNode(selection.anchorNode) || isChatNode(selection.focusNode));
}

function hasInputSelection(element) {
  try {
    return element.selectionStart !== element.selectionEnd;
  } catch (error) {
    return false;
  }
}

function getChatEditMenu({ inputActive, hasSelection }) {
  const copyEnabled = inputActive || hasSelection;

  return [
    [
      { role: 'undo', enabled: inputActive },
      { role: 'redo', enabled: inputActive }
    ],
    [
      { role: 'cut', enabled: inputActive },
      { role: 'copy', enabled: copyEnabled },
      { role: 'paste', enabled: inputActive },
      { role: 'selectAll', enabled: inputActive }
    ]
  ];
}

function getChatContextMenu({ inputActive, hasSelection }) {
  const copyEnabled = inputActive || hasSelection;

  return [
    { label: 'Undo', role: 'undo', enabled: inputActive },
    { label: 'Redo', role: 'redo', enabled: inputActive },
    { type: 'separator' },
    { label: 'Cut', role: 'cut', enabled: inputActive },
    { label: 'Copy', role: 'copy', enabled: copyEnabled },
    { label: 'Paste', role: 'paste', enabled: inputActive },
    { type: 'separator' },
    { label: 'Select All', role: 'selectAll', enabled: inputActive }
  ];
}
