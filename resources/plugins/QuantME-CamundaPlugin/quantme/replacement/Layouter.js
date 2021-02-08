/**
 * Copyright (c) 2021 Institute of Architecture of Application Systems -
 * University of Stuttgart
 *
 * This program and the accompanying materials are made available under the
 * terms the Apache Software License 2.0
 * which is available at https://www.apache.org/licenses/LICENSE-2.0.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { isFlowLikeElement } from '../Utilities';
import { is } from 'bpmn-js/lib/util/ModelUtil';

// space between multiple boundary events of a task/subprocess
let BOUNDARY_EVENT_MARGIN = '10';

// space between an edge and a corresponding label
let LABEL_MARGIN = '10';

/**
 * Layout the given process
 *
 * @param modeling the modeling component with the imported diagram
 * @param elementRegistry the element registry for the imported diagram
 * @param process the root element to start the layouting process
 */
export function layout(modeling, elementRegistry, process) {
  layoutProcess(modeling, elementRegistry, process);
  layoutBoundaryEvents(modeling, elementRegistry);
  layoutWaypoints(modeling, elementRegistry);
}

/**
 * Layout the given process to avoid overlapping elements, etc.
 *
 * @param modeling the modeling component with the imported diagram
 * @param elementRegistry the element registry for the imported diagram
 * @param process the root element to start the layouting process
 */
