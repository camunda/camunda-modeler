/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useState } from 'react';


import {
  Formik,
  Form as FormikForm,
  Field
} from 'formik';

import {
  Icon,
  ModalWrapper
} from '../../primitives';

import AuthTypes from './AuthTypes';

import css from './View.less';
import FormControl from './FormControl';


const SUCCESS_HEADING = 'Deployment successful';
const ERROR_HEADING = 'Deployment failed';
const DEPLOY_CHECK_PROPS = [ 'endpointUrl', 'username', 'password', 'bearer' ];


function View({
  initialValues,
  onClose,
  onDeploy,
  ...props
}) {

  return (
    <ModalWrapper className={ css.View } onClose={ onClose }>
      <h2>Deploy Diagram</h2>

      <p className="intro">
        Specify deployment details and deploy this diagram to Camunda.
      </p>


      <Formik
        initialValues={ initialValues }
        onSubmit={ onDeploy }
        render={ formikProps => <Form onClose={ onClose } { ...props } { ...formikProps } /> }
      />
    </ModalWrapper>
  );
}

function Form({ connectionError, success, error, onClose, onFocusChange = noop, validators, onDeployCheck = noop, isSubmitting, isValid, values, errors }) {
  const [ deployOpen, toggleDetails ] = useState(false);

  useEffect(() => {
    if (DEPLOY_CHECK_PROPS.every(name => !errors[name])) {
      onDeployCheck(values);
    }
  }, [ onDeployCheck, ...DEPLOY_CHECK_PROPS.map(name => errors[name]), ...DEPLOY_CHECK_PROPS.map(name => values[name]) ]);

  return (
    <React.Fragment>

      { isSubmitting && isValid && <Icon name={ 'loading' } className="loading" /> }

      { success && <DeploySuccess message={ success } /> }

      { error && <DeployError message={ error } /> }

      <FormikForm className={ css.Form }>

        <fieldset>

          <legend>
            Deployment Details
            <button
              type="button"
              className="toggle-details"
              onClick={ toggleDetails }
              title="Toggle Advanced Details"
              disabled={ values['tenantId'] }
            >
              { (deployOpen || values['tenantId']) ? '-' : '+' }
            </button>
          </legend>

          <div className="fields">
            <Field
              name="deploymentName"
              validate={ validators.deploymentName }
              component={ FormControl }
              label="Name"
              validated
              autoFocus
              onFocusChange={ onFocusChange }
            />

            { (deployOpen || values['tenantId']) && <Field
              name="tenantId"
              component={ FormControl }
              label="Tenant ID"
              onFocusChange={ onFocusChange }
            /> }
          </div>

        </fieldset>

        <fieldset>

          <legend>Endpoint Configuration</legend>

          <div className="fields">
            <Field
              name="endpointUrl"
              validate={ validators.endpointUrl }
              component={ FormControl }
              label="URL"
              hint="Should point to a running Camunda Engine REST API endpoint."
              error={ connectionError }
              successMessage={ 'Engine is available!' }
              validated
              validateOnInit
              onFocusChange={ onFocusChange }
            />

            <div>
              <label htmlFor="authType">Authentication</label>
            </div>

            <div>
              <Field name="authType" component="select">
                <option value={ AuthTypes.none } defaultValue>None</option>
                <option value={ AuthTypes.basic }>HTTP Basic</option>
                <option value={ AuthTypes.bearer }>Bearer token</option>
              </Field>
            </div>

            { values.authType === AuthTypes.basic && (
              <AuthBasic
                validators={ validators }
                onFocusChange={ onFocusChange }
              />) }

            { values.authType === AuthTypes.bearer && (
              <AuthBearer
                validators={ validators }
                onFocusChange={ onFocusChange }
              />) }
          </div>
        </fieldset>

        <div className="form-submit">
          <button
            type="submit"
            disabled={ isSubmitting }>
            Deploy
          </button>

          <button
            type="button"
            onClick={ onClose }>
            { success ? 'Close' : 'Cancel' }
          </button>
        </div>
      </FormikForm>

    </React.Fragment>
  );
}

function DeployError({ message }) {
  return (
    <div className="deploy-message error">
      <p>
        <strong>{ ERROR_HEADING }</strong>
      </p>
      <p>
        <span className="content">{ message }</span>
      </p>
    </div>
  );
}

function DeploySuccess({ message }) {
  return (
    <div className="deploy-message success">
      <p>
        <strong>{ SUCCESS_HEADING }</strong>
      </p>
      <p>
        <span className="content">{ message }</span>
      </p>
    </div>
  );
}

function AuthBasic({ onFocusChange, validators, ...props }) {
  return (
    <React.Fragment>
      <Field
        name="username"
        validate={ validators.username }
        component={ FormControl }
        label="Username"
        validated
        onFocusChange={ onFocusChange }
        { ...props }
      />

      <Field
        name="password"
        validate={ validators.password }
        component={ FormControl }
        label="Password"
        type="password"
        validated
        onFocusChange={ onFocusChange }
        { ...props }
      />
    </React.Fragment>
  );
}

function AuthBearer({ onFocusChange, validators, ...props }) {
  return (
    <Field
      name="bearer"
      validate={ validators.bearer }
      component={ FormControl }
      label="Token"
      validated
      onFocusChange={ onFocusChange }
      { ...props }
    />
  );
}

export default View;



// helpers //////
function noop() {}
