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

import ServiceDeploymentOverviewModal from './ServiceDeploymentOverviewModal';
import ServiceDeploymentInputModal from './ServiceDeploymentInputModal';
import ServiceDeploymentBindingModal from './ServiceDeploymentBindingModal';
import { getRootProcess } from 'client/src/app/quantme/utilities/Utilities';

import { createServiceInstance, uploadCSARToContainer } from 'client/src/app/quantme/deployment/OpenTOSCAUtils';
import { bindUsingPull, bindUsingPush } from 'client/src/app/quantme/deployment/BindingUtils';
import { getServiceTasksToDeploy } from 'client/src/app/quantme/deployment/DeploymentUtils';

const defaultState = {
  windowOpenDeploymentOverview: false,
  windowOpenDeploymentInput: false,
  windowOpenDeploymentBinding: false
};

export default class DeploymentPlugin extends PureComponent {

  constructor(props) {
    super(props);

    // modelers for all tabs to enable switching between them
    this.modelers = {};

    this.state = defaultState;

    // get backend to trigger workflow deployment
    this.backend = props._getGlobal('backend');

    this.handleDeploymentOverviewClosed = this.handleDeploymentOverviewClosed.bind(this);
    this.handleDeploymentInputClosed = this.handleDeploymentInputClosed.bind(this);
    this.handleDeploymentBindingClosed = this.handleDeploymentBindingClosed.bind(this);
  }

  componentDidMount() {

    // get modeler to access current workflow
    this.props.subscribe('bpmn.modeler.created', (event) => {

      const {
        modeler, tab
      } = event;

      // save modeler and activate as current modeler
      this.modelers[tab.id] = modeler;
      this.modeler = modeler;
    });

    // change to modeler corresponding to the active tab
    this.props.subscribe('app.activeTabChanged', ({ activeTab }) => {
      this.modeler = this.modelers[activeTab.id];
      this.state = defaultState;
    });

    // remove corresponding modeler if tab is closed
    this.props.subscribe('app.closedTab', ({ tab }) => {
      delete this.modelers[tab.id];
    });
  }

  /**
   * Increase the progress in the progress bar
   *
   * @param progressBar the progress bar to handle
   * @param progress the percentage to increase the current progress
   */
  handleProgress(progressBar, progress) {
    if (!progressBar.innerHTML) {
      progressBar.innerHTML = '0%';
    }

    let currentWidth = parseInt(progressBar.innerHTML.replace(/% ?/g, ''));
    for (let i = 0; i < progress; i++) {
      currentWidth++;
      progressBar.style.width = currentWidth + '%';
      progressBar.innerHTML = currentWidth + '%';
    }
  }

  /**
   * Handle the result of a close operation on the deployment overview modal
   *
   * @param result the result from the close operation
   */
  async handleDeploymentOverviewClosed(result) {

    // handle click on 'Next' button
    if (result && result.hasOwnProperty('next') && result.next === true) {

      // make progress bar visible and hide buttons
      result.refs.progressBarDivRef.current.hidden = false;
      result.refs.footerRef.current.hidden = true;
      let progressBar = result.refs.progressBarRef.current;
      this.handleProgress(progressBar, 10);

      // calculate progress step size for the number of CSARs to deploy
      let csarList = result.csarList;
      let progressStep = Math.round(90 / csarList.length);

      // upload all CSARs
      for (let i = 0; i < csarList.length; i++) {
        let csar = csarList[i];
        console.log('Uploading CSAR to OpenTOSCA container: ', csar);

        let uploadResult = await uploadCSARToContainer(this.modeler.config.opentoscaEndpoint, csar.csarName, csar.url, this.modeler.config.wineryEndpoint);
        if (uploadResult.success === false) {

          // notify user about failed CSAR upload
          this.props.displayNotification({
            type: 'error',
            title: 'Unable to upload CSAR to the OpenTOSCA Container',
            content: 'CSAR defined for ServiceTasks with Id \'' + csar.serviceTaskIds + '\' could not be uploaded to the connected OpenTOSCA Container!',
            duration: 20000
          });

          // abort process
          this.setState({
            windowOpenDeploymentOverview: false,
            windowOpenDeploymentInput: false,
            windowOpenDeploymentBinding: false
          });
          return;
        }

        // set URL of the CSAR in the OpenTOSCA Container which is required to create instances
        csar.buildPlanUrl = uploadResult.url;
        csar.inputParameters = uploadResult.inputParameters;

        // increase progress in the UI
        this.handleProgress(progressBar, progressStep);
      }

      this.csarList = csarList;

      this.setState({
        windowOpenDeploymentOverview: false,
        windowOpenDeploymentInput: true,
        windowOpenDeploymentBinding: false,
        csarList: csarList
      });
      return;
    }

    // handle cancellation
    this.setState({
      windowOpenDeploymentOverview: false,
      windowOpenDeploymentInput: false,
      windowOpenDeploymentBinding: false
    });
  }

