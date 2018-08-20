import React, { Component } from 'react';

import Slot from './slot-fill/Slot';

import {
  Tab
} from './primitives';

export default class EmptyTab extends Component {
  render() {
    return (
      <Tab>
        <Slot name="empty-tab-buttons" />
      </Tab>
    );
  }
}