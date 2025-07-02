/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'camunda-modeler-plugin-helpers/vendor/react';

import Modal from 'camunda-modeler-plugin-helpers/components/Modal';

import { Button, Theme, IconButton, TextInput } from 'camunda-modeler-plugin-helpers/vendor/@carbon/react';

import { Add } from 'camunda-modeler-plugin-helpers/vendor/@carbon/icons-react';


export default function CarbonModal({ onClose }) {

  return (
    <Modal>
      <Modal.Title>Test @react/carbon integration</Modal.Title>
      <Modal.Body>
        <Theme theme="g90">
          <div className="bx--margin-bottom-05" style={ { margin: '10px', padding: '10px' } }>If it has black background, it works.</div>
        </Theme>
        <TextInput
          className="input-test-class"
          defaultwidth={ 300 }
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
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={ onClose }>OK</Button>
      </Modal.Footer>
    </Modal>
  );
}