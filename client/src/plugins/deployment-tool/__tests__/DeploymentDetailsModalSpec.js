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

import React from 'react';

import {
  mount,
  shallow
} from 'enzyme';

import DeploymentDetailsModal from '../DeploymentDetailsModal';
import AuthTypes from '../AuthTypes';


describe('<DeploymentDetailsModal>', () => {

  it('should render', () => {
    shallow(<DeploymentDetailsModal />);
  });


  describe('connection check', () => {

    let mounted = null;

    afterEach(() => {
      if (mounted && mounted.exists()) {
        mounted.unmount();
        mounted = null;
      }
    });


    it('should run connection check on mount with provided defaults', () => {

      // given
      const checkConnectionStub = sinon.stub().resolves();
      const initialFormValues = {
        endpointUrl: 'http://localhost:8088/engine-rest',
        tenantId: '',
        deploymentName: 'diagram',
        authType: AuthTypes.basic,
        username: 'demo',
        password: 'demo',
        bearer: ''
      };

      // when
      shallow(<DeploymentDetailsModal
        checkConnection={ checkConnectionStub }
        details={ initialFormValues }
      />);

      // then
      expect(checkConnectionStub).to.have.been.calledOnce;
      expect(checkConnectionStub.args[0][0]).to.eql(initialFormValues);
    });


    it('should display hint if the username and password are missing', () => {

      // given
      const checkConnectionStub = sinon.stub().resolves();
      const initialFormValues = {
        endpointUrl: 'http://localhost:8088/engine-rest',
        tenantId: '',
        deploymentName: 'diagram',
        authType: AuthTypes.basic
      };

      // when
      const { wrapper } = createModal({
        checkConnection: checkConnectionStub,
        details: initialFormValues,
        validate: () => ({ username: 'username is missing', password: 'password is missing' })
      }, mount);

      mounted = wrapper;

      // then
      const connectionCheckResult = wrapper.find('ConnectionCheckResult').first();
      const hint = connectionCheckResult.prop('hint');

      expect(checkConnectionStub).to.not.have.been.called;
      expect(hint).to.exist;
      expect(connectionCheckResult.contains(hint), 'Does not display the hint').to.be.true;
    });


    it('should display hint if token is missing', () => {

      // given
      const checkConnectionStub = sinon.stub().resolves();
      const initialFormValues = {
        endpointUrl: 'http://localhost:8088/engine-rest',
        tenantId: '',
        deploymentName: 'diagram',
        authType: AuthTypes.bearer
      };

      // when
      const { wrapper } = createModal({
        checkConnection: checkConnectionStub,
        details: initialFormValues,
        validate: () => ({ bearer: 'token is missing' })
      }, mount);

      mounted = wrapper;

      // then
      const connectionCheckResult = wrapper.find('ConnectionCheckResult').first();
      const hint = connectionCheckResult.prop('hint');

      expect(checkConnectionStub).to.not.have.been.called;
      expect(hint).to.exist;
      expect(connectionCheckResult.contains(hint), 'Does not display the hint').to.be.true;
    });

  });

});
