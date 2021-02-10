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

import classNames from 'classnames';

export default function CheckBox(props) {

  const {
    hint,
    label,
    field,
    form,
    ...restProps
  } = props;

  const {
    name: fieldName
  } = field;

  return (
    <React.Fragment>
      <div className="form-group">
        <div className={
          classNames('custom-control', 'custom-checkbox')
        }>
          <input
            { ...field }
            disabled={ form.isSubmitting }
            className="custom-control-input"
            id={ fieldName }
            { ...restProps }
          />
          <label className="custom-control-label" htmlFor={ fieldName }>{ label }</label>
        </div>
      </div>
    </React.Fragment>
  );
}
