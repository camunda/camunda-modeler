/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import GuidedAppend from './GuidedAppend';
import GuidedAppendContextPadProvider from './GuidedAppendContextPadProvider';
import ElementActionsStrip from './ElementActionsStrip';
import ContextPadCenter from './ContextPadCenter';

export default {
  __init__: [ 'guidedAppendContextPadProvider', 'elementActionsStrip', 'contextPadCenter' ],
  guidedAppend:                   [ 'type', GuidedAppend ],
  guidedAppendContextPadProvider: [ 'type', GuidedAppendContextPadProvider ],
  elementActionsStrip:            [ 'type', ElementActionsStrip ],
  contextPadCenter:               [ 'type', ContextPadCenter ]
};
