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

import * as css from './GuidedStart.less';


/**
 * Informational stub for the "Start with AI" side panel tab.
 * AI-assisted modeling is available in Web Modeler; this communicates
 * the roadmap intent for Desktop Modeler.
 */
export default function AiSidePanelTab() {
  return (
    <div className={ css.aiPanel }>
      <div className={ css.aiPanelIcon }>✦</div>
      <h3 className={ css.aiPanelHeading }>Start with AI</h3>
      <p className={ css.aiPanelText }>
        AI-assisted process modeling is available in <strong>Web Modeler</strong> today and is coming to Desktop Modeler in a future release (planned 8.10).
      </p>
    </div>
  );
}
