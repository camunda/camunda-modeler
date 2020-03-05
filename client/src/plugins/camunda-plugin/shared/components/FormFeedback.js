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

import WarningIcon from 'icons/Warning.svg';

export default function FormFeedback(props) {

  const {
    error
  } = props;

  return (
    <React.Fragment>
      { error && (
        <div className="invalid-feedback">
          <WarningIcon />
          <span className="invalid-tooltip">{ error }</span>
        </div>
      ) }
    </React.Fragment>
  );
}
