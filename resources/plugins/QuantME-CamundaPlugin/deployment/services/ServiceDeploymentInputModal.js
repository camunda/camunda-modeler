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

export default function ServiceDeploymentInputModal({ onClose, initValues }) {

  // refs to enable changing the state through the plugin
  let progressBarRef = React.createRef();
  let progressBarDivRef = React.createRef();
  let footerRef = React.createRef();

  // propagte updates on dynamically created input fields to corresponding parameter fields
  const handleInputChange = (event, csarIndex, paramIndex) => {
    initValues[csarIndex].inputParameters[paramIndex].value = event.target.value;
  };

  // determine input parameters that have to be passed by the user
  let csarInputParts = [];
  let inputRequired = false;
  for (let i = 0; i < initValues.length; i++) {
    let csar = initValues[i];
    let inputParams = csar.inputParameters;

    let paramsToRetrieve = [];
    for (let j = 0; j < inputParams.length; j++) {
      let inputParam = inputParams[j];


      // skip parameters that are automatically set by the OpenTOSCA Container
      if (inputParam.name === 'instanceDataAPIUrl' || inputParam.name === 'CorrelationID' || inputParam.name === 'csarEntrypoint') {
        paramsToRetrieve.push({ hidden: true, inputParam: inputParam });
        continue;
      }

      // skip parameters that are automatically set during service binding
      if (inputParam.name === 'camundaTopic' || inputParam.name === 'camundaEndpoint') {
        paramsToRetrieve.push({ hidden: true, inputParam: inputParam });
        continue;
      }

      paramsToRetrieve.push({ hidden: false, inputParam: inputParam });
    }

    if (paramsToRetrieve.filter((param) => param.hidden === false).length > 0) {
      inputRequired = true;

      // add entries for the parameters
      const listItems = paramsToRetrieve.map((param, j) =>
        <tr key={csar.csarName + '-' + param.inputParam.name} hidden={param.hidden}>
          <td>{param.inputParam.name}</td>
          <td>
            <input
              type="string"
              value={initValues[i][j]}
              onChange={event => handleInputChange(event, i, j)}/>
          </td>
        </tr>
      );

      // assemble the table
      csarInputParts.push(
        <div key={csar.csarName}>
          <h3 className="spaceUnderSmall">{csar.csarName}:</h3>
          <table>
            <tbody>
              <tr>
                <th>Parameter Name</th>
                <th>Value</th>
              </tr>
              {listItems}
            </tbody>
          </table>
        </div>);
    }
  }

  const onNext = () => onClose({
    next: true,
    csarList: initValues,
    refs: { progressBarRef: progressBarRef, progressBarDivRef: progressBarDivRef, footerRef: footerRef }
  });

  return <Modal onClose={onClose}>

    <Title>
      Service Deployment (2/3)
    </Title>

    <Body>
      <h3 className="spaceUnder">CSARs successfully uploaded to the OpenTOSCA Container.</h3>

      <h3 className="spaceUnder" hidden={!inputRequired}>The following CSARs require input parameters:</h3>

      <h3 className="spaceUnder" hidden={inputRequired}>No input parameters required.</h3>

      {csarInputParts}

      <div hidden={true} ref={progressBarDivRef}>
        <div className="spaceUnder spaceAbove">Deployment progress:</div>
        <div id="progress">
          <div id="bar" ref={progressBarRef}/>
        </div>
      </div>
    </Body>

    <Footer>
      <div id="deploymentButtons" ref={footerRef}>
        <button type="button" className="btn btn-primary" onClick={() => onNext()}>Deploy Services</button>
        <button type="button" className="btn btn-secondary" onClick={() => onClose()}>Cancel</button>
      </div>
    </Footer>
  </Modal>;
}
