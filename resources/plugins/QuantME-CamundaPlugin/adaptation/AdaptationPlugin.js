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

import AdaptationModal from './AdaptationModal';
import { findOptimizationCandidates } from './CandidateDetector';
import RewriteModal from './RewriteModal';
import { getQiskitRuntimeProgram, getQiskitRuntimeProgramDeploymentModel } from './runtimes/QiskitRuntimeHandler';
import { rewriteWorkflow } from './WorkflowRewriter';

const defaultState = {
  adaptationOpen: false
};

export default class AdaptationPlugin extends PureComponent {

  constructor(props) {
    super(props);

    // modelers for all tabs to enable switching between them
    this.modelers = {};

    this.state = defaultState;

    this.handleAdaptationClosed = this.handleAdaptationClosed.bind(this);
    this.handleRewriteClosed = this.handleRewriteClosed.bind(this);

    // get QuantME component from the backend, e.g., to retrieve current QRMs
    this.quantME = props._getGlobal('quantME');

    // get config to update details in the backend
    this.backendConfig = props._getGlobal('config');
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

  async handleAdaptationClosed(result) {

    // handle click on 'Analyse Workflow' button
    if (result && result.hasOwnProperty('analysisStarted') && result.analysisStarted === true) {

      // hide analysis button
      result.refs.analysisButtonRef.current.hidden = true;

      // get all optimization candidates within the workflow model
      const analysisStartDate = Date.now();
      const optimizationCandidates = await findOptimizationCandidates(this.modeler);
      console.log('Searching for optimization candidates took: %d ms', Date.now() - analysisStartDate);

      if (optimizationCandidates === undefined || optimizationCandidates.length === 0) {
        console.log('Unable to find suitable optimization candidates!');

        // visualize error message
        result.refs.noCandidateDivRef.current.hidden = false;
      } else {
        console.log('Found %d optimization candidates within the workflow!', optimizationCandidates.length);

        this.candidateList = optimizationCandidates;
        this.setState({ adaptationOpen: false, rewriteOpen: true });
      }
    } else {

      // analysis modal aborted by the user
      this.setState({ adaptationOpen: false });
    }
  }

  async handleRewriteClosed(result) {

    // handle click on 'Rewrite Workflow' button
    if (result && result.hasOwnProperty('rewriteStarted') && result.rewriteStarted === true
      && result.hasOwnProperty('rewriteCandidateId')) {
      console.log('Rewriting started for candidate with ID %d and for runtime: ', result.rewriteCandidateId, result.runtimeName);

      // get reference to the button triggering the current rewrite
      let rewriteButton;
      let selectedTab = result.candidatesRootRef.current.children[result.rewriteCandidateId];
      let runtimeTable = selectedTab.children[3];
      let runtimeLines = runtimeTable.children[0].children;
      for (let runtimeLine of runtimeLines) {

        // check if table line corresponding to runtime is found
        if (runtimeLine.children[0].innerText === result.runtimeName) {

          // get the button reference
          rewriteButton = runtimeLine.children[1].children[0];
          break;
        }
      }

      if (rewriteButton === undefined) {
        this.props.displayNotification({
          type: 'error',
          title: 'Unable to analyse workflow',
          content: 'Error during workflow analysis. Aborting rewriting modal!',
          duration: 20000
        });

        this.setState({ rewriteOpen: false });
        return;
      }

      // disable button and show message that rewrite is in progress
      rewriteButton.disabled = true;
      rewriteButton.innerText = 'Rewriting in progress...';

      // track start time of hybrid program generation and workflow rewrite
      const rewriteStartDate = Date.now();

      let rewriteCandidate = result.candidates[result.rewriteCandidateId];
      let programGenerationResult;
      switch (result.runtimeName) {
      case 'Qiskit Runtime':
        programGenerationResult = await getQiskitRuntimeProgramDeploymentModel(rewriteCandidate, this.modeler.config, await this.quantME.getQRMs());
        break;
      default:
        programGenerationResult = { error: 'Unable to find suitable runtime handler for: ' + result.runtimeName };
      }

      // check if hybrid program generation was successful
      if (programGenerationResult.error) {
        console.log('Hybrid program generation failed with error: ', programGenerationResult.error);

        // display error in modal
        rewriteButton.title = programGenerationResult.error;
        rewriteButton.innerText = 'Rewrite not possible!';
        rewriteButton.className = rewriteButton.className + ' rewrite-failed-button';
        return;
      } else {
        console.log('Hybrid program generation successful!');

        // rewrite the workflow and display the result for the user
        let rewritingResult = await rewriteWorkflow(this.modeler, rewriteCandidate);
        if (rewritingResult.error) {
          console.log('Rewriting workflow failed with error: ', rewritingResult.error);

          // display error in modal
          rewriteButton.title = programGenerationResult.error;
          rewriteButton.innerText = 'Rewrite not possible!';
          rewriteButton.className = rewriteButton.className + ' rewrite-failed-button';
        } else {
          console.log('Rewriting workflow successfully after %d ms!', Date.now() - rewriteStartDate);

          // display success in modal
          rewriteButton.title = programGenerationResult.error;
          rewriteButton.innerText = 'Rewrite successful!';
          rewriteButton.className = rewriteButton.className + ' rewrite-successful-button';
        }
        return;
      }
    }

    // close the modal if 'Cancel' button is pressed
    this.setState({ rewriteOpen: false });
  }

  render() {

    // render loop analysis button and pop-up menu
    return (<Fragment>
      <Fill slot="toolbar">
        <button type="button" className="src-app-primitives-Button__Button--3Ffn0"
          title="Open menu to analyse and improve hybrid loops"
          onClick={() => this.setState({ adaptationOpen: true })}>
          <span className="hybrid-loop-adaptation"><span className="indent">Improve Hybrid Loops</span></span>
        </button>
      </Fill>
      {this.state.adaptationOpen && (
        <AdaptationModal
          onClose={this.handleAdaptationClosed}
        />
      )}
      {this.state.rewriteOpen && (
        <RewriteModal
          onClose={this.handleRewriteClosed}
          candidates={this.candidateList}
        />
      )}
    </Fragment>);
  }
}
