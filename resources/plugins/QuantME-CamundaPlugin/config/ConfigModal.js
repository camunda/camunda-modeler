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

export default function ConfigModal({ initValues, onClose }) {
  const [camundaEndpoint, setCamundaEndpoint] = useState(initValues.camundaEndpoint);
  const [opentoscaEndpoint, setOpentoscaEndpoint] = useState(initValues.opentoscaEndpoint);
  const [wineryEndpoint, setWineryEndpoint] = useState(initValues.wineryEndpoint);
  const [transformationFrameworkEndpoint, setTransformationFrameworkEndpoint] = useState(initValues.transformationFrameworkEndpoint);
  const [nisqAnalyzerEndpoint, setNisqAnalyzerEndpoint] = useState(initValues.nisqAnalyzerEndpoint);
  const [qrmRepoName, setQrmRepoName] = useState(initValues.qrmRepoName);
  const [qrmUserName, setQrmUserName] = useState(initValues.qrmUserName);
  const [qrmRepoPath, setQrmRepoPath] = useState(initValues.qrmRepoPath);

  // return the new values to the config plugin
  const onSubmit = () => onClose({
    camundaEndpoint,
    opentoscaEndpoint,
    wineryEndpoint,
    transformationFrameworkEndpoint,
    nisqAnalyzerEndpoint,
    qrmUserName,
    qrmRepoName,
    qrmRepoPath
  });


  // refs to enable changing the state through the plugin
  let elementsRootRef = React.createRef();

  // method to enable button functionality by hiding and displaying different div elements
  function openTab(tabName, id) {
    const elements = elementsRootRef.current.children;

    for (let i = 0; i < elements.length; i++) {
      elements[i].hidden = true;
    }
    elements[id].hidden = false;
  }

  return <Modal onClose={onClose} openTab={openTab}>
    <Title>
      QuantME Modeler Configuration
    </Title>

    <Body>
      <form id="quantmeConfigForm" onSubmit={onSubmit}>

        <div id="quantmeConfigButtons">
          <button type="button" className="innerConfig btn-primary" onClick={() => openTab('CamundaEngineEndpointTab', 0)}>Camunda</button>
          <button type="button" className="innerConfig btn-primary" onClick={() => openTab('OpenTOSCAEndpointTab', 1)}>OpenTOSCA</button>
          <button type="button" className="innerConfig btn-primary" onClick={() => openTab('QuantMEFrameworkEndpointTab', 2)}>QuantME</button>
          <button type="button" className="innerConfig btn-primary" onClick={() => openTab('NISQAnalyzerEndpointTab', 3)}>NISQ Analyzer</button>
          <button type="button" className="innerConfig btn-primary" onClick={() => openTab('QRMDataTab', 4)}>QRM Data</button>
        </div>

        <div id="quantmeConfigElements" ref={elementsRootRef}>
          <div className="spaceAbove" hidden={false} id="CamundaEngineEndpointTab">
            <h3>Camunda Engine</h3>
            <table>
              <tbody>
                <tr className="spaceUnder">
                  <td align="right">Camunda Engine Endpoint:</td>
                  <td align="left">
                    <input
                      type="string"
                      name="camundaEndpoint"
                      value={camundaEndpoint}
                      onChange={event => setCamundaEndpoint(event.target.value)}/>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="spaceAbove" hidden={true} id="OpenTOSCAEndpointTab">
            <h3>OpenTOSCA</h3>
            <table>
              <tbody>
                <tr className="spaceUnder">
                  <td align="right">OpenTOSCA Endpoint:</td>
                  <td align="left">
                    <input
                      type="string"
                      name="opentoscaEndpoint"
                      value={opentoscaEndpoint}
                      onChange={event => setOpentoscaEndpoint(event.target.value)}/>
                  </td>
                </tr>
                <tr className="spaceUnder">
                  <td align="right">Winery Endpoint:</td>
                  <td align="left">
                    <input
                      type="string"
                      name="wineryEndpoint"
                      value={wineryEndpoint}
                      onChange={event => setWineryEndpoint(event.target.value)}/>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="spaceAbove" hidden={true} id="QuantMEFrameworkEndpointTab">
            <h3>QuantME Framework</h3>
            <table>
              <tbody>
                <tr className="spaceUnder">
                  <td align="right">QuantME Framework Endpoint:</td>
                  <td align="left">
                    <input
                      type="string"
                      name="transformationFrameworkEndpoint"
                      value={transformationFrameworkEndpoint}
                      onChange={event => setTransformationFrameworkEndpoint(event.target.value)}/>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="spaceAbove" hidden={true} id="NISQAnalyzerEndpointTab">
            <h3>NISQ Analyzer</h3>
            <table>
              <tbody>
                <tr className="spaceUnder">
                  <td align="right">NISQ Analyzer Endpoint:</td>
                  <td align="left">
                    <input
                      type="string"
                      name="nisqAnalyzerEndpoint"
                      value={nisqAnalyzerEndpoint}
                      onChange={event => setNisqAnalyzerEndpoint(event.target.value)}/>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="spaceAbove" hidden={true} id="QRMDataTab">
            <h3>QRM Data</h3>
            <table>
              <tbody>
                <tr className="spaceUnder">
                  <td align="right">QRM Repository User:</td>
                  <td align="left">
                    <input
                      type="string"
                      name="qrmUserName"
                      value={qrmUserName}
                      onChange={event => setQrmUserName(event.target.value)}/>
                  </td>
                </tr>
                <tr className="spaceUnder">
                  <td align="right">QRM Repository Name:</td>
                  <td align="left">
                    <input
                      type="string"
                      name="qrmRepoName"
                      value={qrmRepoName}
                      onChange={event => setQrmRepoName(event.target.value)}/>
                  </td>
                </tr>
                <tr>
                  <td align="right">QRM Repository Path:</td>
                  <td align="left">
                    <input
                      type="string"
                      name="qrmRepoPath"
                      value={qrmRepoPath}
                      onChange={event => setQrmRepoPath(event.target.value)}/>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </form>
    </Body>

    <Footer>
      <div id="quantmeConfigFormButtons">
        <button type="submit" className="btn btn-primary" form="quantmeConfigForm">Save</button>
        <button type="button" className="btn btn-secondary" onClick={() => onClose()}>Cancel</button>
      </div>
    </Footer>
  </Modal>;
}