  /**
   * Handle the result of a close operation on the deployment input modal
   *
   * @param result the result from the close operation
   */
  async handleDeploymentInputClosed(result) {

    // handle click on 'Next' button
    if (result && result.hasOwnProperty('next') && result.next === true) {

      // make progress bar visible and hide buttons
      result.refs.progressBarDivRef.current.hidden = false;
      result.refs.footerRef.current.hidden = true;
      let progressBar = result.refs.progressBarRef.current;
      this.handleProgress(progressBar, 10);

      // calculate progress step size for the number of CSARs to create an service instance for
      let csarList = result.csarList;
      let progressStep = Math.round(90 / csarList.length);

      // create service instances for all CSARs
      for (let i = 0; i < csarList.length; i++) {
        let csar = csarList[i];
        console.log('Creating service instance for CSAR: ', csar);

        let instanceCreationResponse = await createServiceInstance(csar, this.modeler.config.camundaEndpoint);
        if (instanceCreationResponse.success === false) {

          // notify user about failed instance creation
          this.props.displayNotification({
            type: 'error',
            title: 'Unable to create service instace',
            content: 'Unable to create service instance for CSAR \'' + csar.csarName + '\'. Aborting process!',
            duration: 20000
          });

          // abort process
          this.setState({
            windowOpenDeploymentOverview: false,
            windowOpenDeploymentInput: false,
            windowOpenDeploymentBinding: false
          });
          return;
        }

        // store topic name for pulling services
        if (instanceCreationResponse.topicName !== undefined) {
          csar.topicName = instanceCreationResponse.topicName;
        }

        // increase progress in the UI
        this.handleProgress(progressBar, progressStep);
      }

      // update CSAR list for the binding
      this.csarList = csarList;

      this.setState({
        windowOpenDeploymentOverview: false,
        windowOpenDeploymentInput: false,
        windowOpenDeploymentBinding: true
      });
      return;
    }

    // handle cancellation
    this.setState({
      windowOpenDeploymentOverview: false,
      windowOpenDeploymentInput: false,
      windowOpenDeploymentBinding: false
    });
  }

