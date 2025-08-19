/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

interface SelfHostedNoAuthEndpoint {
  type: "noAuth";
  url: string;
}

interface SelfHostedBasicAuthEndpoint {
  type: "basic";
  username: string;
  password: string;
}

interface SelfHostedOAuthEndpoint {
  type: "oauth";
  url: string;
  audience: string;
  scope?: string;
  clientId: string;
  clientSecret: string;
}

interface CamundaCloudEndpoint {
  type: "camundaCloud";
  url: string;
  clientId: string;
  clientSecret: string;
}

export type Endpoint =
  | SelfHostedNoAuthEndpoint
  | SelfHostedBasicAuthEndpoint
  | SelfHostedOAuthEndpoint
  | CamundaCloudEndpoint;
