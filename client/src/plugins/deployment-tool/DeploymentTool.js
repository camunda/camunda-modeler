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

import { omit, pick } from 'min-dash';

import AuthTypes from './AuthTypes';
import CamundaAPI from './CamundaAPI';
import DeploymentDetailsModal from './DeploymentDetailsModal';
import DeploymentDetailsModal2 from './DeploymentDetailsModal2';
import RunDetailsModal from './RunDetailsModal';
import RunSuccessModal from './RunSuccessModal';
import getEditMenu from './getEditMenu';
import validators from './validators';

import { Fill } from '../../app/slot-fill';

import {
  Button,
  DropdownButton,
  Icon
} from '../../app/primitives';

const VALIDATED_FIELDS = [
  'deploymentName',
  'endpointUrl'
];

const DEPLOY_CONFIG_KEY = 'deployment-config';

const RUN_CONFIG_KEY = 'run-config';

const DEPLOY_RUN_ACTIONS_1 = [
  'Start Process Instance',
  'Deploy again',
  'Deploy with new Configuration'
];

const DEPLOY_RUN_ACTIONS_2 = [
  'Start Process Instance again',
  'Start Process Instance with new Configuration',
  'Deploy again',
  'Deploy with new Configuration'
];

export default class DeploymentTool extends PureComponent {

