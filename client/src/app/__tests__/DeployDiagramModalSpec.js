/* global sinon */

import React from 'react';

import {
  mount,
  shallow
} from 'enzyme';

import { DeployDiagramModal } from '../deploy-diagram-modal';
import View from '../deploy-diagram-modal/View';


describe('<DeployDiagramModal>', function() {

  it('should render', function() {
    shallow(<DeployDiagramModal />);
  });


  describe('deployment', function() {

    it('should set state.error when onDeploy throws error', async function() {
      // given
      const endpointUrl = 'http://example.com',
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
      const endpointUrl = 'http://example.com',
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
      const endpointUrl = 'http://example.com',
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
      const endpointUrl = 'http://example.com';

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


  describe('<View>', function() {

    it('should render', function() {
      shallow(<View />);
    });


    it('should render error message', function() {
      // given
      const wrapper = mount(<View error={ 'Error message' } />);

      // then
      expect(wrapper.find('.deploy-message.error')).to.have.lengthOf(1);

      wrapper.unmount();
    });


    it('should render success message', function() {
      // given
      const wrapper = mount(<View success={ 'Success message' } />);

      // then
      expect(wrapper.find('.deploy-message.success')).to.have.lengthOf(1);

      wrapper.unmount();
    });

  });

});
