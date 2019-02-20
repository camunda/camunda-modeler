/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { PureComponent } from 'react';

import Slot from './slot-fill/Slot';

import css from './Toolbar.less';

export default class Toolbar extends PureComponent {
  render() {
    return (
      <div className={ css.Toolbar }>
        <Slot name="toolbar" group={ groupButtons } separator={ (key) => <Separator key={ key } /> } />
      </div>
    );
  }
}

function Separator(props) {
  return (
    <span className={ 'separator' } { ...props }></span>
  );
}


function groupButtons(buttonFills) {

  const defaultGroups = [
    'general',
    'save',
    'editor',
    'export'
  ];

  const groups = [];

  const groupsById = {};

  defaultGroups.forEach(function(groupName) {

    const group = [];

    groupsById[groupName] = group;
    groups.push(group);
  });

  buttonFills.forEach(function(button) {

    const groupName = button.props.group || '__default';

    let group = groupsById[groupName];

    if (!group) {
      group = [];
      groupsById[groupName] = group;
      groups.push(group);
    }

    group.push(button);
  });

  return groups.filter(function(group) {
    return group.length;
  });
}