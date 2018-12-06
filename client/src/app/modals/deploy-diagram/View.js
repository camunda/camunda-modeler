import React from 'react';

import classnames from 'classnames';

import {
  Formik,
  Form,
  Field
} from 'formik';

import {
  Icon,
  ModalWrapper
} from '../../primitives';

import AuthTypes from './AuthTypes';

import css from './View.less';


const SUCCESS_HEADING = 'Deployment successful';
const ERROR_HEADING = 'Deployment failed';


const View = (props) => {
  const {
    error,
    success,
    initialValues,
    onClose,
    onDeploy,
    validators
  } = props;

  return (
    <ModalWrapper className={ css.View } onClose={ onClose }>
      <h2>Deploy Diagram</h2>

      <p className="intro">
        Specify deployment details and deploy this diagram to Camunda.
      </p>


      <Formik
        initialValues={ initialValues }
        onSubmit={ onDeploy }
      >
        {({ isSubmitting, values }) => (
          <React.Fragment>

            { isSubmitting && <Icon name={ 'loading' } className="loading" /> }

            { success && <DeploySuccess message={ success } /> }

            { error && <DeployError message={ error } /> }

            <Form className={ css.Form }>

              <Field
                name="endpointUrl"
                validate={ validators.endpointUrl }
                component={ FormControl }
                label="Endpoint URL"
                hint="Should point to a running Camunda Engine REST API endpoint."
                validated
              />

              <Field
                name="deploymentName"
                validate={ validators.deploymentName }
                component={ FormControl }
                label="Deployment name"
                validated
              />

              <Field
                name="tenantId"
                component={ FormControl }
                label="Tenant id (optional)"
              />

              <div>
                <label htmlFor="authType">Auth type</label>
              </div>

              <div>
                <Field name="authType" component="select">
                  <option value={ AuthTypes.none } defaultValue>None</option>
                  <option value={ AuthTypes.basic }>HTTP Basic</option>
                  <option value={ AuthTypes.bearer }>Bearer token</option>
                </Field>
              </div>

              { values.authType === AuthTypes.basic && <AuthBasic validators={ validators } /> }

              { values.authType === AuthTypes.bearer && <AuthBearer validators={ validators } /> }

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
            </Form>

          </React.Fragment>
        )}
      </Formik>

    </ModalWrapper>
  );
};

function FormControl({
  field,
  hint,
  label,
  validated,
  form: { touched, errors, submitCount, isSubmitting },
  ...props
}) {
  const { name } = field;

  return (
    <React.Fragment>
      <div>
        <label htmlFor={ name }>{ label }</label>
      </div>

      <div>
        <input
          { ...field } { ...props }
          disabled={ isSubmitting }
          className={ validated && classnames({
            valid: !errors[name] && touched[name],
            invalid: errors[name] && touched[name]
          }) }
        />

        { errors[name] && touched[name] ? (
          <div className="hint error">{errors[name]}</div>
        ) : null}

        { hint ? (
          <div className="hint">{ hint }</div>
        ) : null }
      </div>
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

function AuthBasic({ validators, ...props }) {
  return (
    <React.Fragment>
      <Field
        name="username"
        validate={ validators.username }
        component={ FormControl }
        label="Username"
        validated
        { ...props }
      />

      <Field
        name="password"
        validate={ validators.password }
        component={ FormControl }
        label="Password"
        type="password"
        validated
        { ...props }
      />
    </React.Fragment>
  );
}

function AuthBearer({ validators, ...props }) {
  return (
    <Field
      name="bearer"
      validate={ validators.bearer }
      component={ FormControl }
      label="Token"
      validated
      { ...props }
    />
  );
}

export default View;
