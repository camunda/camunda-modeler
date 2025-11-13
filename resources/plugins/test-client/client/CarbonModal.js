/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';

import Modal from 'camunda-modeler-plugin-helpers/components/Modal';

import { Button, Theme, IconButton, TextInput } from '@carbon/react';

import { Add } from '@carbon/icons-react';


export default function CarbonModal({ onClose, triggerAction }) {

  const [ rowId, setRowId ] = React.useState('');

  function deepLinkSettings() {
    return () => {
      triggerAction('settings-open', {
        expandRowId: rowId || undefined
      });
    };
  }
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
        <div style={ { marginTop: '20px', marginBottom: '10px' } }>
          <TextInput
            id="row-id-input"
            labelText="Row ID for Settings Deep Link"
            helperText="Enter the row ID to expand in settings (leave empty to open without expansion)"
            placeholder="e.g., 1t1g4bb"
            value={ rowId }
            onChange={ (e) => setRowId(e.target.value) }
            size="md"
          />
        </div>
        <Button onClick={ deepLinkSettings() }>Open Settings with Row ID</Button>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={ onClose }>OK</Button>
      </Modal.Footer>
    </Modal>
  );
}