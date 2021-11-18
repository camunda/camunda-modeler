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

export default function ToggleSwitch(props) {
  const {
    id,
    switcherLabel,
    description,
    field,
    form,
    disabled,
    ...restProps
  } = props;

  return (
    <React.Fragment>
      <div className="form-group">
        <div className={ classNames('form-control-custom', 'custom-toggle') }>
          <input
            id={ id }
            type="checkbox"
            { ...field }
            { ...restProps }
            defaultChecked={ field.value }
            disabled={ disabled }
          />
          <label htmlFor={ id }>{ switcherLabel }</label>
        </div>
        { description && <div className="description">{ description }</div> }
      </div>
    </React.Fragment>
  );
}