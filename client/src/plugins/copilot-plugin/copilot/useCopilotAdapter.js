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
import { applyLayoutAndImport } from './bpmnLayoutUtils';

const createTransport = (mcpServers) => ({
  subscribe: (conversationId, onEvent) => {
    CopilotAgentService.subscribe(conversationId, onEvent);
  },
  unsubscribe: (conversationId) => {
    CopilotAgentService.unsubscribe(conversationId);
  },
  sendMessage: (payload) =>
    CopilotAgentService.sendMessage(payload, mcpServers),
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

const CREATE_BPMN_DIAGRAM_CAMUNDA_8_SCHEMA = {
  name: 'create_bpmn_diagram_camunda_8',
  description:
    'Creates a new BPMN diagram for Camunda 8 (Zeebe). This opens a new tab with an empty BPMN diagram configured for Camunda 8 execution platform. Use this when the user wants to create a new file/process/workflow for Camunda 8.',
  parametersSchema: '{}',
};

const GET_CURRENT_FILE_INFO_SCHEMA = {
  name: 'get_current_file_info',
  description:
    'Gets information about the currently active file in the modeler. Returns the file path, file name, and directory path. Use this to get the folder location for git operations or when you need to know where the current diagram is saved. Returns null values if the file has not been saved yet.',
  parametersSchema: '{}',
};

const SAVE_CURRENT_FILE_SCHEMA = {
  name: 'save_current_file',
  description:
    'Saves the currently active file. If the file has never been saved.',
  parametersSchema: '{}',
};

export const createLayoutBpmnTool = (modeler) => ({
  ...LAYOUT_BPMN_TOOL_SCHEMA,
  handler: async (args, onError) => {
    try {
      const xml = args.bpmnXml;
      return await applyLayoutAndImport(xml, modeler);
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

export const createBpmnDiagramCamunda8Tool = (triggerAction) => ({
  ...CREATE_BPMN_DIAGRAM_CAMUNDA_8_SCHEMA,
  handler: async (_, onError) => {
    try {
      await triggerAction('create-cloud-bpmn-diagram');
      return 'Successfully created a new BPMN diagram for Camunda 8. The diagram is now open in a new tab.';
    } catch (error) {
      console.error('[createBpmnDiagramCamunda8Tool] Creation error:', error);
      onError(CREATE_BPMN_DIAGRAM_CAMUNDA_8_SCHEMA.name, error);
      throw new Error(`Failed to create BPMN diagram: ${error.message}`);
    }
  },
});

export const createGetCurrentFileInfoTool = (activeTab) => ({
  ...GET_CURRENT_FILE_INFO_SCHEMA,
  handler: async (_, onError) => {
    try {
      if (!activeTab || !activeTab.file) {
        return JSON.stringify({
          filePath: null,
          fileName: null,
          directoryPath: null,
          isSaved: false,
          message: 'No file is currently open in the modeler.'
        });
      }

      const { file } = activeTab;
      const filePath = file.path || null;
      const fileName = file.name || null;

      // Extract directory path from file path
      let directoryPath = null;
      if (filePath) {
        const lastSeparatorIndex = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
        if (lastSeparatorIndex > 0) {
          directoryPath = filePath.substring(0, lastSeparatorIndex);
        }
      }

      return JSON.stringify({
        filePath,
        fileName,
        directoryPath,
        isSaved: !!filePath,
        fileType: activeTab.type || null,
        message: filePath
          ? `File is saved at: ${filePath}`
          : 'File has not been saved yet. Use save_current_file tool to save it first.'
      });
    } catch (error) {
      console.error('[createGetCurrentFileInfoTool] Error:', error);
      onError(GET_CURRENT_FILE_INFO_SCHEMA.name, error);
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  },
});

export const createSaveCurrentFileTool = (triggerAction, activeTab) => ({
  ...SAVE_CURRENT_FILE_SCHEMA,
  handler: async (_, onError) => {
    try {
      if (!activeTab) {
        return JSON.stringify({
          success: false,
          message: 'No file is currently open to save.'
        });
      }

      const saved = await triggerAction('save-tab', { tab: activeTab });

      if (saved) {

        // Get updated tab info after save
        const filePath = saved?.file?.path || null;

        return JSON.stringify({
          success: true,
          filePath,
          message: filePath
            ? `File saved successfully at: ${filePath}`
            : 'Save was cancelled by user.'
        });
      } else {
        return JSON.stringify({
          success: false,
          message: 'Save was cancelled or failed.'
        });
      }
    } catch (error) {
      console.error('[createSaveCurrentFileTool] Error:', error);
      onError(SAVE_CURRENT_FILE_SCHEMA.name, error);
      throw new Error(`Failed to save file: ${error.message}`);
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

export const useCopilotAdapter = ({ triggerAction, activeTab, mcpServers, modeler }) => {
  const transport = createTransport(mcpServers);

  const frontendTools = useMemo(() => {
    const tools = [];

    if (triggerAction) {
      tools.push(createBpmnDiagramCamunda8Tool(triggerAction));
    }

    if (activeTab) {
      tools.push(createGetCurrentFileInfoTool(activeTab));
    }

    if (triggerAction && activeTab) {
      tools.push(createSaveCurrentFileTool(triggerAction, activeTab));
    }

    if (modeler) {
      tools.push(createLayoutBpmnTool(modeler));
      tools.push(getCurrentBpmnXmlTool(modeler));
    }

    return tools;
  }, [ triggerAction, activeTab, modeler ]);

  return useAgentAdapter({
    transport,
    frontendTools,
    getStatusLabel,

  });
};
