import React from 'react';

import { ModalWrapper } from '../primitives';

import ErrorMessage from './ErrorMessage';
import Loading from './Loading';
import Success from './Success';

import { View as style } from './View.less';


const View = (props) => {
  const {
    error,
    isLoading,
    success
  } = props;

  return (
    <ModalWrapper className={ style } onClose={ props.onClose }>
      <h2>Deploy Diagram</h2>

      <p className="intro">
        Specify deployment details and deploy this diagram to Camunda.
      </p>

      { isLoading && <Loading /> }

      { success && <Success message={ success } /> }

      { error && <ErrorMessage message={ error } /> }



      <form
        className="ca-form"
        onSubmit={ props.onDeploy }>

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
            disabled={ isLoading }
            required />

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
            disabled={ isLoading }
            required
          />
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
            disabled={ isLoading }>
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
