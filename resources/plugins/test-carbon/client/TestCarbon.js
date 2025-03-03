/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

// alias `react: camunda-modeler-plugin-helpers/react` from CamundaModelerWebpackPlugin
import React, { useEffect } from 'react';

import { Fill, Modal } from 'camunda-modeler-plugin-helpers/components';

import { Button, Theme, IconButton, TextInput } from '@carbon/react';
import { Add } from '@carbon/icons-react';

// import './TestCarbon.scss';

export function TestCarbon() {

  const [ modalOpen, setModalOpen ] = React.useState(false);

  useEffect(() => {
    console.log('[TestCarbon] mounted');
  }, []);

  const close = () => {
    setModalOpen(false);
  };

  return <React.Fragment>
    { modalOpen && <CarbonModal onClose={ close } /> }
    <Fill slot="status-bar__app" group="1_first">
      <button
        className="btn"
        type="button"
        onClick={ () => setModalOpen(true) }
      >
        Carbon
      </button>
    </Fill>
  </React.Fragment>;
}

function CarbonModal({ onClose }) {

  return (
    <Modal className="modal-test-carbon">
      <Modal.Title>Test Carbon</Modal.Title>
      <Modal.Body>
        <h1>Carbon</h1>
        <Theme theme="g90">
          <p className="carbon-padding">Carbon is cool</p>
        </Theme>
        <p className="carbon-color">Carbon is colorful</p>
        <div>
          <TextInput
            className="input-test-class"
            defaultWidth={ 300 }
            helperText="Helper text"
            id="text-input-1"
            invalidText="Error message goes here"
            labelText="Label text"
            placeholder="Placeholder text"
            size="md"
            type="text"
          />
          <IconButton label="Add">
            <Add />
          </IconButton>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={ onClose }>OK</Button>
      </Modal.Footer>
    </Modal>
  );
}