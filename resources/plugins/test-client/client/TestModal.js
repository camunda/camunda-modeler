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


export default function TestModal({ onClose }) {

  return (
    <Modal onClose={ onClose }>
      <Modal.Title>Test plug-in modal</Modal.Title>
      <Modal.Body>
        <p style={ { color: 'var(--neutral-foreground-subtle)' } }>Contributed by the test-client plug-in.</p>
      </Modal.Body>
    </Modal>
  );
}
