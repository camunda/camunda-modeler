/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { PureComponent } from 'react';

import CamundaAPI from './CamundaAPI';
import DeploymentDetailsModal from './DeploymentDetailsModal';

import validators from './validators';
import getEditMenu from './getEditMenu';
import AuthTypes from './AuthTypes';

import { Fill } from '../../app/slot-fill';
import {
  Button,
  Icon
} from '../../app/primitives';


export default class DeploymentTool extends PureComponent {

  state = {
    modalState: null,
    activeTab: null
  }

  componentDidMount() {
    this.props.subscribe('app.activeTabChanged', activeTab => {
      this.setState({ activeTab });
    });
  }

  saveTab() {
    const {
      triggerAction
    } = this.props;

    return triggerAction('save');
  }

  deploy = () => {
    const {
      activeTab
    } = this.state;

    this.deployTab(activeTab);
  }

  async saveDetails(tab, details) {
    const key = 'DEPLOYMENT_DETAILS_' + tab.file.path;

    const detailsStr = JSON.stringify(details);

    window.localStorage.setItem(key, detailsStr);
  }

  async getSavedDetails(tab) {

    const key = 'DEPLOYMENT_DETAILS_' + tab.file.path;

    const detailsStr = window.localStorage.getItem(key) || 'null';

    return JSON.parse(detailsStr);
  }

  async deployTab(tab) {

    // (1.2) Open save file dialog if dirty
    tab = await this.saveTab();

    // (1.3) Cancel deploy if file save cancelled
    if (!tab) {
      return;
    }

    // (2) Get deployment details
    // (2.1) Try to get existing deployment details
    let details = await this.getSavedDetails(tab);

    if (!details) {

      // (2.2) Open modal to enter deployment details
      details = await this.getDetailsFromUserInput(tab);

      // (2.2.1) Handle user cancelation
      if (!details) {
        return;
      }

      // await this.saveDetails(tab, details);
    }

    // (3) Trigger deployment
    // (3.1) Show deployment result (success or error)
    const {
      log,
      displayNotification
    } = this.props;

    try {
      await this.deployWithDetails(tab, details);

      displayNotification({
        type: 'success',
        title: 'Deployment succeeded',
        duration: 4000
      });
    } catch (error) {
      displayNotification({
        type: 'error',
        title: 'Deployment failed',
        content: 'See the log for further details.',
        duration: 10000
      });
      log({ category: 'deploy-error', message: error.problems || error.message });
    }
  }

  deployWithDetails(tab, details) {
    const api = new CamundaAPI(details.endpointUrl);

    return api.deployDiagram(tab.file, details);
  }

  getDetailsFromUserInput(tab, details) {
    const initialDetails = this.getInitialDetails(tab, details);

    return new Promise(resolve => {
      const handleClose = result => {

        this.setState({
          modalState: null
        });

        this.updateMenu();

        // contract: if details provided, user closed with O.K.
        // otherwise they canceled it
        if (result) {
          resolve(this.getDetailsFromForm(result));
        }

        resolve();
      };

      this.setState({
        modalState: {
          tab,
          details: initialDetails,
          handleClose
        }
      });
    });
  }

  validateDetails = values => {
    const validatedFields = this.getValidatedFields(values);

    const errors = validatedFields.reduce((currentErrors, field) => {
      const error = validators[field] && validators[field](values[field]);

      return error ? { ...currentErrors, [field]: error } : currentErrors;
    }, {});

    return errors;
  }

  checkConnection = async values => {
    const baseUrl = this.getBaseUrl(values.endpointUrl);
    const auth = this.getAuth(values);

    const api = new CamundaAPI(baseUrl);

    let connectionError = null;

    try {
      await api.checkConnection({ auth });
    } catch (error) {
      connectionError = error.message;
    }

    return connectionError;
  }

  getInitialDetails(tab, providedDetails) {
    const details = { ...providedDetails };

    if (!details.deploymentName) {
      details.deploymentName = withoutExtension(tab.name);
    }

    return details;
  }

  getValidatedFields(values) {
    const fields = Object.keys(values);

    switch (values.authType) {
    case AuthTypes.none:
      return fields.filter(field => ![ 'bearer', 'username', 'password' ].includes(field));
    case AuthTypes.bearer:
      return fields.filter(field => ![ 'username', 'password' ].includes(field));
    case AuthTypes.basic:
      return fields.filter(field => field !== 'bearer');
    }
  }

  getDetailsFromForm(values) {
    const endpointUrl = this.getBaseUrl(values.endpointUrl);

    const payload = {
      endpointUrl,
      deploymentName: values.deploymentName,
      tenantId: values.tenantId
    };

    const auth = this.getAuth(values);

    if (auth) {
      payload.auth = auth;
    }

    return payload;
  }

  /**
   * Extract base url in case `/deployment/create` was added at the end.
   * @param {string} url
   */
  getBaseUrl(url) {
    return url.replace(/\/deployment\/create\/?/, '');
  }

  getAuth({ authType, username, password, bearer }) {
    switch (authType) {
    case AuthTypes.basic:
      return {
        username,
        password
      };
    case AuthTypes.bearer: {
      return {
        bearer
      };
    }
    }
  }

  handleFocusChange = event => {
    const editMenu = getEditMenu(isFocusedOnInput(event));

    this.updateMenu({ editMenu });
  }

  updateMenu(menu) {
    this.props.triggerAction('update-menu', menu);
  }

  render() {
    const {
      modalState
    } = this.state;

    return <React.Fragment>
      <Fill slot="toolbar" group="8_deploy">
        <Button
          onClick={ this.deploy }
          title="Deploy Current Diagram"
        >
          <Icon name="deploy" />
        </Button>
      </Fill>

      { modalState &&
        <DeploymentDetailsModal
          details={ modalState.details }
          activeTab={ modalState.tab }
          onClose={ modalState.handleClose }
          onFocusChange={ this.handleFocusChange }
          validate={ this.validateDetails }
          checkConnection={ this.checkConnection }
        /> }
    </React.Fragment>;
  }

}



// helper ///////
function isFocusedOnInput(event) {
  return event.type === 'focus' && ['INPUT', 'TEXTAREA'].includes(event.target.tagName);
}

function withoutExtension(name) {
  return name.replace(/\.[^.]+$/, '');
}
