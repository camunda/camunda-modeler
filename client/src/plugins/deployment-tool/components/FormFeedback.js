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

export default function FormFeedback(props) {

  const {
    error,
    hint
  } = props;


  return (
    <React.Fragment>
      { error && <div className="hint error">{ error }</div> }

      { hint && <div className="hint">{ hint }</div> }
    </React.Fragment>
  );
}
