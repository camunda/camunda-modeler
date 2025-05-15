import type {
  Deployment as _Deployment,
  DeployResourceResponse
} from '@camunda8/sdk/dist/zeebe/types';

export type DeploymentResponse = DeployResourceResponse<_Deployment>;

export interface DeploymentResult {
  success: boolean;
  response: DeploymentResponse;
}

export interface Deployment {
  tenantId?: string;
}

export interface AbstractEndpoint {
  id: string;
  url: string;
}

export interface SelfHostedNoAuthEndpoint extends AbstractEndpoint {
  type: 'selfHosted';
  contactPoint: string;
}

export interface SelfHostedBasicAuthEndpoint extends AbstractEndpoint {
  type: 'basic';
  contactPoint: string;
  basicAuthUsername: string;
  basicAuthPassword: string;
}

export interface SelfHostedOAuthEndpoint extends AbstractEndpoint {
  type: 'oauth';
  contactPoint: string;
  oauthURL: string;
  audience: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
}

export interface CamundaCloudEndpoint extends AbstractEndpoint {
  type: 'camundaCloud';
  camundaCloudClusterId: string;
  camundaCloudClientId: string;
  camundaCloudClientSecret: string;
}

export type Endpoint = SelfHostedNoAuthEndpoint | SelfHostedBasicAuthEndpoint | SelfHostedOAuthEndpoint | CamundaCloudEndpoint;

export type DeploymentConfig = {
  deployment: Deployment;
  endpoint: Endpoint;
};

export type ResourceConfig = {
  path: string;
  type: 'bpmn' | 'dmn' | 'form' | 'rpa';
};

export type ResourceConfigs = ResourceConfig[];

export enum DeploymentConnectionValidationReason {
  UNKNOWN = 'UNKNOWN',
  CONTACT_POINT_UNAVAILABLE = 'CONTACT_POINT_UNAVAILABLE',
  CLUSTER_UNAVAILABLE = 'CLUSTER_UNAVAILABLE',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  OAUTH_URL = 'OAUTH_URL',
  UNSUPPORTED_ENGINE = 'UNSUPPORTED_ENGINE',
  INVALID_CLIENT_ID = 'INVALID_CLIENT_ID',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS'
}

export type ConnectionCheckResult = {
  success: boolean;
  reason?: DeploymentConnectionValidationReason;
}