/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* global sinon */

import React from 'react';

import {
  mount,
  shallow
} from 'enzyme';

import { DeployDiagramModal } from '..';
import View from '../View';
import AuthTypes from '../AuthTypes';

const MOCK_ENDPOINT_URL = 'http://example.com/deployment/create';


describe('<DeployDiagramModal>', function() {

  it('should render', function() {
    shallow(<DeployDiagramModal />);
  });


  describe('deployment', function() {

    it('should set state.error when onDeploy throws error', async function() {
      // given
      const endpointUrl = MOCK_ENDPOINT_URL,
            deploymentName = 'deploymentName';

      const onDeployStub = sinon.stub().rejects(new Error('errorMessage'));
      const setSubmittingSpy = sinon.spy();

      const wrapper = shallow(<DeployDiagramModal onDeploy={ onDeployStub } />);
      const instance = wrapper.instance();

      // when
      await instance.handleDeploy({
        endpointUrl,
        deploymentName
      }, {
        setSubmitting: setSubmittingSpy
      });

      // expect
      expect(instance.state.error).to.be.a('string').not.eql('');
      expect(instance.state.success).to.eql('');
      expect(setSubmittingSpy).to.be.calledOnceWithExactly(false);
    });


    it('should set state.success when onDeploy succeeds', async function() {
      // given
      const endpointUrl = MOCK_ENDPOINT_URL,
            deploymentName = 'deploymentName';

      const onDeployStub = sinon.stub().resolves(true);
      const setSubmittingSpy = sinon.spy();

      const wrapper = shallow(<DeployDiagramModal onDeploy={ onDeployStub } />);
      const instance = wrapper.instance();

      // when
      await instance.handleDeploy({
        endpointUrl,
        deploymentName
      }, {
        setSubmitting: setSubmittingSpy
      });

      // expect
      expect(instance.state.success).to.be.a('string').not.eql('');
      expect(instance.state.error).to.eql('');
      expect(setSubmittingSpy).to.be.calledOnceWithExactly(false);
    });


    it('should unset isLoading when deployment is canceled', async function() {
      // given
      const endpointUrl = MOCK_ENDPOINT_URL,
            deploymentName = 'deploymentName';

      const onDeployStub = sinon.stub().resolves(false);
      const setSubmittingSpy = sinon.spy();

      const wrapper = shallow(<DeployDiagramModal onDeploy={ onDeployStub } />);
      const instance = wrapper.instance();

      // when
      await instance.handleDeploy({
        endpointUrl,
        deploymentName
      }, {
        setSubmitting: setSubmittingSpy
      });

      // expect
      expect(instance.state.success).to.eql('');
      expect(instance.state.error).to.eql('');
      expect(setSubmittingSpy).to.be.calledOnceWithExactly(false);
    });


    it('should save endpoint used to deploy', async function() {
      // given
      const endpointUrl = MOCK_ENDPOINT_URL,
            deploymentName = 'deploymentName';

      const onDeployStub = sinon.stub().resolves();
      const onEndpointsUpdateSpy = sinon.spy();

      const wrapper = shallow(
        <DeployDiagramModal
          onDeploy={ onDeployStub }
          onEndpointsUpdate={ onEndpointsUpdateSpy }
        />
      );
      const instance = wrapper.instance();

      // when
      await instance.handleDeploy({
        endpointUrl,
        deploymentName
      }, {
        setSubmitting: sinon.spy()
      });

      // expect
      expect(onEndpointsUpdateSpy).to.be.calledWith([ endpointUrl ]);
    });


    it('should save exactly the endpoint provided by the user', async function() {
      // given
      const endpointUrl = 'http://example.com',
            deploymentName = 'deploymentName';

      const onDeployStub = sinon.stub().resolves();
      const onEndpointsUpdateSpy = sinon.spy();

      const wrapper = shallow(
        <DeployDiagramModal
          onDeploy={ onDeployStub }
          onEndpointsUpdate={ onEndpointsUpdateSpy }
        />
      );
      const instance = wrapper.instance();

      // when
      await instance.handleDeploy({
        endpointUrl,
        deploymentName
      }, {
        setSubmitting: sinon.spy()
      });

      // expect
      expect(onEndpointsUpdateSpy).to.be.calledWith([ endpointUrl ]);
    });

  });


  describe('reusing endpoint url', function() {

    it('should set endpointUrl to last one provided in props', function() {
      // given
      const endpointUrl = MOCK_ENDPOINT_URL;

      // when
      const wrapper = shallow(<DeployDiagramModal endpoints={ [ endpointUrl ] } />);

      // expect
      expect(wrapper.find(View).prop('initialValues')).to.have.property('endpointUrl').eql(endpointUrl);
    });


    it('should set endpointUrl to void string when there is none provided', function() {
      // given
      const wrapper = shallow(<DeployDiagramModal />);

      // expect
      expect(wrapper.find(View).prop('initialValues')).to.have.property('endpointUrl').eql('');
    });

  });


  describe('endpoint URL suffix', function() {

    it('should add "/deployment/create" suffix if user does not provide it', async function() {
      // given
      const endpointUrl = 'http://example.com',
            deploymentName = 'deploymentName',
            expectedEndpointUrl = `${endpointUrl}/deployment/create`;

      const onDeployStub = sinon.stub().resolves();

      const wrapper = shallow(
        <DeployDiagramModal
          onDeploy={ onDeployStub }
        />
      );
      const instance = wrapper.instance();

      // when
      await instance.handleDeploy({
        endpointUrl,
        deploymentName
      }, {
        setSubmitting: sinon.spy()
      });

      // expect
      expect(onDeployStub).to.be.calledOnce;

      const payload = onDeployStub.getCall(0).args[0];

      expect(payload).to.have.property('endpointUrl').eql(expectedEndpointUrl);
    });


    it('should not add excessive "/" before "/deployment/create" suffix', async function() {
      // given
      const endpointUrl = 'http://example.com/',
            deploymentName = 'deploymentName',
            expectedEndpointUrl = `${endpointUrl}deployment/create`;

      const onDeployStub = sinon.stub().resolves();

      const wrapper = shallow(
        <DeployDiagramModal
          onDeploy={ onDeployStub }
        />
      );
      const instance = wrapper.instance();

      // when
      await instance.handleDeploy({
        endpointUrl,
        deploymentName
      }, {
        setSubmitting: sinon.spy()
      });

      // expect
      expect(onDeployStub).to.be.calledOnce;

      const payload = onDeployStub.getCall(0).args[0];

      expect(payload).to.have.property('endpointUrl').eql(expectedEndpointUrl);
    });

  });


  describe('form validation', function() {

    let wrapper,
        instance;

    beforeEach(function() {
      wrapper = shallow(<DeployDiagramModal />);
      instance = wrapper.instance();
    });


    describe('endpointUrl', function() {

      it('should not accept void endpoint url', function() {
        // given
        const endpointUrl = '';

        // then
        expect(instance.validateEndpointUrl(endpointUrl)).to.not.be.undefined;
      });


      it('should not accept endpoint url without protocol', function() {
        // given
        const endpointUrl = 'localhost';

        // then
        expect(instance.validateEndpointUrl(endpointUrl)).to.not.be.undefined;
      });


      it('should not accept ftp protocol for endpoint url', function() {
        // given
        const endpointUrl = 'ftp://localhost';

        // then
        expect(instance.validateEndpointUrl(endpointUrl)).to.not.be.undefined;
      });


      it('should accept endpoint url starting with "https://"', function() {
        // given
        const endpointUrl = 'https://localhost';

        // then
        expect(instance.validateEndpointUrl(endpointUrl)).to.be.undefined;
      });


      it('should accept endpoint url starting with "http://"', function() {
        // given
        const endpointUrl = 'http://localhost';

        // then
        expect(instance.validateEndpointUrl(endpointUrl)).to.be.undefined;
      });

    });


    describe('deployment name', function() {

      it('should not accept void deployment name', function() {
        // given
        const deploymentName = '';

        // then
        expect(instance.validateDeploymentName(deploymentName)).to.not.be.undefined;
      });


      it('should accept not void deployment name', function() {
        // given
        const deploymentName = 'deploymentName';

        // then
        expect(instance.validateDeploymentName(deploymentName)).to.be.undefined;
      });

    });

  });


  describe('authentication', function() {

    it('should not pass auth option when no auth method was chosen', async function() {
      // given
      const endpointUrl = 'http://example.com/',
            deploymentName = 'deploymentName';

      const onDeployStub = sinon.stub().resolves();

      const wrapper = shallow(
        <DeployDiagramModal
          onDeploy={ onDeployStub }
        />
      );
      const instance = wrapper.instance();

      // when
      await instance.handleDeploy({
        endpointUrl,
        deploymentName
      }, {
        setSubmitting: sinon.spy()
      });

      // expect
      expect(onDeployStub).to.be.calledOnce;

      const payload = onDeployStub.getCall(0).args[0];

      expect(payload).to.not.have.property('auth');
    });


    it('should pass username and password when authenticating with Basic', async function() {
      // given
      const endpointUrl = 'http://example.com/',
            deploymentName = 'deploymentName',
            username = 'username',
            password = 'password',
            authType = AuthTypes.basic;

      const onDeployStub = sinon.stub().resolves();

      const wrapper = shallow(
        <DeployDiagramModal
          onDeploy={ onDeployStub }
        />
      );
      const instance = wrapper.instance();

      // when
      await instance.handleDeploy({
        endpointUrl,
        deploymentName,
        username,
        password,
        authType
      }, {
        setSubmitting: sinon.spy()
      });

      // expect
      expect(onDeployStub).to.be.calledOnce;

      const payload = onDeployStub.getCall(0).args[0];

      expect(payload).to.have.property('auth');
      expect(payload.auth).to.have.property('username').eql(username);
      expect(payload.auth).to.have.property('password').eql(password);
    });


    it('should pass token when authenticating with Bearer', async function() {
      // given
      const endpointUrl = 'http://example.com/',
            deploymentName = 'deploymentName',
            bearer = 'bearer',
            authType = AuthTypes.bearer;

      const onDeployStub = sinon.stub().resolves();

      const wrapper = shallow(
        <DeployDiagramModal
          onDeploy={ onDeployStub }
        />
      );
      const instance = wrapper.instance();

      // when
      await instance.handleDeploy({
        endpointUrl,
        deploymentName,
        bearer,
        authType
      }, {
        setSubmitting: sinon.spy()
      });

      // expect
      expect(onDeployStub).to.be.calledOnce;

      const payload = onDeployStub.getCall(0).args[0];

      expect(payload).to.have.property('auth');
      expect(payload.auth).to.have.property('bearer').eql(bearer);
    });

  });


  describe('menu updates', function() {

    it('should update menu on mount', function() {
      // given
      const onMenuUpdateSpy = sinon.spy();

      // when
      shallow(
        <DeployDiagramModal
          onMenuUpdate={ onMenuUpdateSpy }
        />
      );

      // then
      expect(onMenuUpdateSpy).to.be.calledOnce;
    });


    it('should enable editing actions on input focus', function() {
      // given
      const wrapper = mount(
        <DeployDiagramModal />
      );
      const modal = wrapper.instance();
      const updateMenuSpy = sinon.spy(modal, 'updateMenu');

      // when
      const input = wrapper.find('input').first();

      input.simulate('focus');

      // then
      expect(updateMenuSpy).to.be.calledOnceWithExactly(true);

      wrapper.unmount();
    });


    it('should disable editing actions on input blur', function() {
      // given
      const wrapper = mount(
        <DeployDiagramModal />
      );
      const modal = wrapper.instance();
      const updateMenuSpy = sinon.spy(modal, 'updateMenu');

      // when
      const input = wrapper.find('input').first();

      input.simulate('blur');

      // then
      expect(updateMenuSpy).to.be.calledOnceWithExactly(false);

      wrapper.unmount();
    });

  });


  describe('<View>', function() {

    it('should render', function() {
      shallow(<View />);
    });


    it('should render error message', function() {
      // given
      const wrapper = mount(<View validators={ { auth: {} } } error={ 'Error message' } />);

      // then
      expect(wrapper.find('.deploy-message.error')).to.have.lengthOf(1);

      wrapper.unmount();
    });


    it('should render success message', function() {
      // given
      const wrapper = mount(<View validators={ { auth: {} } } success={ 'Success message' } />);

      // then
      expect(wrapper.find('.deploy-message.success')).to.have.lengthOf(1);

      wrapper.unmount();
    });

  });

});
