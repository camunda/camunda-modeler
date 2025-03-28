export const TROUBLESHOOTING_URL = 'https://docs.camunda.io/docs/components/modeler/desktop-modeler/troubleshooting/#i-cannot-connect-to-zeebe';

export const CONNECTION_ERROR_REASONS = {
  UNKNOWN: 'UNKNOWN',
  CONTACT_POINT_UNAVAILABLE: 'CONTACT_POINT_UNAVAILABLE',
  CLUSTER_UNAVAILABLE: 'CLUSTER_UNAVAILABLE',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  OAUTH_URL: 'OAUTH_URL',
  UNSUPPORTED_ENGINE: 'UNSUPPORTED_ENGINE',
  INVALID_CLIENT_ID: 'INVALID_CLIENT_ID',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS'
};

export const CONNECTION_ERROR_MESSAGES = {
  [ CONNECTION_ERROR_REASONS.CONTACT_POINT_UNAVAILABLE ]: 'Cannot connect to Zeebe cluster.',
  [ CONNECTION_ERROR_REASONS.CLUSTER_UNAVAILABLE ]: 'Cannot connect to Zeebe cluster.',
  [ CONNECTION_ERROR_REASONS.UNAUTHORIZED ]: 'Credentials rejected by server.',
  [ CONNECTION_ERROR_REASONS.FORBIDDEN ]: 'This user is not permitted to deploy. Please use different credentials or get this user enabled to deploy.',
  [ CONNECTION_ERROR_REASONS.OAUTH_URL ]: 'Cannot connect to OAuth token endpoint.',
  [ CONNECTION_ERROR_REASONS.UNKNOWN ]: 'Unknown error. Please check Zeebe cluster status.',
  [ CONNECTION_ERROR_REASONS.UNSUPPORTED_ENGINE ]: 'Unsupported Zeebe version.',
  [ CONNECTION_ERROR_REASONS.INVALID_CLIENT_ID ]: 'Invalid Client ID.',
  [ CONNECTION_ERROR_REASONS.INVALID_CREDENTIALS ]: 'The client secret is not valid for the client ID provided.'
};

/**
 * Get connection validation error message for field name.
 *
 * @param {string} fieldName
 * @param {DeploymentConnectionValidationResult} validateConnectionResult
 *
 * @returns {string|React.ReactNode|null}
 */
export function getDeploymentConnectionValidationError(fieldName, validateConnectionResult) {
  if (!validateConnectionResult) {
    return null;
  }

  const {
    success,
    reason
  } = validateConnectionResult;

  if (success) {
    return null;
  }

  switch (reason) {
  case CONNECTION_ERROR_REASONS.CONTACT_POINT_UNAVAILABLE:
    return fieldName === 'endpoint.contactPoint' && (
      <>
        { CONNECTION_ERROR_MESSAGES[ reason ] } <a href={ TROUBLESHOOTING_URL }>Troubleshoot</a>
      </>
    );
  case CONNECTION_ERROR_REASONS.CLUSTER_UNAVAILABLE:
    return fieldName === 'endpoint.camundaCloudClusterUrl' && (
      <>
        { CONNECTION_ERROR_MESSAGES[ reason ] } <a href={ TROUBLESHOOTING_URL }>Troubleshoot</a>
      </>
    );
  case CONNECTION_ERROR_REASONS.UNSUPPORTED_ENGINE:
    return [
      'endpoint.camundaCloudClusterUrl',
      'endpoint.contactPoint'
    ].includes(fieldName) && CONNECTION_ERROR_MESSAGES[ reason ];
  case CONNECTION_ERROR_REASONS.UNAUTHORIZED:
  case CONNECTION_ERROR_REASONS.FORBIDDEN:
    return [
      'endpoint.audience',
      'endpoint.camundaCloudClientId',
      'endpoint.camundaCloudClientSecret',
      'endpoint.clientId',
      'endpoint.clientSecret',
      'endpoint.scope'
    ].includes(fieldName) && CONNECTION_ERROR_MESSAGES[ reason ];
  case CONNECTION_ERROR_REASONS.OAUTH_URL:
    return fieldName === 'endpoint.oauthURL' && CONNECTION_ERROR_MESSAGES[ reason ];
  case CONNECTION_ERROR_REASONS.UNKNOWN:
    return [
      'endpoint.camundaCloudClusterUrl',
      'endpoint.contactPoint',
      'endpoint.oauthURL'
    ].includes(fieldName) && (
      <>
        { CONNECTION_ERROR_MESSAGES[ reason ] } <a href={ TROUBLESHOOTING_URL }>Troubleshoot</a>
      </>
    );
  case CONNECTION_ERROR_REASONS.INVALID_CLIENT_ID:
    return fieldName === 'endpoint.camundaCloudClientId' && CONNECTION_ERROR_MESSAGES[ reason ];
  case CONNECTION_ERROR_REASONS.INVALID_CREDENTIALS:
    return fieldName === 'endpoint.camundaCloudClientSecret' && CONNECTION_ERROR_MESSAGES[ reason ];
  }
}