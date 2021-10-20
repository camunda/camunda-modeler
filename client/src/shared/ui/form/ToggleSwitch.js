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


export default function ToggleSwitch(props) {
  const {
    id,
    label,
    switcherLabel,
    description,
    field,
    form,
    ...restProps
  } = props;

  return (
    <div className="custom-control-toggle" data-entry-id={ id }>
      <div className="toggle-switch">
        <label className="label"
          htmlFor={ id }>
          { label }
        </label>
        <div className="field-wrapper custom-control custom-checkbox">
          <label className="toggle-switch__switcher">
            <input
              type="checkbox"
              { ...field }
              { ...restProps }
              checked={ field.value }
            />
            <span className="toggle-switch__slider" />
          </label>
          <p className="toggle-switch__label">{ switcherLabel }</p>
        </div>
      </div>
      { description && <div className="description">{ description }</div> }
    </div>
  );
}