  state = {
    modalState: null,
    activeTab: null,
    demoToggle: true
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

  async saveDeployDetails(tab, details) {
    const {
      config
    } = this.props;

    const savedDetails = this.getDeployDetailsToSave(details);

    return config.setForFile(tab.file, DEPLOY_CONFIG_KEY, savedDetails);
  }

  async saveRunDetails(tab, details) {
    const {
      config
    } = this.props;

    const savedDetails = this.getRunDetailsToSave(details);

    return config.setForFile(tab.file, RUN_CONFIG_KEY, savedDetails);
  }

  async getSavedDeploymentDetails(tab) {
    const {
      config
    } = this.props;

    return config.getForFile(tab.file, DEPLOY_CONFIG_KEY);
  }

  async getSavedRunDetails(tab) {
    const {
      config
    } = this.props;

    return config.getForFile(tab.file, RUN_CONFIG_KEY);
  }

  // todo(pinussilvestrus): refactor me
  async persistProcessDefinition(tab, deployResult) {

    if (!deployResult) {
      return;
    }

    const {
      config
    } = this.props;

    const {
      deployedProcessDefinition
    } = deployResult;

    const savedProcessDefinition = await config.getForFile(tab.file, 'process-definition');

    const processDefinition = deployedProcessDefinition || savedProcessDefinition;

    await config.setForFile(tab.file, 'process-definition', processDefinition);

    return processDefinition;
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
    let details = await this.getSavedDeploymentDetails(tab);

    // TODO(pinussilvestrus): combine details in configuration?
    details = {
      ...details,
      ...await this.getSavedRunDetails(tab)
    };

    // (2.2) Check if details are complete
    const canDeploy = this.canDeployWithDetails(details);

    if (!canDeploy) {

      // (2.3) Open modal to enter deployment details
      details = await this.getDetailsFromUserInput(tab, details);

      // (2.3.1) Handle user cancelation
      if (!details) {
        return;
      }

      await this.saveDeployDetails(tab, details);
    }

    // (3) Trigger deployment
    // (3.1) Show deployment result (success or error)
    const {
      log,
      displayNotification
    } = this.props;

    let shouldRun, result;

    try {
      result = await this.deployWithDetails(tab, details);

      shouldRun = details.shouldRun;

      if (!shouldRun) {
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

    const processDefinition = await this.persistProcessDefinition(tab, result);

    // TODO(pinussilvestrus): split from deploy action?
    // (4) Run Instance if applicable
    if (shouldRun && processDefinition) {

      await this.saveRunDetails(tab, details);

      try {
        await this.runWithDetails(details, processDefinition);
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
    let details = await this.getSavedDeploymentDetails(tab);

    // (2.2) Check if details are complete
    const canDeploy = this.canDeployWithDetails(details);

    if (!canDeploy) {

      // (2.3) Open modal to enter deployment details
      details = await this.getDetailsFromUserInput2(tab, details);

      // (2.3.1) Handle user cancelation
      if (!details) {
        return;
      }

      await this.saveDeployDetails(tab, details);
    }

    // (3) Trigger deployment
    // (3.1) Show deployment result (success or error)
    const {
      log,
      displayNotification
    } = this.props;

    let shouldRun, result;

    try {
      result = await this.deployWithDetails(tab, details);

      shouldRun = details.shouldRun;

      if (!shouldRun) {
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

    const processDefinition = await this.persistProcessDefinition(tab, result);

    // (4) Run Instance if applicable
    if (shouldRun && processDefinition) {

      details = {
        ...details,
        ...await this.getSavedRunDetails(tab)
      };

      // (4.1) Open Modal to enter run details
      let runDetails = await this.getRunDetailsFromUserInput(tab, details);

      if (!runDetails) {
        return;
      }

      await this.saveRunDetails(tab, runDetails);

      // (4.2) Execute Run Instance
      try {

        await this.runWithDetails(runDetails, processDefinition);

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

  getRunDetailsFromUserInput(tab, details) {
    const initialDetails = this.getInitialDetails(tab, details);

    return new Promise(resolve => {
      const handleClose = result => {

        this.setState({
          runModalState: null
        });

        this.updateMenu();

        // contract: if details provided, user closed with O.K.
        // otherwise they canceled it
        if (result) {
          return resolve(this.getDetailsFromForm(result));
        }
      };

      this.setState({
        runModalState: {
          tab,
          details: initialDetails,
          handleClose
        }
      });
    });
  }

  deployWithDetails(tab, details) {
    const api = new CamundaAPI(details.endpointUrl);

    return api.deployDiagram(tab.file, details);
  }

  // TODO(pinussilvestrus): split UI and business logic
  async runWithDetails(details, deployedProcessDefinition) {
    const api = new CamundaAPI(details.endpointUrl);

    const processInstance = await api.runInstance(deployedProcessDefinition, details);

    this.openRunSuccessModal(processInstance, details);

    return { processInstance };
  }

  // todo(pinussilvestrus): instead of using modal, extend notifications to handle react
  // component as content
  openRunSuccessModal(processInstance, details) {
    const {
      endpointUrl
    } = details;

    return new Promise(resolve => {
      const handleClose = () => {

        this.setState({
          successModalState: null
        });

        this.updateMenu();

        resolve();
      };

      this.setState({
        successModalState: {
          endpointUrl,
          processInstance,
          handleClose
        }
      });
    });
  }

  canDeployWithDetails(details) {

    // TODO(barmac): implement for instant deployment
    return false;
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

  getDeployDetailsToSave(rawDetails) {
    return omit(rawDetails, [ 'auth', 'businessKey', 'variables', 'shouldRun' ]);
  }

  getRunDetailsToSave(rawDetails) {
    return pick(rawDetails, [ 'businessKey', 'variables' ]);
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

      // todo(pinussilvestrus): cleanup
      businessKey: values.businessKey,
      variables: values.variables ? JSON.parse(values.variables) : undefined,
      shouldRun: values.shouldRun
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

  toggleDemo = () => this.setState(state => ({ ...state, demoToggle: !state.demoToggle }));

  render() {
    const {
      modalState,
      modalState2,
      runModalState,
      successModalState,
      demoToggle
    } = this.state;

    return <React.Fragment>
      { demoToggle && <Fill slot="toolbar" group="8_deploy">
        <Button
          onClick={ this.deploy }
          title="Deploy Current Diagram"
        >
          <Icon name="play" />
        </Button>
        <DropdownButton
          items={
            () => DEPLOY_RUN_ACTIONS_1.map((action, index) => {
              return (
                <div key={ index }>- { action }</div>
              );
            })
          }
        ></DropdownButton>
      </Fill> }

      { !demoToggle && <Fill slot="toolbar" group="8_deploy">
        <Button
          onClick={ this.deploy2 }
          title="Deploy Current Diagram"
        >
          <Icon name="play" />
        </Button>
        <DropdownButton
          items={
            () => DEPLOY_RUN_ACTIONS_2.map((action, index) => {
              return (
                <div key={ index }>- { action }</div>
              );
            })
          }
        ></DropdownButton>
      </Fill> }

      <Fill slot="toolbar" group="9_toggle">
        <button onClick={ this.toggleDemo }>Toggle Demo {demoToggle ? '1' : '2'}</button>
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

      { runModalState &&
      <RunDetailsModal
        details={ runModalState.details }
        activeTab={ runModalState.tab }
        onClose={ runModalState.handleClose }
        onFocusChange={ this.handleFocusChange }
        validate={ this.validateDetails }
      /> }

      { successModalState &&
      <RunSuccessModal
        processInstance={ successModalState.processInstance }
        endpointUrl={ successModalState.endpointUrl }
        onClose={ successModalState.handleClose }
        onFocusChange={ this.handleFocusChange }
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
