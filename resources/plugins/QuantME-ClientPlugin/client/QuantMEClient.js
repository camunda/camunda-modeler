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
import { config } from './Config';

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

      // add possibility to trigger notifications from the modeler which are displayed at the client
      modeler.on('Notification.display', (event) => {
        props.displayNotification(event.data);
      });

      // load current QRMs from defined Git repository and publish them via the event bus
      modeler.on('QRMs.update', (event) => {
        QRMHandler.getCurrentQRMs(config.githubUsername, config.githubRepositoryName, props)
          .then(result => {
            modeler._emit('QRMs.updated', { data: result });
          });
      });

      // perform initial QRM loading
      QRMHandler.getCurrentQRMs(config.githubUsername, config.githubRepositoryName, props)
        .then(result => {
          modeler._emit('QRMs.updated', { data: result });
        });
    });
  }

  render() {
    return null;
  }
}
