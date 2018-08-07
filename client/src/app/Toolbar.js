import React, { Component } from 'react';

import Slot from './slot-fill/Slot';

import {
  Container
} from './Toolbar.css';

export default class Toolbar extends Component {
  render() {
    return (
      <div className={ Container }>
        <Slot name="buttons" group={ groupButtons } separator={ (key) => <hr key={ key } /> } />
      </div>
    );
  }
}


function groupButtons(buttonFills) {

  const defaultGroups = [
    'general',
    'save',
    'editor'
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