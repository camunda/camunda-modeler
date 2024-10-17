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
  getClusterUrl,
  getProcessId,
  getProcessVersion
} from '../util';

describe('util', function() {

  describe('getClusterUrl', function() {

    it('should return cluster url', function() {

      // given
      const endpoint = {
        camundaCloudClusterRegion: 'camundaCloudClusterRegion',
        camundaCloudClusterId: 'camundaCloudClusterId'
      };

      // when
      const url = getClusterUrl(endpoint);

      // then
      expect(url.toString()).to.eql('https://camundacloudclusterregion.operate.camunda.io/camundaCloudClusterId');
    });
  });


  describe('getProcessId', function() {

    it('should return process id', function() {

      // given
      const response = {
        deployments: [
          {
            process: {
              bpmnProcessId: 'processId'
            }
          }
        ]
      };

      // when
      const processId = getProcessId(response);

      // then
      expect(processId).to.eql('processId');
    });


    it('should return null for empty response', function() {

      // given
      const response = {};

      // when
      const processId = getProcessId(response);

      // then
      expect(processId).to.be.null;
    });


    it('should return null if process missing', function() {

      // given
      const response = {
        deployments: []
      };

      // when
      const processId = getProcessId(response);

      // then
      expect(processId).to.be.null;
    });
  });


  describe('getProcessVersion', function() {

    it('should return version', function() {

      // given
      const response = {
        deployments: [
          {
            process: {
              bpmnProcessId: 'processId',
              version: 2
            }
          }
        ]
      };

      // when
      const version = getProcessVersion(response);

      // then
      expect(version).to.eql(2);
    });


    it('should return null for empty response', function() {

      // given
      const response = {};

      // when
      const version = getProcessVersion(response);

      // then
      expect(version).to.be.null;
    });


    it('should return null if process missing', function() {

      // given
      const response = {
        deployments: []
      };

      // when
      const version = getProcessVersion(response);

      // then
      expect(version).to.be.null;
    });

  });

});
