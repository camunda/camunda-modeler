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
    disabled,
    ...restProps
  } = props;

  const entryLabel = label || switcherLabel;

  return (
    <div className="form-group">
      <div className="custom-control-toggle" data-entry-id={ id }>
        <div className="toggle-switch">
          <div className="field-wrapper">
            <label>
              <div className="toggle-switch__switcher">
                <input
                  type="checkbox"
                  { ...field }
                  { ...restProps }
                  defaultChecked={ field.value }
                  disabled={ disabled }
                />
                <span className="toggle-switch__slider" />
              </div>
              <span className="toggle-switch__label">
                { entryLabel }
              </span>
            </label>
          </div>
        </div>
        { description && <div className="description">{ description }</div> }
      </div>
    </div>
  );
}
