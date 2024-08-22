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
import { Fill } from '../../../../slot-fill';

export default function RobotOutputTab(props) {
  const {
    layout = {}
  } = props;


  return <>
    <Fill slot="bottom-panel"
      id="robot-output"
      label="Robot Output"
      layout={ layout }
      priority={ 15 }>
      <div>
        <h3>Last run:</h3>
        <Content { ...props } />
      </div>
    </Fill>
  </>;
}


function Content(props) {
  const {
    output,
    isRunning
  } = props;

  if (isRunning) {
    return <div className="running">Running...</div>;
  }
  else if (!output) {
    return <div className="empty">Run a script to see the Output here.</div>;
  }
  else {
    return <pre>{ output.stdOut }</pre>;
  }
}