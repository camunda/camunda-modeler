/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { useMemo } from 'react';
import { useAgentAdapter } from '@camunda/copilot-chat';

import CopilotAgentService from './CopilotAgentService';

const createTransport = () => ({
  subscribe: (conversationId, onEvent) => {
    CopilotAgentService.subscribe(conversationId, onEvent);
  },
  unsubscribe: (conversationId) => {
    CopilotAgentService.unsubscribe(conversationId);
  },
  sendMessage: (payload) => CopilotAgentService.sendMessage(payload),
  sendToolResult: (payload) => CopilotAgentService.sendToolResult(payload),
});

const LAYOUT_BPMN_TOOL_SCHEMA = {
  name: 'layout_bpmn_xml',
  description:
    'Applies automatic layout to BPMN XML to improve visual appearance. This tool takes BPMN XML and returns a laid-out version with better positioning of elements.',
  parametersSchema: JSON.stringify({
    type: 'object',
    properties: {
      bpmnXml: {
        type: 'string',
        description: 'The BPMN XML content to layout',
      },
    },
    required: [ 'bpmnXml' ],
  }),
};

const GET_CURRENT_BPMN_XML_SCHEMA = {
  name: 'get_current_bpmn_xml',
  description:
    'Retrieves the current BPMN XML from the modeler. This tool takes no parameters and returns the BPMN XML content of the current diagram.',
  parametersSchema: '{}',
};

export const createLayoutBpmnTool = (modeler, onDiagramChange) => ({
  ...LAYOUT_BPMN_TOOL_SCHEMA,
  handler: async (args, onError) => {
    try {

      // const xml = args.bpmnXml;
      // return await applyLayoutAndImport(xml, modeler, onDiagramChange);

      // above is web modeler implementation

    } catch (error) {
      console.error('[createLayoutBpmnTool] Layout error:', error);
      onError(LAYOUT_BPMN_TOOL_SCHEMA.name, error);
      throw new Error(`Failed to layout BPMN: ${error.message}`);
    }
  },
});

export const getCurrentBpmnXmlTool = (modeler) => ({
  ...GET_CURRENT_BPMN_XML_SCHEMA,
  handler: async (_, onError) => {
    try {
      const { xml } = await modeler.saveXML({ format: false });
      return xml;

      // above is web modeler implementation

    } catch (error) {
      console.error('[getCurrentBpnXmlTool] Retrieval error:', error);
      onError(GET_CURRENT_BPMN_XML_SCHEMA.name, error);
      throw new Error(`Failed to retrieve BPMN: ${error.message}`);
    }
  },
});

const getStatusLabel = (eventType, toolName) => {
  const labels = {
    THINKING: 'Thinking...',
    EXECUTION_PLAN: 'Planning execution...',
    TOOL_PLANNING: toolName
      ? `Planning to use ${toolName}...`
      : 'Planning tool use...',
    TOOL_INVOKE: toolName ? `Running ${toolName}...` : 'Running tool...',
    TOOL_RESULT: toolName ? `${toolName} completed` : 'Tool completed',
  };
  return labels[eventType] || 'Thinking...';
};

export const useCopilotAdapter = () => {
  const transport = useMemo(() => createTransport(), []);

  // const frontendTools = useMemo(() => {
  //   const layoutTool = modeler
  //     ? createLayoutBpmnTool(modeler, onDiagramChange)
  //     : null;
  //   const getBpmnXmlTool = modeler ? getCurrentBpmnXmlTool(modeler) : null;
  //   return [ layoutTool, getBpmnXmlTool ].filter((tool) => tool !== null);
  // }, [ modeler, onDiagramChange ]);

  // above is web modeler implementation

  return useAgentAdapter({
    transport,
    frontendTools: [],
    getStatusLabel,
  });
};
