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

/* eslint-disable no-unused-vars*/
import React, { Fragment, PureComponent } from 'camunda-modeler-plugin-helpers/react';
import { Fill } from 'camunda-modeler-plugin-helpers/components';

import ConfigModal from './ConfigModal';

const defaultState = {
  configOpen: false
};

const defaultConfig = {
  camundaEndpoint: '',
  opentoscaEndpoint: '',
  qrmRepoName: '',
  qrmUserName: ''
};

export default class ConfigPlugin extends PureComponent {

  constructor(props) {
    super(props);

    this.state = defaultState;
    this.config = defaultConfig;

    this.handleConfigClosed = this.handleConfigClosed.bind(this);

    // get config to update details in the backend
    this.backendConfig = props._getGlobal('config');
  }

  componentDidMount() {

    // initialize config in the frontend
    this.backendConfig.getConfigFromBackend().then(config => this.config = config);

    // subscribe to updates for all configuration parameters
    this.props.subscribe('bpmn.modeler.created', (event) => {

      const {
        modeler
      } = event;

      this.editorActions = modeler.get('editorActions');
      const self = this;

      this.editorActions.register({
        camundaEndpointChanged: function(camundaEndpoint) {
          self.config.camundaEndpoint = camundaEndpoint;
        }
      });
      this.editorActions.register({
        opentoscaEndpointChanged: function(opentoscaEndpoint) {
          self.config.opentoscaEndpoint = opentoscaEndpoint;
        }
      });
      this.editorActions.register({
        qrmRepoNameChanged: function(qrmRepoName) {
          self.config.qrmRepoName = qrmRepoName;
        }
      });
      this.editorActions.register({
        qrmUserNameChanged: function(qrmUserName) {
          self.config.qrmUserName = qrmUserName;
        }
      });
    });
  }

  handleConfigClosed(newConfig) {
    this.setState({ configOpen: false });

    // update configuration in frontend and backend if passed through the modal
    if (newConfig) {
      this.config = newConfig;
      this.backendConfig.setConfigFromModal(newConfig);
    }
  }

  render() {

    // render config button and pop-up menu
    return (<Fragment>
      <Fill slot="toolbar">
        <button type="button" className="src-app-primitives-Button__Button--3Ffn0" title="Open configuration menu"
          onClick={() => this.setState({ configOpen: true })}>
          <span className="app-icon-properties"><span className="indent">Configuration</span></span>
        </button>
      </Fill>
      {this.state.configOpen && (
        <ConfigModal
          onClose={this.handleConfigClosed}
          initValues={this.config}
        />
      )}
    </Fragment>);
  }
}
