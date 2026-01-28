/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { Fragment, useState } from 'react';

import { Fill } from '../../app/slot-fill';

import FeedbackIcon from 'icons/Feedback.svg';

export default function CopilotPlugin(props) {

  const {
    subscribe,
    settings
  } = props;

  const toggleKapa = () => {
    console.log('Kapa AI');
  };

  const toggleCopilot = () => {
    console.log('Copilot');
  };

  return (
    <Fragment>
      <Fill slot="status-bar__app" group="9_ai">
        <button
          className="btn"
          title="Copilot"
          onClick={ toggleKapa }
        >
          <FeedbackIcon className="icon" />
        </button>
        <button
          className="btn"
          title="Copilot"
          onClick={ toggleCopilot }
        >
          <FeedbackIcon className="icon" />
        </button>
      </Fill>
    </Fragment>
  );
}