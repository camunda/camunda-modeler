import React, { Component, Fragment } from "react";

import { WithApp } from "./App";

import Slot from './slot-fill/Slot';

import { Tab } from './primitives';

class EmptyTab extends Component {
  render() {
    return (
      <Fragment>
        <Tab>
          <Slot name="empty-tab-buttons" />
        </Tab>
      </Fragment>
    );
  }
}

export default WithApp(EmptyTab);
