/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { getProcessVariablesCount } from './processVariables';
import { getUserTaskMetrics } from './userTasks';

export default async function(file) {
  let metrics = {};

  metrics.processVariablesCount = await getProcessVariablesCount(file);
  const userTaskMetrics = await getUserTaskMetrics(file);

  metrics = {
    ...metrics,
    tasks: {
      userTask: userTaskMetrics
    }
  };

  return metrics;
}
