import React from 'react';

import classnames from 'classnames';

import { ModalWrapper } from '../primitives';

import ErrorMessage from './ErrorMessage';
import Loading from './Loading';
import Success from './Success';

import css from './View.less';


const SUCCESS_HEADING = '✅ Successfully deployed the diagram.';
const ERROR_HEADING = '❌ The diagram could not be deployed.';


const View = (props) => {
  const {
    error,
    isLoading,
    success
  } = props;

  const shouldDisplayEndpointUrlError = props.endpointUrlTouched && props.endpointUrlError,
        shouldDisplayDeploymentNameError = props.deploymentNameTouched && props.deploymentNameError;

  return (
    <ModalWrapper className={ css.View } onClose={ props.onClose }>
      <h2>Deploy Diagram</h2>

      <p className="intro">
        Specify deployment details and deploy this diagram to Camunda.
      </p>

      { isLoading && <Loading /> }

      { success && <Success heading={ SUCCESS_HEADING } message={ success } /> }

      { error && <ErrorMessage heading={ ERROR_HEADING } message={ error } /> }



      <form
        className={ css.Form }
        onSubmit={ props.onDeploy }
      >

        <div>
          <label htmlFor="endpoint-url">
            Endpoint URL
          </label>
        </div>

        <div>
          <input
            id="endpoint-url"
            type="text"
            value={ props.endpointUrl }
            onChange={ props.onEndpointUrlChange }
            onBlur={ props.onEndpointUrlTouch }
            disabled={ isLoading }
            className={ classnames({
              [css.InputValid]: !props.endpointUrlError,
              [css.InputInvalid]: shouldDisplayEndpointUrlError
            }) }
          />
          { shouldDisplayEndpointUrlError && <span className={ css.InputError }>{ props.endpointUrlError }</span> }

          <div className="hint">
            This should point to the <code>/deployment/create</code> endpoint
            inside your Camunda REST API.
          </div>
        </div>

        <div>
          <label htmlFor="deployment-name">Deployment Name</label>
        </div>

        <div>
          <input
            id="deployment-name"
            name="deployment-name"
            type="text"
            value={ props.deploymentName }
            onChange={ props.onDeploymentNameChange }
            onBlur={ props.onDeploymentNameTouch }
            disabled={ isLoading }
            className={ classnames({
              [css.InputValid]: !props.deploymentNameError,
              [css.InputInvalid]: shouldDisplayDeploymentNameError
            }) }
          />
          { shouldDisplayDeploymentNameError && <span className={ css.InputError }>{ props.deploymentNameError }</span> }
        </div>

        <div>
          <label htmlFor="tenant-id">Tenant Id</label>
        </div>

        <div>
          <input
            id="tenant-id"
            name="tenant-id"
            type="text"
            value={ props.tenantId }
            onChange={ props.onTenantIdChange }
            disabled={ isLoading }
          />
        </div>

        <div></div>

        <div>
          <button
            type="submit"
            disabled={ isLoading || !props.isFormValid }>
            Deploy
          </button>

          <button
            type="button"
            onClick={ props.onClose }>
            Cancel
          </button>
        </div>

      </form>

    </ModalWrapper>
  );
};

export default View;
