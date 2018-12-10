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
    validateEndpointUrl,
    validateDeploymentName
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
        {({ errors, isSubmitting, submitCount, touched }) => (
          <React.Fragment>

            { isSubmitting && <Icon name={ 'loading' } className="loading" /> }

            { success && <DeploySuccess message={ success } /> }

            { error && <DeployError message={ error } /> }

            <Form className={ css.Form }>
              <div>
                <label htmlFor="endpointUrl">Endpoint URL</label>
              </div>

              <div>
                <Field
                  name="endpointUrl"
                  validate={ validateEndpointUrl }
                  className={ classnames({
                    valid: !errors.endpointUrl && touched.endpointUrl,
                    invalid: errors.endpointUrl && touched.endpointUrl && submitCount
                  }) }
                />

                { errors.endpointUrl && touched.endpointUrl && submitCount ? (
                  <div className="hint error">{errors.endpointUrl}</div>
                ) : null}

                <div className="hint">
                  Should point to a running Camunda Engine REST API endpoint.
                </div>
              </div>

              <div>
                <label htmlFor="deploymentName">Deployment name</label>
              </div>

              <div>
                <Field
                  name="deploymentName"
                  validate={ validateDeploymentName }
                  className={ classnames({
                    valid: !errors.deploymentName && touched.deploymentName,
                    invalid: errors.deploymentName && touched.deploymentName && submitCount
                  }) }
                />

                { errors.deploymentName && touched.deploymentName && submitCount ? (
                  <div className="hint error">{errors.deploymentName}</div>
                ) : null}
              </div>

              <div>
                <label htmlFor="tenantId">Tenant id (optional)</label>
              </div>

              <div>
                <Field name="tenantId" />
              </div>

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

export default View;
