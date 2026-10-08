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

import {
  Label,
  Switch
} from '@camunda/design-system';

import * as css from './Field.css';


/**
 * Switch for Formik, exposed to plugins via `global.components`; keep the
 * props stable.
 */
export default function ToggleSwitch(props) {
  const {
    id,
    label,
    switcherLabel,
    description,
    field,
    form,
    disabled,
    value,
    type,
    onChange = field.onChange,
    ...restProps
  } = props;

  const entryLabel = label || switcherLabel;

  // emulate a native checkbox change for Formik and custom handlers
  const handleCheckedChange = (checked) => onChange({
    target: { name: field.name, type: 'checkbox', checked }
  });

  return (
    <div className={ css.Field } data-entry-id={ id }>
      <div className="field__option">
        <Switch
          id={ field.name }
          name={ field.name }
          size="sm"
          checked={ field.value === true }
          disabled={ disabled }
          onCheckedChange={ handleCheckedChange }
          onBlur={ field.onBlur }
          { ...restProps }
        />
        <Label htmlFor={ field.name }>
          { entryLabel }
        </Label>
      </div>
      { description && <div className="field__description">{ description }</div> }
    </div>
  );
}