function layoutProcess(modeling, elementRegistry, process) {
  console.log('Layout with root element: ', process);

  // required nodes and edges for the layout method
  let nodes = [];
  let edges = [];

  // add flow elements from the process as nodes and edges
  let flowElements = process.flowElements;
  if (flowElements) {
    for (let i = 0; i < flowElements.length; i++) {
      if (isFlowLikeElement(flowElements[i].$type)) {
        edges.push(getEdgeFromFlowElement(elementRegistry, flowElements[i]));
      } else {

        // layout elements in subprocess
        if (flowElements[i].$type === 'bpmn:SubProcess') {
          console.log('Flow element is subprocess. Layouting contained elements...');
          let oldBounds = flowElements[i].di.bounds;
          modeling.resizeShape(elementRegistry.get(flowElements[i].id), {
            x: oldBounds.x,
            y: oldBounds.y,
            height: 10,
            width: 10
          });

          layoutProcess(modeling, elementRegistry, elementRegistry.get(flowElements[i].id).businessObject);
        }

        // boundary events are skipped here, as they are always attached to some task and only this task has to be layouted
        if (flowElements[i].$type === 'bpmn:BoundaryEvent') {
          continue;
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

  // layout the diagram using the dagre graph library
  layoutWithDagre(modeling, elementRegistry, require('dagre'), nodes, edges, {
    rankdir: 'LR',
    align: 'UL',
    ranker: 'longest-path'
  });
}

/**
 * Layout the boundary events in the diagram to display them at the tasks to which they are attached
 *
 * @param modeling the modeling component with the imported diagram
 * @param elementRegistry the element registry for the imported diagram
 */
function layoutBoundaryEvents(modeling, elementRegistry) {
  let layoutedBoundaries = {};

  // add the boundary events to the new location of the tasks to which they are attached
  for (let boundaryEvent of elementRegistry.getAll()) {
    if (boundaryEvent.type === 'bpmn:BoundaryEvent') {

      // retrieve the required elements from the registry
      let boundaryEventShape = elementRegistry.get(boundaryEvent.id);
      let attachedToElementShape = elementRegistry.get(boundaryEventShape.businessObject.attachedToRef.id);
      let boundaryEventBounds = boundaryEventShape.businessObject.di.bounds;
      let attachedToBounds = attachedToElementShape.businessObject.di.bounds;

      // get all boundary events that were already attached to this element to move the current one beneath the last one
      let attachedToElementBoundaries = [];
      if (layoutedBoundaries[attachedToElementShape.id]) {
        attachedToElementBoundaries = layoutedBoundaries[attachedToElementShape.id];
      }

      // place the boundary events at the bottom right corner of the parent element
      let bottomOfAttached = attachedToBounds.x - boundaryEventBounds.x + attachedToBounds.width;
      let offset = (attachedToElementBoundaries.length + 1) * (parseInt(boundaryEventBounds.width) + parseInt(BOUNDARY_EVENT_MARGIN));
      let to_move_x = bottomOfAttached - offset;
      let to_move_y = attachedToBounds.y - boundaryEventBounds.y + attachedToBounds.height - boundaryEventBounds.height / 2;
      modeling.moveShape(boundaryEventShape, { x: to_move_x, y: to_move_y });

      // update list for the next boundary event
      attachedToElementBoundaries.push(boundaryEventShape.id);
      layoutedBoundaries[attachedToElementShape.id] = attachedToElementBoundaries;

      // layout the waypoints of the connections of the boundary events
      for (let outgoingConnection of boundaryEvent.outgoing) {
        let connectionShape = elementRegistry.get(outgoingConnection.id);

        // replace the first waypoint with the new bounds of the boundary event
        let waypoints = connectionShape.waypoints;
        let sourceX = boundaryEventBounds.x + boundaryEventBounds.width / 2;
        let sourceY = boundaryEventBounds.y + boundaryEventBounds.height;
        waypoints.shift();
        waypoints.unshift({ x: sourceX, y: sourceY });

        // update diagram
        modeling.updateWaypoints(connectionShape, waypoints);
      }
    }
  }
}

/**
 * Layout the waypoints of all SequenceFlow elements in the BPMN diagram, e.g., by trying to make the edges cornered
 *
 * @param modeling the modeling component with the imported diagram
 * @param elementRegistry the element registry for the imported diagram
 */
function layoutWaypoints(modeling, elementRegistry) {
  for (let element of elementRegistry.getAll()) {
    if (element.type === 'bpmn:SequenceFlow') {
      let sourceShape = elementRegistry.get(element.businessObject.sourceRef.id);
      let targetShape = elementRegistry.get(element.businessObject.targetRef.id);

      // fix invalid start/end waypoints for gateways
      adaptGatewayWaypoints(modeling, element, sourceShape, targetShape);

      // fix diagonal edges
      layoutWaypointsOfSequenceFlow(modeling, element, sourceShape, targetShape);

      // remove duplicate waypoints added by the graph layouting algorithm
      removeDuplicateWaypoints(modeling, element);

      // move labels for edges to the new edge position
      adaptLabels(modeling, element);
    }
  }
}

/**
 * Remove duplicate waypoints (same x and y coordinate)
 *
 * @param modeling the modeling component with the imported diagram
 * @param connection the connection to remove the duplicate waypoints from
 */
function removeDuplicateWaypoints(modeling, connection) {

  // remove waypoint if it has the same x and y coordinate as the following
  let newWaypoints = [];
  let oldWaypoints = connection.waypoints;
  for (let i = 0; i < oldWaypoints.length - 1; i++) {
    let firstWaypoint = oldWaypoints[i];
    let secondWaypoint = oldWaypoints[i + 1];

    // only add waypoint if it is different from the following
    if (firstWaypoint.x !== secondWaypoint.x || firstWaypoint.y !== secondWaypoint.y) {
      newWaypoints.push(firstWaypoint);
    }
  }
  newWaypoints.push(oldWaypoints[oldWaypoints.length - 1]);

  // update model with new set of waypoints
  modeling.updateWaypoints(connection, newWaypoints);

  // recursively check if there are more waypoints to remove
  if (oldWaypoints.length !== newWaypoints.length) {
    removeDuplicateWaypoints(modeling, connection);
  }
}

/**
 * Move labels to the edges after layouting them
 *
 * @param modeling the modeling component with the imported diagram
 * @param connection the connection to adapt the labels for
 */
function adaptLabels(modeling, connection) {
  if (connection.labels && connection.labels.length === 1) {

    // place the first label of the given connection
    let firstLabel = connection.labels[0];
    let middle = getMiddleOfLocation(connection, firstLabel);
    modeling.moveElements([firstLabel], { x: middle.x - firstLabel.x, y: middle.y - firstLabel.y });
  }

  // TODO: handle cases with multiple labels defined for the connection
}

/**
 * Get the middle point of the given connection to place the given label
 *
 * @param connection the connection to get the middle for
 * @param label the label to relocate
 */
function getMiddleOfLocation(connection, label) {

  // get the two waypoints from the middle of the connection
  let waypoints = connection.waypoints;
  let middleWaypointIndex = Math.round(waypoints.length / 2);
  let middlePoint1 = waypoints[middleWaypointIndex - 1];
  let middlePoint2 = waypoints[middleWaypointIndex];

  if (middlePoint1.x === middlePoint2.x) {
    return { x: middlePoint1.x - LABEL_MARGIN - parseInt(label.width), y: (middlePoint1.y + middlePoint2.y) / 2 };
  }

  if (middlePoint1.y === middlePoint2.y) {
    return { x: (middlePoint1.x + middlePoint2.x) / 2, y: middlePoint1.y - LABEL_MARGIN - parseInt(label.height) };
  }

  return { x: (middlePoint1.x + middlePoint2.x) / 2, y: (middlePoint1.y + middlePoint2.y) / 2 - LABEL_MARGIN - parseInt(label.height) };
}

/**
 * Adapt the first/last waypoint of the given connection if it is attached to a gateway and is not centered on one side of the gateway
 *
 * @param modeling the modeling component with the imported diagram
 * @param connection the connection to adapt the waypoints from
 * @param sourceShape the source shape of the connection
 * @param targetShape the target shape of the connection
 */
function adaptGatewayWaypoints(modeling, connection, sourceShape, targetShape) {

  // move first waypoint of gateways to their center if not already there
  if (is(sourceShape.businessObject, 'bpmn:Gateway')) {
    let firstWaypoint = moveToMiddleOfShape(connection.waypoints.shift(), sourceShape);
    connection.waypoints.unshift(firstWaypoint);
  }

  if (is(targetShape.businessObject, 'bpmn:Gateway')) {
    let lastWaypoint = moveToMiddleOfShape(connection.waypoints.pop(), targetShape);
    connection.waypoints.push(lastWaypoint);
  }
}

/**
 * Move the given waypoint to the middle of the side of the given shape where it is attached to. If the waypoint does not touch one of the sides, it is not changed.
 *
 * @param waypoint the waypoint to move to the middle of one side of the given shape
 * @param shape the shape to align the waypoint at
 */
function moveToMiddleOfShape(waypoint, shape) {
  if (waypoint.x === shape.x || waypoint.x === shape.x + shape.width) {
    waypoint.y = shape.y + shape.width / 2;
  }
  if (waypoint.y === shape.y || waypoint.y === shape.y + shape.height) {
    waypoint.x = shape.x + shape.height / 2;
  }
  return waypoint;
}

/**
 * Layout the waypoints of the given connection
 *
 * @param modeling the modeling component with the imported diagram
 * @param connection the connection to layout the waypoints for
 * @param source the source element of the connection
 * @param target the target element of the connection
 */
function layoutWaypointsOfSequenceFlow(modeling, connection, source, target) {

  let waypoints = connection.waypoints;
  if (waypoints.length === 2) {

    // no layouting required for a direct connection
    return;
  }

  // make connection cornered
  if (waypoints.length === 3) {
    if (target.y < source.y) {

      // edge goes upwards
      waypoints[1].x = waypoints[2].x;
      waypoints[1].y = waypoints[0].y;
    } else {

      // edge goes downwards
      waypoints[1].x = waypoints[0].x;
      waypoints[1].y = waypoints[2].y;
    }
    modeling.updateWaypoints(connection, waypoints);
  }

  // TODO: layout edges with more waypoints
}

/**
 * Generate a edge for the layout graph from the given flow element
 *
 * @param elementRegistry the element registry to access all elements in the diagram
 * @param flowElement the flow element representing a edge in the layouting graph
 * @return the edge for the dagre graph
 */
function getEdgeFromFlowElement(elementRegistry, flowElement) {
  let sourceElement = elementRegistry.get(flowElement.sourceRef.id).businessObject;
  if (sourceElement.$type === 'bpmn:BoundaryEvent') {
    console.log('Source element is BoundaryEvent. Adding attached task as source for the edge...');
    sourceElement = sourceElement.attachedToRef;
  }

  return { id: flowElement.id, sourceId: sourceElement.id, targetId: flowElement.targetRef.id };
}

/**
 * Generate a basic layout of the current diagram using the dagre graph library
 */
function layoutWithDagre(modeling, elementRegistry, dagre, tasks, flows, options) {

  // create layouting graph
  let g = new dagre.graphlib.Graph();
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
    let node = g.node(v);
    let element = elementRegistry.get(v);

    // determine new position of task and move it there
    let to_move_x = node.x - element.x - element.width / 2;
    let to_move_y = node.y - element.y - element.height / 2;
    let delta_string = { x: to_move_x, y: to_move_y };
    modeling.moveElements([element], delta_string);
  });

  // replace waypoints of edges if defined
  g.edges().forEach(e => {
    let edge = g.edge(e);
    let points = edge.points;
    let element = elementRegistry.get(edge.label);
    let waypoints = element.waypoints;

    while (waypoints.length > 0) {
      waypoints.pop();
    }

    for (let pointsIndex = 0; pointsIndex < points.length; pointsIndex++) {
      let point;
      point = { x: points[pointsIndex].x, y: points[pointsIndex].y };
      waypoints.push(point);
    }

    element.waypoints = waypoints;
  });
}
