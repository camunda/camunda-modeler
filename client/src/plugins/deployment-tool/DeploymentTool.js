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

import { omit } from 'min-dash';

import AuthTypes from './AuthTypes';
import CamundaAPI from './CamundaAPI';
import DeploymentDetailsModal from './DeploymentDetailsModal';
import DeploymentDetailsModal2 from './DeploymentDetailsModal2';

import getEditMenu from './getEditMenu';
import validators from './validators';

import { Fill } from '../../app/slot-fill';

import {
  Button,
  Icon
} from '../../app/primitives';

const VALIDATED_FIELDS = [
  'deploymentName',
  'endpointUrl'
];

const CONFIG_KEY = 'deployment-config';


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

  deploy2 = () => {
    const {
      activeTab
    } = this.state;

    this.deployTab2(activeTab);
  }

  async saveDetails(tab, details) {
    const {
      config
    } = this.props;

    const savedDetails = this.getDetailsToSave(details);

    return config.setForFile(tab.file, CONFIG_KEY, savedDetails);
  }

  async getSavedDetails(tab) {
    const {
      config
    } = this.props;

    return config.getForFile(tab.file, CONFIG_KEY);
  }

  // /////// PROTOTYPING !! ////////
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

    // (2.2) Check if details are complete
    const canDeploy = this.canDeployWithDetails(details);

    if (!canDeploy) {

      // (2.3) Open modal to enter deployment details
      details = await this.getDetailsFromUserInput(tab, details);

      // (2.3.1) Handle user cancelation
      if (!details) {
        return;
      }

      await this.saveDetails(tab, details);
    }

    // (3) Trigger deployment
    // (3.1) Show deployment result (success or error)
    const {
      log,
      displayNotification
    } = this.props;

    let businessKey, result;

    try {
      result = await this.deployWithDetails(tab, details);

      businessKey = details.businessKey;

      if (!businessKey) {
        displayNotification({
          type: 'success',
          title: 'Deployment succeeded',
          duration: 4000
        });
      }
    } catch (error) {
      displayNotification({
        type: 'error',
        title: 'Deployment failed',
        content: 'See the log for further details.',
        duration: 10000
      });
      log({ category: 'deploy-error', message: error.problems || error.message });
    }

    const {
      deployedProcessDefinition
    } = result;

    // (3.2) Run Instance if applicable
    if (businessKey && deployedProcessDefinition) {
      const api = new CamundaAPI(details.endpointUrl);

      try {
        const {
          processInstanceId
        } = await api.runInstance(deployedProcessDefinition, details);

        displayNotification({
          type: 'success',
          title: `Run Process Instance succeeded: ${processInstanceId}`,
          duration: 4000
        });
      } catch (error) {
        displayNotification({
          type: 'error',
          title: 'Run Instance failed',
          content: 'See the log for further details.',
          duration: 10000
        });
        log({ category: 'deploy-error', message: error.problems || error.message });
      }
    }
  }

  async deployTab2(tab) {

    // (1.2) Open save file dialog if dirty
    tab = await this.saveTab();

    // (1.3) Cancel deploy if file save cancelled
    if (!tab) {
      return;
    }

    // (2) Get deployment details
    // (2.1) Try to get existing deployment details
    let details = await this.getSavedDetails(tab);

    // (2.2) Check if details are complete
    const canDeploy = this.canDeployWithDetails(details);

    if (!canDeploy) {

      // (2.3) Open modal to enter deployment details
      details = await this.getDetailsFromUserInput2(tab, details);

      // (2.3.1) Handle user cancelation
      if (!details) {
        return;
      }

      await this.saveDetails(tab, details);
    }

    // (3) Trigger deployment
    // (3.1) Show deployment result (success or error)
    const {
      log,
      displayNotification
    } = this.props;

    let businessKey, result;

    try {
      result = await this.deployWithDetails(tab, details);

      businessKey = details.businessKey;

      if (!businessKey) {
        displayNotification({
          type: 'success',
          title: 'Deployment succeeded',
          duration: 4000
        });
      }
    } catch (error) {
      displayNotification({
        type: 'error',
        title: 'Deployment failed',
        content: 'See the log for further details.',
        duration: 10000
      });
      log({ category: 'deploy-error', message: error.problems || error.message });
    }

    const {
      deployedProcessDefinition
    } = result;

    // (3.2) Run Instance if applicable
    if (businessKey && deployedProcessDefinition) {
      const api = new CamundaAPI(details.endpointUrl);

      try {
        const {
          processInstanceId
        } = await api.runInstance(deployedProcessDefinition, details);

        displayNotification({
          type: 'success',
          title: `Run Process Instance succeeded: ${processInstanceId}`,
          duration: 4000
        });
      } catch (error) {
        displayNotification({
          type: 'error',
          title: 'Run Instance failed',
          content: 'See the log for further details.',
          duration: 10000
        });
        log({ category: 'deploy-error', message: error.problems || error.message });
      }
    }
  }

  // //////////////

  deployWithDetails(tab, details) {
    const api = new CamundaAPI(details.endpointUrl);

    return api.deployDiagram(tab.file, details);
  }

  canDeployWithDetails(details) {

    // TODO(barmac): implement for instant deployment
    return false;
  }

  // /////// PROTOTYPING !!! /////
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
          return resolve(this.getDetailsFromForm(result));
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

  getDetailsFromUserInput2(tab, details) {
    const initialDetails = this.getInitialDetails(tab, details);

    return new Promise(resolve => {
      const handleClose = result => {

        this.setState({
          modalState2: null
        });

        this.updateMenu();

        // contract: if details provided, user closed with O.K.
        // otherwise they canceled it
        if (result) {
          return resolve(this.getDetailsFromForm(result));
        }

        resolve();
      };

      this.setState({
        modalState2: {
          tab,
          details: initialDetails,
          handleClose
        }
      });
    });
  }

  // ///////////////////////////

  getDetailsToSave(rawDetails) {
    return omit(rawDetails, 'auth');
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
    switch (values.authType) {
    case AuthTypes.none:
      return VALIDATED_FIELDS;
    case AuthTypes.bearer:
      return VALIDATED_FIELDS.concat('bearer');
    case AuthTypes.basic:
      return VALIDATED_FIELDS.concat('username', 'password');
    }
  }

  getDetailsFromForm(values) {
    const endpointUrl = this.getBaseUrl(values.endpointUrl);

    const payload = {
      endpointUrl,
      deploymentName: values.deploymentName,
      tenantId: values.tenantId,
      authType: values.authType,
      businessKey: values.businessKey
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
      modalState,
      modalState2
    } = this.state;

    return <React.Fragment>
      <Fill slot="toolbar" group="8_deploy">
        <Button
          onClick={ this.deploy }
          title="Deploy Current Diagram"
        >
          <Icon name="deploy" /> <small>1</small>
        </Button>
      </Fill>

      <Fill slot="toolbar" group="8_deploy">
        <Button
          onClick={ this.deploy2 }
          title="Deploy Current Diagram"
        >
          <Icon name="deploy" /> <small>2</small>
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


      { modalState2 &&
      <DeploymentDetailsModal2
        details={ modalState2.details }
        activeTab={ modalState2.tab }
        onClose={ modalState2.handleClose }
        onFocusChange={ this.handleFocusChange }
        validate={ this.validateDetails }
        checkConnection={ this.checkConnection }
      /> }
    </React.Fragment>;
  }

}



// helpers //////////
function isFocusedOnInput(event) {
  return event.type === 'focus' && ['INPUT', 'TEXTAREA'].includes(event.target.tagName);
}

function withoutExtension(name) {
  return name.replace(/\.[^.]+$/, '');
}
