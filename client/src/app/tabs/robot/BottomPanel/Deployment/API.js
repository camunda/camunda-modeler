/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export async function deployFile({ endpoint, name, script }) {
  const response = await fetch(endpoint + 'deploy', {
    method: 'POST',
    body: JSON.stringify({
      id: name,
      script
    }),
    headers: {
      'Content-Type': 'application/json',
    },

  }
  );

  return await response.json();
}


export async function runFile({ endpoint, name, script, variables }) {
  const body = {
    id: name,
    script
  };

  if (variables) {
    try {
      const parsedVariables = JSON.parse(variables);
      body.variables = parsedVariables;
    } catch (e) {

      // Run without variables
    }
  }


  const response = await fetch(endpoint + 'run', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },

  }
  );

  return await response.json();
}