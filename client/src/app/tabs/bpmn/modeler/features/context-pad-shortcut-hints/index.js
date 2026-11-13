/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import HoverTooltipModule from 'diagram-js/lib/features/hover-tooltip';

import ContextPadShortcutHints from './ContextPadShortcutHints';

export default {
  __depends__: [ HoverTooltipModule ],
  __init__: [ 'contextPadShortcutHints' ],
  contextPadShortcutHints: [ 'type', ContextPadShortcutHints ]
};
