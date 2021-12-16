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

/* eslint-disable no-unused-vars */
import React, { useState } from 'camunda-modeler-plugin-helpers/react';
import { Modal } from 'camunda-modeler-plugin-helpers/components';

// polyfill upcoming structural components
const Title = Modal.Title || (({ children }) => <h2>{children}</h2>);
const Body = Modal.Body || (({ children }) => <div>{children}</div>);
const Footer = Modal.Footer || (({ children }) => <div>{children}</div>);

export default function RewriteModal({ onClose, candidates }) {

  // add an entry to the model per candidate
  let candidateButtons = [];
  let candidatesHtml = [];
  for (let i = 0; i < candidates.length; i++) {
    let candidate = candidates[i];

    if (i === 0) {

      // activate first button and display details as default
      candidateButtons.push(<button id={'candidate-button' + { i }} key={i} className="adaptation-tab-button active" onClick={() => openTab(i)}>Candidate {i + 1}</button>);
      candidatesHtml.push(
        <div id={'candidate-html' + { i }} key={i} hidden={false}>
          <h3 className='spaceAbove'>Visualized candidate:</h3>
          <img className='spaceAbove' width="400" src={candidate.candidateImage}/>
          <h3 className='spaceAbove spaceUnder'>The following hybrid runtimes might be used for improved execution:</h3>
          <table>
            <tbody>
              <tr className="spaceUnder">
                <td align="right">Qiskit Runtime</td>
                <td align="left">
                  <button type="button" className="btn btn-secondary" onClick={() => onSubmit(i, 'Qiskit Runtime')}>Rewrite Workflow</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>);
    } else {

      // hide details for other candidates until activated through tab selection
      candidateButtons.push(<button id={'candidate-button' + { i }} key={i} className="adaptation-tab-button" onClick={() => openTab(i)}>Candidate {i + 1}</button>);
      candidatesHtml.push(
        <div id={'candidate-html' + { i }} key={i} hidden={true}>
          <h3 className='spaceAbove'>Visualized candidate:</h3>
          <img className='spaceAbove' width="400" src={candidate.candidateImage}/>
          <h3 className='spaceAbove spaceUnder'>The following hybrid runtimes might be used for improved execution:</h3>
          <table>
            <tbody>
              <tr className="spaceUnder">
                <td align="right">Qiskit Runtime</td>
                <td align="left">
                  <button type="button" className="btn btn-secondary" onClick={() => onSubmit(i, 'Qiskit Runtime')}>Rewrite Workflow</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>);
    }
  }

  const onSubmit = (i, runtimeName) => onClose({
    rewriteStarted: true,
    rewriteCandidateId: i,
    candidates: candidates,
    runtimeName : runtimeName,
    candidatesRootRef: candidatesRootRef
  });

  // reference to change the content depending on the selected tab
  let candidatesRootRef = React.createRef();
  let buttonsRootRef = React.createRef();

  // method to enable tab functionality by hiding and displaying different div elements
  function openTab(id) {
    const buttons = buttonsRootRef.current.children;
    const elements = candidatesRootRef.current.children;

    // hide details and deactivate buttons
    for (let i = 0; i < elements.length; i++) {
      elements[i].hidden = true;
      buttons[i].className = 'adaptation-tab-button';
    }

    // activity selected button and display details
    elements[id].hidden = false;
    buttons[id].className = 'adaptation-tab-button active';
  }

  return <Modal onClose={onClose}>

    <Title>
      Workflow Rewrite
    </Title>

    <Body>
      <div>
        <div className="adaptation-tab" ref={buttonsRootRef}>
          {candidateButtons}
        </div>

        <div id="candidateElements" ref={candidatesRootRef}>
          {candidatesHtml}
        </div>
      </div>
    </Body>

    <Footer>
      <div id="rewriteFormButtons">
        <button type="button" className="btn btn-secondary" onClick={() => onClose()}>Done</button>
      </div>
    </Footer>
  </Modal>;
}

