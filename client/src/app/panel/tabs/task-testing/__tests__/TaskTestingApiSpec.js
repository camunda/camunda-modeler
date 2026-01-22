/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* global sinon */

import TaskTestingApi from '../TaskTestingApi';

import { ConnectionManager, Deployment } from '../../../../__tests__/mocks';


describe('<TaskTestingApi>', function() {

  describe('#getOperateUrl', function() {

    it('should return Operate URL for SaaS', async function() {

      // given
      const api = new TaskTestingApi(
        new ConnectionManager({
          getConnectionForTab: async () => {
            return {
              targetType: 'camundaCloud',
              camundaCloudClusterUrl: 'https://yyy-1.zeebe.example.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
            };
          }
        }),
        null,
        null,
        null,
        {
          path: 'path/to/file.bpmn'
        },
        null
      );


      // when
      const operateUrl = await api.getOperateUrl();

      // then
      expect(operateUrl).to.equal('https://yyy-1.operate.camunda.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
    });


    it('should return Operate URL for SM', async function() {

      // given
      const api = new TaskTestingApi(
        new ConnectionManager({
          getConnectionForTab: async () => {
            return {
              targetType: 'selfHosted',
              operateUrl: 'https://operate.example.com'
            };
          }
        }),
        null,
        null,
        null,
        {
          path: 'path/to/file.bpmn'
        },
        null
      );


      // when
      const operateUrl = await api.getOperateUrl();

      // then
      expect(operateUrl).to.equal('https://operate.example.com');
    });


    it('should return URL for unsaved file', async function() {

      // given
      const api = new TaskTestingApi(
        new ConnectionManager({
          getConnectionForTab: async () => {
            return {
              targetType: 'selfHosted',
              operateUrl: 'https://operate.example.com'
            };
          }
        }),
        null,
        null,
        null,
        {
          path: null
        },
        null
      );


      // when
      const operateUrl = await api.getOperateUrl();

      // then
      expect(operateUrl).to.equal('https://operate.example.com');
    });
  });


  describe('#deploy', function() {

    it('should save and deploy an unsaved file', async function() {

      // given
      const deploySpy = sinon.spy(() => {
        return { success: true };
      });
      const savedFile = {
        path: 'path/to/file.bpmn'
      };
      const api = new TaskTestingApi(
        new ConnectionManager({
          getConnectionForTab: async file => {
            return {
              targetType: 'camundaCloud',
              camundaCloudClusterUrl: 'https://yyy-1.zeebe.example.io/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
            };
          }
        }),
        new Deployment({
          deploy: deploySpy,
          once: () => {}
        }),
        null,
        null,
        {
          path: null
        },
        actionName => {
          return actionName === 'save' && {
            file: savedFile
          };
        }
      );

      // when
      await api.deploy();

      // then
      expect(deploySpy).to.have.been.calledWith([
        {
          path: savedFile.path,
          type: 'bpmn'
        }
      ]);
    });
  });
});
