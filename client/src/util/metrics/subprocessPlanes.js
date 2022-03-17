/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { is } from 'bpmn-js/lib/util/ModelUtil';
import { getBpmnDefinitions } from '../parse';

export async function getSubprocessPlaneMetrics(file, type) {

  const {
    contents
  } = file;

  let metrics = {
    count: 0,
    nesting: 0
  };

  const definitions = await getBpmnDefinitions(contents, type);

  const diagrams = definitions.diagrams;

  const subprocessDiagrams = diagrams.filter(diagram => {
    const plane = diagram.plane;

    if (!plane) {
      return false;
    }

    const hasContent = plane.planeElement && plane.planeElement.length;

    return hasContent && is(plane.bpmnElement, 'bpmn:SubProcess');
  });

  if (!subprocessDiagrams.length) {
    return metrics;
  }

  const maximumNesting = Math.max(
    ...subprocessDiagrams.map(getNestingDegree)
  );

  metrics = {
    count: subprocessDiagrams.length,
    nesting: maximumNesting
  };

  return metrics;
}


// helpers ///////////////////////////////

function getNestingDegree(diagram) {
  let element = diagram.plane.bpmnElement;
  let nesting = 0;

  while (element && !is(element, 'bpmn:Process')) {
    element = element.$parent;
    nesting++;
  }

  return nesting;
}