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

export default function ServiceDeploymentBindingModal({ onClose, initValues }) {

  // find all tasks that have to be bound and assign them to a list based on the used pattern
  let bindByPullTasks = [];
  let bindByPushTasks = [];
  for (let i = 0; i < initValues.length; i++) {
    let csar = initValues[i];
    let serviceTaskIds = csar.serviceTaskIds;
    for (let j = 0; j < serviceTaskIds.length; j++) {

      if (csar.type === 'pull') {
        bindByPullTasks.push(<li key={serviceTaskIds[j]} className="spaceUnderSmall">{serviceTaskIds[j]}</li>);
        continue;
      }

      if (csar.type === 'push') {
        bindByPushTasks.push(<li key={serviceTaskIds[j]} className="spaceUnderSmall">{serviceTaskIds[j]}</li>);
        continue;
      }

      console.error('Found task that does not use the push or pull pattern: %s', serviceTaskIds[j]);
    }
  }

  let bindByPull = bindByPullTasks.length > 0;
  let bindByPush = bindByPushTasks.length > 0;

  const onFinished = () => onClose({ next: true, csarList: initValues });

  return <Modal onClose={onClose}>

    <Title>
      Service Deployment (3/3)
    </Title>

    <Body>
      <h3 className="spaceUnder">Service instances are created and can be bound to the workflow.</h3>

      <div hidden={!bindByPull}>
        <h3 className="spaceUnder" >The following ServiceTasks are bound using the pull pattern:</h3>

        <ul className="spaceUnder">
          {bindByPullTasks}
        </ul>
      </div>

      <div hidden={!bindByPush}>
        <h3 className="spaceUnder">The following ServiceTasks are bound using the push pattern:</h3>

        <ul className="spaceUnder">
          {bindByPushTasks}
        </ul>
      </div>

      <h3 className="spaceUnder">Caution: Thereby, the workflow is adapted.</h3>
    </Body>

    <Footer>
      <div id="deploymentButtons">
        <button type="button" className="btn btn-primary" onClick={() => onFinished()}>Perform Binding</button>
        <button type="button" className="btn btn-secondary" onClick={() => onClose()}>Cancel</button>
      </div>
    </Footer>
  </Modal>;
}
