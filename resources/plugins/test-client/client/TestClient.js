/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { Fragment, Component } from 'camunda-modeler-plugin-helpers/react';

import { Fill } from 'camunda-modeler-plugin-helpers/components';


export default class TestClient extends Component {

  constructor(props) {

    super(props);

    const {
      subscribe
    } = props;

    subscribe('tab.saved', (event) => {
      const {
        tab
      } = event;

      const {
        saveCounter
      } = this.state;

      console.log('[TestClient]', 'Tab saved', tab);

      this.setState({
        saveCounter: saveCounter + 1
      });
    });

    this.state = {
      saveCounter: 0
    };
  }


  render() {

    const {
      saveCounter
    } = this.state;

    return (
      <Fragment>
        <Fill slot="toolbar">
          Saved: { saveCounter }
        </Fill>
      </Fragment>
    );
  }

}
