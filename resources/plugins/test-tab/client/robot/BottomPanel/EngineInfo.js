/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'camunda-modeler-plugin-helpers/react';
import { Fill } from 'camunda-modeler-plugin-helpers/components';

export default function() {
  return <>
    <Fill slot="status-bar__file" group="1_engine">
      <div>
        ROBOT
      </div>
    </Fill>
    <Fill slot="status-bar__file" group="1_engine">
      <div>
        Camunda 8
      </div>
    </Fill>
  </>;
}