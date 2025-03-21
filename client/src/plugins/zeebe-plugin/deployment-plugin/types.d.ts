export interface Deployment {
  name: string;
  tenantId?: string;
}

export interface AbstractEndpoint {
  id: string;
  url: string;
}

export interface SelfHostedNoAuthEndpoint extends AbstractEndpoint {
  type: 'selfHosted';
}

export interface SelfHostedBasicAuthEndpoint extends AbstractEndpoint {
  type: 'basic';
  username: string;
  password: string;
}

export interface SelfHostedOAuthEndpoint extends AbstractEndpoint {
  type: 'oauth';
  audience: string;
  scope?: string;
  clientId: string;
  clientSecret: string;
}

export interface CamundaCloudEndpoint extends AbstractEndpoint {
  type: 'camundaCloud';
  clusterId: string;
  clusterRegion?: string;
  clientId: string;
  clientSecret: string;
}

export type Endpoint = SelfHostedNoAuthEndpoint | SelfHostedBasicAuthEndpoint | SelfHostedOAuthEndpoint | CamundaCloudEndpoint;

export type Config = {
  depylement: Deployment;
  endpoint: Endpoint;
};

export type File = {
  path: string;
};

export type ValidationErrors = {
  [key: string]: string;
};

export type ConnectionCheckResult = {
  endpointErrors: ValidationErrors;
};