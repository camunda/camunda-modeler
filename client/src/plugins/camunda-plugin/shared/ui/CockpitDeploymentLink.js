/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useMemo } from 'react';

import CockpitLink from './CockpitLink';

export default function CockpitDeploymentLink(props) {
  const {
    engineRestUrl,
    deployment
  } = props;

  const {
    id,
    deployedProcessDefinition
  } = deployment;

  const cockpitPath = useMemo(() => `/repository/?deploymentsQuery=%5B%7B%22type%22:%22id%22,%22operator%22:%22eq%22,%22value%22:%22${id}%22%7D%5D`, [ id ]);

  return (
    <CockpitLink engineRestUrl={ engineRestUrl } cockpitPath={ cockpitPath }>
      {
        deployedProcessDefinition
          ? (
            <div>
              Process definition ID:
              <code>{deployedProcessDefinition.id} </code>
            </div>
          )
          : null
      }
    </CockpitLink>
  );
}