  /**
   * Handle the result of a close operation on the deployment binding modal
   *
   * @param result the result from the close operation
   */
  handleDeploymentBindingClosed(result) {

    // handle click on 'Next' button
    if (result && result.hasOwnProperty('next') && result.next === true) {

      // iterate through each CSAR and related ServiceTask and perform the binding with the created service instance
      let csarList = result.csarList;
      for (let i = 0; i < csarList.length; i++) {
        let csar = csarList[i];

        let serviceTaskIds = csar.serviceTaskIds;
        for (let j = 0; j < serviceTaskIds.length; j++) {

          // bind the service instance using the specified binding pattern
          let bindingResponse = undefined;
          if (csar.type === 'pull') {
            bindingResponse = bindUsingPull(csar.topicName, serviceTaskIds[j], this.modeler.get('elementRegistry'), this.modeler.get('modeling'));
          } else if (csar.type === 'push') {
            bindingResponse = bindUsingPush(csar, serviceTaskIds[j], this.modeler.get('elementRegistry'));
          }

          // abort if binding pattern is invalid or binding fails
          if (bindingResponse === undefined || bindingResponse.success === false) {

            // notify user about failed binding
            this.props.displayNotification({
              type: 'error',
              title: 'Unable to perform binding',
              content: 'Unable to bind ServiceTask with Id \'' + serviceTaskIds[j] + '\' using binding pattern \'' + csar.type + '\'. Aborting process!',
              duration: 20000
            });

            // abort process
            this.setState({
              windowOpenDeploymentOverview: false,
              windowOpenDeploymentInput: false,
              windowOpenDeploymentBinding: false
            });
            return;
          }
        }
      }

      // notify user about successful binding
      this.props.displayNotification({
        type: 'info',
        title: 'Binding completed',
        content: 'Binding of the deployed service instances completed. The resulting workflow can now be deployed to the Camunda engine!',
        duration: 20000
      });
    }

    this.setState({
      windowOpenDeploymentOverview: false,
      windowOpenDeploymentInput: false,
      windowOpenDeploymentBinding: false
    });
  }

  /**
   * Get the list of ServiceTasks to deploy a service for to display them in the modal
   */
  getServiceTasksToDeployForModal() {

    if (!this.modeler) {
      console.warn('Modeler not available, unable to retrieve ServiceTasks!');
      return [];
    }

    // get all ServiceTasks with associated deployment model
    let csarsToDeploy = getServiceTasksToDeploy(getRootProcess(this.modeler.getDefinitions()));

    if (csarsToDeploy.length === 0) {
      this.props.displayNotification({
        type: 'info',
        title: 'No ServiceTasks with associated deployment models',
        content: 'The workflow does not contain ServiceTasks with associated deployment models. No service deployment required!',
        duration: 20000
      });
    }

    return csarsToDeploy;
  }

  /**
   * Deploy the current workflow to the Camunda engine
   */
  async deployWorkflow() {
    const rootElement = getRootProcess(this.modeler.getDefinitions());
    const xml = (await this.modeler.saveXML()).xml;
    let result = await this.backend.send('deployment:deploy-workflow', rootElement.id, xml);

    if (result.status === 'failed') {
      this.props.displayNotification({
        type: 'error',
        title: 'Unable to deploy workflow',
        content: 'Workflow deployment failed. Please check the configured Camunda engine endpoint!',
        duration: 20000
      });
    } else {
      this.props.displayNotification({
        type: 'info',
        title: 'Workflow successfully deployed',
        content: 'Workflow successfully deployed under deployment Id: ' + result.deployedProcessDefinition.deploymentId,
        duration: 20000
      });
    }
  }

  render() {

    // render deployment button and pop-up menu
    return (<Fragment>
      <Fill slot="toolbar">
        <button type="button" className="src-app-primitives-Button__Button--3Ffn0" title="Open service deployment menu"
          onClick={() => this.setState({ windowOpenDeploymentOverview: true })}>
          <span className="app-icon-service-deployment"><span className="indent">Service Deployment</span></span>
        </button>
        <button type="button" className="src-app-primitives-Button__Button--3Ffn0" title="Deploy the current workflow"
          onClick={() => this.deployWorkflow()}>
          <span className="workflow-deployment"><span className="indent">Workflow Deployment</span></span>
        </button>
      </Fill>
      {this.state.windowOpenDeploymentOverview && (
        <ServiceDeploymentOverviewModal
          onClose={this.handleDeploymentOverviewClosed}
          initValues={this.getServiceTasksToDeployForModal()}
        />
      )}
      {this.state.windowOpenDeploymentInput && (
        <ServiceDeploymentInputModal
          onClose={this.handleDeploymentInputClosed}
          initValues={this.csarList}
        />
      )}
      {this.state.windowOpenDeploymentBinding && (
        <ServiceDeploymentBindingModal
          onClose={this.handleDeploymentBindingClosed}
          initValues={this.csarList}
        />
      )}
    </Fragment>);
  }
}
