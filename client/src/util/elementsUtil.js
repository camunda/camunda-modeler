/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { forEach, isArray } from 'min-dash';

/**
 * Iterate over each element in a collection, calling the iterator function `fn`
 * with (element, index, recursionDepth).
 *
 * Recurse into all elements that are returned by `fn`.
 *
 * @param  {Object|Array<Object>} elements
 * @param  {Function} fn iterator function called with (element, index, recursionDepth)
 * @param  {number} [depth] maximum recursion depth
 */
function eachElement(elements, fn, depth) {
  depth = depth || 0;

  if (!isArray(elements)) {
    elements = [elements];
  }

  forEach(elements, function(s, i) {
    var filter = fn(s, i, depth);

    if (isArray(filter) && filter.length) {
      eachElement(filter, fn, depth + 1);
    }
  });
}

/**
 * Adds an element to a collection and returns true if the
 * element was added.
 *
 * @param {Array<Object>} elements
 * @param {Object} e
 * @param {boolean} unique
 */
function add(elements, e, unique) {
  var canAdd = !unique || elements.indexOf(e) === -1;

  if (canAdd) {
    elements.push(e);
  }

  return canAdd;
}

/**
 * Collects self + flow elements up to a given depth from a list of elements.
 *
 * @param  {ModdleElement|Array<ModdleElement>} elements the elements to select the flowElements from
 * @param  {boolean} unique whether to return a unique result set (no duplicates)
 * @param  {number} maxDepth the depth to search through or -1 for infinite
 *
 * @return {Array<ModdleElement>} found elements
 */
function selfAndFlowElements(elements, unique, maxDepth) {
  var result = [],
      processedFlowElements = [];

  eachElement(elements, function(element, i, depth) {
    add(result, element, unique);

    var flowElements = element.flowElements;

    // max traversal depth not reached yet
    if (maxDepth === -1 || depth < maxDepth) {

      // flowElements exist && flowElements not yet processed
      if (flowElements && add(processedFlowElements, flowElements, unique)) {
        return flowElements;
      }
    }
  });

  return result;
}

/**
 * Return self + ALL flowElements for a number of elements
 *
 * @param  {Array<ModdleElement>} elements to query
 * @param  {boolean} allowDuplicates to allow duplicates in the result set
 *
 * @return {Array<ModdleElement>} the collected elements
 */
export function selfAndAllFlowElements(elements, allowDuplicates) {
  return selfAndFlowElements(elements, !allowDuplicates, -1);
}