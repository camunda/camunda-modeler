/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import bpmn from './ai-agent-chat-with-tools.bpmn';
import initialRequestForm from './ai-agent-chat-initial-request.form';
import userFeedbackForm from './ai-agent-chat-user-feedback.form';

/**
 * The "AI Agent Chat Quick Start" blueprint of the getting started guide,
 * promoted on the start page.
 *
 * Copied from https://github.com/camunda/camunda-8-tutorials/tree/f45900306d3d1b7440252646849557083eb062b7/solutions/ai-agent-chat-with-tools
 *
 * Changed for Self-Managed: the AI Agent has no LLM endpoint and model, and no
 * authentication, as the Camunda-provided LLM exists on SaaS only. An annotation explains the setup.
 */
export default {
  name: 'AI Agent Chat Quick Start',

  // the main diagram comes first, it is shown after opening
  files: [
    { name: 'ai-agent-chat-with-tools.bpmn', contents: bpmn },
    { name: 'ai-agent-chat-initial-request.form', contents: initialRequestForm },
    { name: 'ai-agent-chat-user-feedback.form', contents: userFeedbackForm }
  ]
};
