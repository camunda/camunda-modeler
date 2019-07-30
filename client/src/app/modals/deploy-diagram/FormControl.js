/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect } from 'react';
import classnames from 'classnames';


export default function FormControl({
  field,
  hint,
  label,
  onFocusChange,
  validated,
  validateOnInit,
  successMessage,
  error,
  form:
  {
    touched,
    errors,
    isSubmitting,
    setFieldTouched
  },
  ...props
}) {
  const { name } = field;

  if (validateOnInit) {
    useEffect(() => {
      setFieldTouched(name, true, true);
    }, []);
  }

  error = errors[name] || error;

  const valid = error === undefined && touched[name],
        invalid = error && touched[name];

  return (<React.Fragment>
    <div>
      <label htmlFor={ name }>{label}</label>
    </div>

    <div>
      <input
        { ...field }
        { ...props }
        onFocus={ onFocusChange }
        onBlur={ compose(onFocusChange, field.onBlur) }
        disabled={ isSubmitting }
        className={ validated
        &&
        classnames({
          valid,
          invalid
        }) }
      />

      { invalid ? (<div className="hint error">{ error }</div>) : null }

      { valid && successMessage ? (
        <div className="hint success">{ successMessage }</div>
      ) : hint ? (
        <div className="hint">{hint}</div>
      ) : null
      }
    </div>
  </React.Fragment>);
}



// helper ////
function compose(...handlers) {
  return function(...args) {
    handlers.forEach(handler => handler(...args));
  };
}
