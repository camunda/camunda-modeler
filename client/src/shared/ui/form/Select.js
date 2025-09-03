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

import DocumentationIcon from './DocumentationIcon';

export default function Select(props) {

  const {
    label,
    field,
    form,
    description,
    documentationUrl,
    ...restProps
  } = props;

  const {
    name: fieldName
  } = field;

  return (
    <React.Fragment>
      <div className="form-group">
        <div className="custom-control custom-select">
          <label className="custom-control-label" htmlFor={ fieldName }>
            { label }
            <DocumentationIcon url={ documentationUrl } />
          </label>
          <select
            { ...field }
            disabled={ form.isSubmitting }
            className="form-control"
            id={ fieldName }
            { ...restProps }
          >
            {props.options.map(({ value, label }) => <option key={ value } value={ value }>{label}</option>)}
          </select>
          <div className="custom-control-description">{ description }</div>
        </div>
      </div>
    </React.Fragment>
  );
}
