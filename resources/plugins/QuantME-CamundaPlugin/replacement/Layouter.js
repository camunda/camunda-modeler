/**
 * Copyright (c) 2020 Institute for the Architecture of Application System -
 * University of Stuttgart
 *
 * This program and the accompanying materials are made available under the
 * terms the Apache Software License 2.0
 * which is available at https://www.apache.org/licenses/LICENSE-2.0.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { isFlowLikeElement } from './Utilities';

/**
 * Layout the given process to avoid overlapping elements, etc.
 *
 * @param modeling the modeling component with the imported diagram
 * @param elementRegistry the element registry for the imported diagram
 * @param process the root element to start the layouting process
 */
export function layout(modeling, elementRegistry, process) {
  console.log('Layout with root element: ', process);

  // required nodes and edges for the layout method
  let nodes = [];
  let edges = [];

  // add flow elements from the process as nodes and edges
  let flowElements = process.flowElements;
  if (flowElements) {
    for (let i = 0; i < flowElements.length; i++) {
      if (isFlowLikeElement(flowElements[i].$type)) {
        console.log('Adding flow element as edge for layouting.', flowElements[i]);
        edges.push({ id: flowElements[i].id, sourceId: flowElements[i].sourceRef.id, targetId: flowElements[i].targetRef.id });
      } else {
        console.log('Adding flow element as node for layouting: ', flowElements[i]);

        // layout elements in subprocess
        if (flowElements[i].$type === 'bpmn:SubProcess') {
          console.log('Flow element is subprocess. Layouting contained elements...');
          let oldBounds = flowElements[i].di.bounds;
          modeling.resizeShape(elementRegistry.get(flowElements[i].id), { x: oldBounds.x, y: oldBounds.y, height: 10, width:10 });

          layout(modeling, elementRegistry, elementRegistry.get(flowElements[i].id).businessObject);
        }

        nodes.push(elementRegistry.get(flowElements[i].id));
      }
    }
  }

  // add artifacts from the process as nodes and edges
  let artifacts = process.artifacts;
  if (artifacts) {
    for (let i = 0; i < artifacts.length; i++) {
      let artifact = artifacts[i];

      console.log('Adding artifact as node for layouting: ', artifact);
      nodes.push(elementRegistry.get(artifact.id));

      if (artifact.$type === 'bpmn:Association') {
        edges.push({ id: artifact.id, sourceId: artifact.sourceRef.id, targetId: artifact.targetRef.id });
      }
    }
  }

  layoutWithDagre(modeling, elementRegistry, require('dagre'), nodes, edges, { rankdir: 'LR' });
}

function layoutWithDagre(modeling, elementRegistry, dagre, tasks, flows, options) {

  // create layouting graph
  var g = new dagre.graphlib.Graph();
  g.setGraph(options);

  // add tasks as nodes to the graph
  console.log('Adding %i tasks to the graph for layouting: ', tasks.length);
  for (let i = 0; i < tasks.length; i++) {
    let task = tasks[i];
    g.setNode(task.id, { label: task.id, width: task.width, height: task.height });
  }

  // add flows as edges to the graph
  console.log('Adding %i flows to the graph for layouting: ', flows.length);
  for (let i = 0; i < flows.length; i++) {
    let flow = flows[i];
    g.setEdge(flow['sourceId'], flow['targetId'], { label: flow['id'] });
  }

  // layout the graph
  dagre.layout(g);

  // move all tasks to their new position
  g.nodes().forEach(v => {
    console.log('Node ' + v + ': ' + JSON.stringify(g.node(v)));
    let node = g.node(v);
    let element = elementRegistry.get(v);

    // determine new position of task and move it there
    let to_move_x = node.x - element.x - element.width/2;
    let to_move_y = node.y - element.y - element.height/2;
    let delta_string = { x: to_move_x, y: to_move_y };
    modeling.moveElements([element], delta_string);
  });

  // replace waypoints of edges if defined
  g.edges().forEach(e => {
    console.log('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(g.edge(e)));
    let edge = g.edge(e);
    let points = edge.points;
    let element = elementRegistry.get(edge.label);
    let waypoints = element.waypoints;

    while (waypoints.length > 0) {
      waypoints.pop();
    }

    for (let pointsIndex = 0; pointsIndex < points.length; pointsIndex++) {
      let point;
      point = { x:points[pointsIndex].x, y: points[pointsIndex].y };
      waypoints.push(point);
    }

    element.waypoints = waypoints;
  });
}
