/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { PureComponent, Fragment } from 'react';

import SlotContext from './SlotContext';


/**
 * A slot to be filled via <Fill> elements.
 *
 * @example
 *
 * <!-- default slot, shows fills in registration order -->
 *
 * <Slot name="toolbar" />
 *
 * <!-- slot with custom grouping and separators -->
 *
 * <Slot
 *   name="toolbar"
 *   group={ (fills) => [ fills ] }
 *   separator={ () => <hr /> }
 * />
 *
 * <!-- slot holding the first registered fill only -->
 *
 * <Slot
 *   name="special-button"
 *   limit={ 1 }
 * />
 *
 */
export default class Slot extends PureComponent {

  render() {
    const {
      name,
      group = groupFills,
      separator = nonSeparator,
      limit
    } = this.props;

    return (
      <SlotContext.Consumer>{
        ({ fills }) => {

          const filtered = fills.filter(fill => {
            return fill.props.slot === name;
          });

          const cropped = limit ? filtered.slice(0, limit) : filtered;

          const grouped = group(cropped);

          return createFills(grouped, fillFragment, separator);
        }
      }</SlotContext.Consumer>
    );
  }

}

function fillFragment(fill) {
  return <Fragment key={ fill.id }>{fill.props.children}</Fragment>;
}

function nonSeparator(key) {
  return null;
}

function createFills(arrays, fillFn, separatorFn) {

  var result = [];

  arrays.forEach(function(array, idx) {

    if (idx !== 0) {
      const separator = separatorFn(`__separator_${idx}`);

      if (separator) {
        result.push(separator);
      }
    }

    array.forEach(function(fill) {
      result.push(fillFn(fill));
    });
  });

  return result;
}

/**
 * Group fills based on group name and priority.
 *
 * @param {Array<Component>} fills
 *
 * @return {Array<Array<Component>>} grouped fills
 */
function groupFills(fills) {

  const groups = [];

  const groupsById = {};

  fills.forEach(function(fill) {

    const {
      group: groupName = 'z_default'
    } = fill.props;

    let group = groupsById[groupName];

    if (!group) {
      groupsById[groupName] = group = [];
      groups.push(group);
    }

    group.push(fill);
  });

  // sort within groups based on priority [default = 0]
  groups.forEach(group => group.sort(comparePriority));

  return Object.keys(groupsById)
    .sort()
    .map(id => groupsById[id]);
}

function comparePriority(a, b) {
  return (b.props.priority || 0) - (a.props.priority || 0);
}
