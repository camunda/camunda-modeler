import type { CreateProcessInstanceResponse } from '@camunda8/sdk/dist/zeebe/types';

import { DeploymentConfig } from '../deployment-plugin/types';

export type StartInstanceResponse = CreateProcessInstanceResponse;

export interface StartInstanceResult {
  success: boolean;
  response: StartInstanceResponse;
}

export interface StartInstanceConfig extends DeploymentConfig {
  variables: Record<string, any>;
}