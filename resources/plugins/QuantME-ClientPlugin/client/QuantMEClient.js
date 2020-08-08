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

import { Component } from 'camunda-modeler-plugin-helpers/react';

import QRMHandler from './QRMHandler';

/**
 * Client plugin to retrieve the current QRMs for the replacement from a Github repository
 */
export default class QuantMEClient extends Component {

  constructor(props) {

    super(props);

    props.subscribe('bpmn.modeler.created', (event) => {

      const {
        modeler
      } = event;

      // load current QRMs from defined Git repository and publish them via the event bus
      modeler.on('QRMs.update', (event) => {
        QRMHandler.getCurrentQRMs('UST-QuAntiL', 'QuantME-TransformationFramework')
          .then(result => {
            modeler._emit('QRMs.updated', { data: result });
          });
      });
    });
  }

  render() {
    return null;
  }
}
