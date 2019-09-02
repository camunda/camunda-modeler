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
import { Field } from 'formik';

import FormControl from './FormControl';


export default function AuthBasic({ onFocusChange, ...props }) {
  return (
    <React.Fragment>
      <Field
        name="username"
        component={ FormControl }
        label="Username"
        onFocusChange={ onFocusChange }
        validated
        { ...props }
      />

      <Field
        name="password"
        component={ FormControl }
        label="Password"
        type="password"
        onFocusChange={ onFocusChange }
        validated
        { ...props }
      />
    </React.Fragment>
  );
}