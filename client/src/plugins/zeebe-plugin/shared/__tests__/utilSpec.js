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
  getProcessId,
  getProcessInstanceKey,
  getProcessVersion
} from '../util';

describe('util', function() {

  describe('getOperateUrl', function() {

    it('should get Camunda Operate URL', function() {

      // given
      const endpoint = {
        camundaCloudClusterUrl: 'https://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.yyy-1.zeebe.example.io:443'
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

  });


  describe('getProcessId', function() {

    it('should return process ID', function() {

      // given
      const response = createMockDeploymentResonse();

      // when
      const processId = getProcessId(response);

      // then
      expect(processId).to.eql('Process_1');
    });


    it('should not return process ID (no deployments)', function() {

      // given
      const response = createMockDeploymentResonse({
        deployments: []
      });

      // when
      const processId = getProcessId(response);

      // then
      expect(processId).to.be.null;
    });

  });


  describe('getProcessVersion', function() {

    it('should return process version', function() {

      // given
      const response = createMockDeploymentResonse();

      // when
      const version = getProcessVersion(response);

      // then
      expect(version).to.eql(1);
    });


    it('should not return process version (no deployments)', function() {

      // given
      const response = createMockDeploymentResonse({
        deployments: []
      });

      // when
      const version = getProcessVersion(response);

      // then
      expect(version).to.be.null;
    });

  });


  describe('getProcessInstanceKey', function() {

    it('should return process instance key', function() {

      // given
      const response = createMockStartInstanceResponse();

      // when
      const processInstanceKey = getProcessInstanceKey(response);

      // then
      expect(processInstanceKey).to.eql('1234567890123456');
    });

  });

});

/**
 * Create a mock deployment response.
 *
 * @returns {import('../../deployment-plugin/types').DeploymentResponse}
 */
function createMockDeploymentResonse(overrides = {}) {
  return {
    deployments: [
      {
        process: {
          bpmnProcessId: 'Process_1',
          version: 1,
          processDefinitionKey: '1234567890123456',
          resourceName: 'diagram_1.bpmn',
          tenantId: '<default>'
        },
        Metadata: 'process'
      }
    ],
    key: '1234567890123456',
    tenantId: '<default>',
    ...overrides
  };
}

/**
 * Create a mock start instance response.
 *
 * @param {Object} overrides
 *
 * @returns {import('../../start-instance-plugin/types').StartInstanceResponse}
 */
function createMockStartInstanceResponse(overrides = {}) {
  return {
    processDefinitionKey: '1234567890123456',
    bpmnProcessId: 'Process_1',
    version: 1,
    processInstanceKey: '1234567890123456',
    tenantId: '<default>',
    ...overrides
  };
}