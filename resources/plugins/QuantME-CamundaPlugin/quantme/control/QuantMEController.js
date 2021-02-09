/**
 * Copyright (c) 2021 Institute of Architecture of Application Systems -
 * University of Stuttgart
 *
 * This program and the accompanying materials are made available under the
 * terms the Apache Software License 2.0
 * which is available at https://www.apache.org/licenses/LICENSE-2.0.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { PureComponent } from 'camunda-modeler-plugin-helpers/react';
import { startReplacementProcess } from '../replacement/QuantMETransformator';

export default class QuantMEController extends PureComponent {

  constructor(props) {

    super(props);

    // get QuantME component from the backend, e.g., to retrieve current QRMs
    this.quantME = props._getGlobal('quantME');

    // get API component from the backend, e.g., to send back results of long-running tasks
    this.api = props._getGlobal('api');
  }

  componentDidMount() {

    // initialize component with created modeler
    this.props.subscribe('bpmn.modeler.created', (event) => {

      const {
        modeler
      } = event;

      // load components required to access, adapt, and transform the current QuantME workflow
      this.bpmnjs = modeler.get('bpmnjs');
      this.editorActions = modeler.get('editorActions');

      // register actions to enable invocation over the menu and the API
      const self = this;

      // update the current set of available QRMs from the specified repository
      this.editorActions.register({
        updateFromQRMRepo: function() {
          self.quantME.updateQRMs().then(response => {
            console.log('Update of QRMs completed: ', response);
          }).catch(e => {
            self.props.displayNotification({
              type: 'warning',
              title: 'Unable to load QRMs',
              content: e,
              duration: 20000
            });
          });
        }
      });

      // transform the current workflow from the modeler to a native workflow
      this.editorActions.register({
        startReplacementProcess: async function() {
          self.props.displayNotification({
            type: 'info',
            title: 'Workflow Transformation Started!',
            content: 'Successfully started transformation process for the current workflow!',
            duration: 7000
          });
          let xml = await self.bpmnjs.saveXML();
          let currentQRMs = await self.quantME.getQRMs();
          let result = await startReplacementProcess(xml.xml, currentQRMs);

          if (result.status === 'transformed') {
            await self.bpmnjs.importXML(result.xml);
          } else {
            self.props.displayNotification({
              type: 'warning',
              title: 'Unable to transform workflow',
              content: result.cause,
              duration: 10000
            });
          }
        }
      });

      // transform the workflow passed through the API to a native workflow
      this.editorActions.register({
        transformWorkflow: async function(params) {
          console.log('Transforming workflow posted through API!');
          let currentQRMs = await self.quantME.getQRMs();
          let result = await startReplacementProcess(params.xml, currentQRMs);

          // return result to API
          self.api.sendResult(params.returnPath, params.id, { status: result.status, xml: result.xml });
        }
      });

      // trigger initial QRM update
      this.quantME.updateQRMs().then(response => {
        console.log('Update of QRMs completed: ', response);
      }).catch(e => {
        self.props.displayNotification({
          type: 'warning',
          title: 'Unable to load QRMs',
          content: e,
          duration: 20000
        });
      });
    });
  }

  render() {
    return null;
  }
}
