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

import classnames from 'classnames';


export default function FormControl({
  field,
  hint,
  label,
  onFocusChange,
  validated,
  form: { touched, errors, isSubmitting },
  ...props
}) {
  const { name } = field;

  const invalid = errors[name] && touched[name];

  return (
    <React.Fragment>
      <div>
        <label htmlFor={ name }>{ label }</label>
      </div>

      <div>
        <input
          { ...field } { ...props }
          onFocus={ onFocusChange }
          onBlur={ compose(onFocusChange, field.onBlur) }
          disabled={ isSubmitting }
          className={ validated && classnames({
            valid: !errors[name] && touched[name],
            invalid
          }) }
        />

        { invalid ? (
          <div className="hint error">{errors[name]}</div>
        ) : null}

        { hint ? (
          <div className="hint">{ hint }</div>
        ) : null }
      </div>
    </React.Fragment>
  );
}



// helpers //////
function compose(...handlers) {
  return function(...args) {
    handlers.forEach(handler => handler(...args));
  };
}
