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
 * A slot that may be filled by fills.
 *
 * @example <caption>Basic Usage</caption>
 *
 * ```jsx
 * <Slot name="foo" />
 * <Fill slot="foo" />
 * ```
 *
 * @example <caption>Grouping</caption>
 *
 * ```jsx
 * <Slot
 *   name="foo-slot"
 *   group={ (fills) => [ fills ] }
 *   separator={ () => <hr /> }
 * />
 * ```
 *
 * @example <caption>Replacing</caption>
 *
 * ```jsx
 * <Slot name="foo-slot"/>
 * <Fill name="foo-fill" slot="foo-slot" />
 * <Fill name="bar-fill" slot="foo-slot" replaces="foo-fill" />
 * ```
 */
export default class Slot extends PureComponent {

  render() {
    const {
      name,
      group = groupFills,
      separator = nonSeparator,
      Component
    } = this.props;

    return (
      <SlotContext.Consumer>{
        ({ fills }) => {
          const filtered = fills.filter(fill => fill.props.slot === name);

          const replaced = filtered.reduce((replaced, fill) => {
            if (!fill.props.name || !filtered.some(otherFill => otherFill.props.replaces === fill.props.name)) {
              replaced.push(fill);
            }

            return replaced;
          }, []);

          const sorted = replaced.slice().sort(comparePriority);

          const grouped = group(sorted);

          return createFills(grouped, fillFragment(Component), separator);
        }
      }</SlotContext.Consumer>
    );
  }

}

const fillFragment = (Component) => function FragmentFill(fill) {
  const { id, props } = fill;

  if (!Component) {
    return <Fragment key={ id }>{props.children}</Fragment>;
  }

  return <Component key={ id } { ...props } />;
};

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
