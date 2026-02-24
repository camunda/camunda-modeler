/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import {
  getOperateUrl,
  getDeploymentUrls,
  getProcessId,
  getStartInstanceUrl
} from '../util';

import { TARGET_TYPES } from '../../../remote/ZeebeAPI';

describe('operate-url', function() {

  describe('getOperateUrl', function() {

    it('should get Camunda Operate URL (gRPC)', function() {

      // given
      const endpoint = {
        camundaCloudClusterUrl: 'https://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.yyy-1.zeebe.example.io:443'
      };

      // when
      const url = getOperateUrl(endpoint);

      // then
      expect(url.toString()).to.eql('https://yyy-1.operate.camunda.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
    });


    it('should get Camunda Operate URL (REST)', function() {

      // given
      const endpoint = {
        camundaCloudClusterUrl: 'https://yyy-1.zeebe.example.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
      };

      // when
      const url = getOperateUrl(endpoint);

      // then
      expect(url.toString()).to.eql('https://yyy-1.operate.camunda.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
    });


    it('should get Camunda Operate URL (REST v2)', function() {

      // given
      const endpoint = {
        camundaCloudClusterUrl: 'https://yyy-1.zeebe.example.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/v2/'
      };

      // when
      const url = getOperateUrl(endpoint);

      // then
      expect(url.toString()).to.eql('https://yyy-1.operate.camunda.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
    });


    it('should not get Camunda Operate URL', function() {

      // given
      const endpoint = {
        camundaCloudClusterUrl: 'https://foo.com'
      };

      // when
      const url = getOperateUrl(endpoint);

      // then
      expect(url).to.be.null;
    });


    it('should get Camunda Operate URL from explicit operateUrl (self-managed)', function() {

      // given
      const endpoint = {
        operateUrl: 'https://operate.example.com'
      };

      // when
      const url = getOperateUrl(endpoint);

      // then
      expect(url.toString()).to.eql('https://operate.example.com/');
    });


    it('should prefer explicit operateUrl over cluster URL', function() {

      // given
      const endpoint = {
        operateUrl: 'https://operate.example.com',
        camundaCloudClusterUrl: 'https://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.yyy-1.zeebe.example.io:443'
      };

      // when
      const url = getOperateUrl(endpoint);

      // then
      expect(url.toString()).to.eql('https://operate.example.com/');
    });

  });


  describe('getDeploymentUrls', function() {

    it('should get deployment URLs (BPMN)', function() {

      // given
      const deploymentResult = createMockDeploymentResult();

      const config = createMockDeploymentConfig();

      const tab = DEFAULT_TAB;

      // when
      const deploymentUrls = getDeploymentUrls(tab, config, deploymentResult);

      // then
      expect(deploymentUrls).to.eql([
        {
          processId: 'Process_1',
          url: 'https://yyy-1.operate.camunda.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/processes?process=Process_1&version=1&active=true&incidents=true'
        }
      ]);
    });


    it('should get deployment URLs (DMN)', function() {

      // given
      const deploymentResult = createMockDeploymentResult();

      const config = createMockDeploymentConfig();

      const tab = {
        file: {
          name: 'bar.dmn',
          path: 'bar.dmn'
        },
        type: 'cloud-dmn'
      };

      // when
      const deploymentUrls = getDeploymentUrls(tab, config, deploymentResult);

      // then
      expect(deploymentUrls).to.eql([
        {
          decisionId: 'Decision_1',
          url: 'https://yyy-1.operate.camunda.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/decisions?name=Decision_1&version=1'
        },
        {
          decisionId: 'Decision_2',
          url: 'https://yyy-1.operate.camunda.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/decisions?name=Decision_2&version=1'
        }
      ]);
    });


    it('should not get deployment URLs (form)', function() {

      // given
      const deploymentResult = createMockDeploymentResult();

      const config = createMockDeploymentConfig();

      const tab = {
        file: {
          name: 'baz.form',
          path: 'baz.form'
        },
        type: 'cloud-form'
      };

      // when
      const deploymentUrls = getDeploymentUrls(tab, config, deploymentResult);

      // then
      expect(deploymentUrls).to.eql([]);
    });


    it('should not get deployment URLs (no operateUrl)', function() {

      // given
      const deploymentResult = createMockDeploymentResult();

      const config = createMockDeploymentConfig({
        endpoint: createMockEndpoint({
          targetType: TARGET_TYPES.SELF_HOSTED,
          camundaCloudClusterUrl: null
        })
      });

      const tab = DEFAULT_TAB;

      // when
      const deploymentUrls = getDeploymentUrls(tab, config, deploymentResult);

      // then
      expect(deploymentUrls).to.eql([]);
    });


    it('should get deployment URLs (self-managed with operateUrl)', function() {

      // given
      const deploymentResult = createMockDeploymentResult();

      const config = createMockDeploymentConfig({
        endpoint: createMockEndpoint({
          targetType: TARGET_TYPES.SELF_HOSTED,
          camundaCloudClusterUrl: null,
          operateUrl: 'https://operate.example.com'
        })
      });

      const tab = DEFAULT_TAB;

      // when
      const deploymentUrls = getDeploymentUrls(tab, config, deploymentResult);

      // then
      expect(deploymentUrls).to.eql([
        {
          processId: 'Process_1',
          url: 'https://operate.example.com/processes?process=Process_1&version=1&active=true&incidents=true'
        }
      ]);
    });

  });


  describe('getStartInstanceUrl', function() {

    it('should get start instance URL', function() {

      // given
      const startInstanceResult = createMockStartInstanceResult();

      const config = createMockDeploymentConfig();

      // when
      const startInstanceUrl = getStartInstanceUrl(config, startInstanceResult);

      // then
      expect(startInstanceUrl).to.eql('https://yyy-1.operate.camunda.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/processes/2');
    });


    it('should get start instance URL (self-managed with operateUrl)', function() {

      // given
      const startInstanceResult = createMockStartInstanceResult();

      const config = createMockDeploymentConfig({
        endpoint: createMockEndpoint({
          targetType: TARGET_TYPES.SELF_HOSTED,
          camundaCloudClusterUrl: null,
          operateUrl: 'https://operate.example.com'
        })
      });

      // when
      const startInstanceUrl = getStartInstanceUrl(config, startInstanceResult);

      // then
      expect(startInstanceUrl).to.eql('https://operate.example.com/processes/2');
    });


    it('should not get start instance URL (no operateUrl)', function() {

      // given
      const startInstanceResult = createMockStartInstanceResult();

      const config = createMockDeploymentConfig({
        endpoint: createMockEndpoint({
          targetType: TARGET_TYPES.SELF_HOSTED,
          camundaCloudClusterUrl: null
        })
      });

      // when
      const startInstanceUrl = getStartInstanceUrl(config, startInstanceResult);

      // then
      expect(startInstanceUrl).to.be.null;
    });

  });


  describe('getProcessId', function() {

    it('should get process ID', function() {

      // given
      const deploymentResult = createMockDeploymentResult();

      const fileName = 'foo.bpmn';

      // when
      const processId = getProcessId(deploymentResult, fileName);

      // then
      expect(processId).to.eql('Process_1');
    });

  });

});

const DEFAULT_TAB = {
  file: {
    name: 'foo.bpmn',
    path: 'foo.bpmn'
  },
  type: 'cloud-bpmn'
};

function createMockEndpoint(overrides = {}) {
  return {
    targetType: TARGET_TYPES.CAMUNDA_CLOUD,
    id: 'foo',
    camundaCloudClientId: 'bar',
    camundaCloudClientSecret: 'baz',
    camundaCloudClusterUrl: 'https://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.yyy-1.zeebe.example.io:443',
    ...overrides
  };
}

function createMockDeploymentConfig(overrides = {}) {
  return {
    deployment: {},
    endpoint: createMockEndpoint(),
    ...overrides
  };
}

function createMockDeploymentResult(overrides = {}) {
  return {
    sucess: true,
    response: {
      deployments: [
        {
          process: {
            bpmnProcessId: 'Process_1',
            version: 1,
            processDefinitionKey: '1',
            resourceName: 'foo.bpmn',
            tenantId: '<default>'
          },
          Metadata: 'process'
        },
        {
          decision: {
            dmnDecisionId: 'Decision_1',
            dmnDecisionName: 'Foo',
            version: 1,
            decisionKey: '2',
            dmnDecisionRequirementsId: 'Definitions_1',
            decisionRequirementsKey: '4',
            tenantId: '<default>'
          },
          Metadata: 'decision'
        },
        {
          decision: {
            dmnDecisionId: 'Decision_2',
            dmnDecisionName: 'Bar',
            version: 1,
            decisionKey: '3',
            dmnDecisionRequirementsId: 'Definitions_1',
            decisionRequirementsKey: '4',
            tenantId: '<default>'
          },
          Metadata: 'decision'
        },
        {
          decisionRequirements: {
            dmnDecisionRequirementsId: 'Definitions_1',
            dmnDecisionRequirementsName: 'Bar',
            version: 1,
            decisionRequirementsKey: '4',
            resourceName: 'bar.dmn',
            tenantId: '<default>'
          },
          Metadata: 'decisionRequirements'
        },
        {
          form: {
            formId: 'Form_1',
            version: 1,
            formKey: '5',
            resourceName: 'baz.form',
            tenantId: '<default>'
          },
          Metadata: 'form'
        }
      ],
      key: '1234567890123456',
      tenantId: '<default>'
    },
    ...overrides
  };
}

function createMockStartInstanceResult(overrides = {}) {
  return {
    success: true,
    response: {
      processDefinitionKey: '1',
      bpmnProcessId: 'Process_1',
      version: 1,
      processInstanceKey: '2',
      tenantId: '<default>'
    },
    ...overrides
  };
}
