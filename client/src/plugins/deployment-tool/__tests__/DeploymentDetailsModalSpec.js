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

import { shallow } from 'enzyme';

import DeploymentDetailsModal from '../DeploymentDetailsModal';
import AuthTypes from '../AuthTypes';


describe('<DeploymentDetailsModal>', () => {

  it('should render', () => {
    shallow(<DeploymentDetailsModal />);
  });


  describe('connection check', () => {

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

  });

});
