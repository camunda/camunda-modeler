/* global sinon */

import React from 'react';

import {
  shallow
} from 'enzyme';

import { DeployDiagramModal } from '../deploy-diagram-modal';
import View from '../deploy-diagram-modal/View';
import Loading from '../deploy-diagram-modal/Loading';
import ErrorMessage from '../deploy-diagram-modal/ErrorMessage';
import Success from '../deploy-diagram-modal/Success';


describe('<DeployDiagramModal>', function() {

  it('should render', function() {
    shallow(<DeployDiagramModal />);
  });


  it('should set state.error when onDeploy throws error', async function() {
    // given
    const onDeployStub = sinon.stub().rejects(new Error('errorMessage'));

    const wrapper = shallow(<DeployDiagramModal onDeploy={ onDeployStub } />);
    const instance = wrapper.instance();

    // when
    await instance.handleDeploy(new Event('click'));

    // expect
    expect(instance.state.error).to.be.a('string').not.eql('');
    expect(instance.state.success).to.eql('');
    expect(instance.state.isLoading).to.be.false;
  });


  it('should set state.success when onDeploy succeeds', async function() {
    // given
    const endpointUrl = 'http://example.com';

    const onDeployStub = sinon.stub().resolves(true);

    const wrapper = shallow(<DeployDiagramModal onDeploy={ onDeployStub } />);
    const instance = wrapper.instance();
    instance.state.endpointUrl = endpointUrl;

    // when
    await instance.handleDeploy(new Event('click'));

    // expect
    expect(instance.state.success).to.be.a('string').not.eql('');
    expect(instance.state.error).to.eql('');
    expect(instance.state.isLoading).to.be.false;
  });


  it('should unset isLoading when deployment is canceled', async function() {
    // given
    const endpointUrl = 'http://example.com';

    const onDeployStub = sinon.stub().resolves(false);

    const wrapper = shallow(<DeployDiagramModal onDeploy={ onDeployStub } />);
    const instance = wrapper.instance();
    instance.state.endpointUrl = endpointUrl;

    // when
    await instance.handleDeploy(new Event('click'));

    // expect
    expect(instance.state.success).to.eql('');
    expect(instance.state.error).to.eql('');
    expect(instance.state.isLoading).to.be.false;
  });


  it('should save endpoint used to deploy', async function() {
    // given
    const endpointUrl = 'http://example.com';

    const onDeployStub = sinon.stub().resolves();
    const onEndpointsUpdateSpy = sinon.spy();

    const wrapper = shallow(
      <DeployDiagramModal
        onDeploy={ onDeployStub }
        onEndpointsUpdate={ onEndpointsUpdateSpy }
      />
    );
    const instance = wrapper.instance();
    instance.state.endpointUrl = endpointUrl;

    // when
    await instance.handleDeploy(new Event('click'));

    // expect
    expect(onEndpointsUpdateSpy).to.be.calledWith([ endpointUrl ]);
  });


  it('should set endpointUrl to last one provided in props', function() {
    // given
    const endpointUrl = 'http://example.com';

    // when
    const wrapper = shallow(<DeployDiagramModal endpoints={ [ endpointUrl ] } />);

    // expect
    expect(wrapper.state('endpointUrl')).to.eql(endpointUrl);
  });


  it('should set endpointUrl to void string when there is none provided', function() {
    // given
    const wrapper = shallow(<DeployDiagramModal />);

    // expect
    expect(wrapper.state('endpointUrl')).to.eql('');
  });


  describe('input events', function() {
    let wrapper,
        instance;

    beforeEach(function() {
      wrapper = shallow(<DeployDiagramModal />);
      instance = wrapper.instance();
    });


    it('should handle endpoint url change', function() {
      // given
      const input = 'test',
            inputEvent = { target: { value: input } };

      // when
      instance.handleEndpointUrlChange(inputEvent);

      // then
      expect(wrapper.state('endpointUrl')).to.eql(input);
    });


    it('should handle tenant id change', function() {
      // given
      const input = 'test',
            inputEvent = { target: { value: input } };

      // when
      instance.handleTenantIdChange(inputEvent);

      // then
      expect(wrapper.state('tenantId')).to.eql(input);
    });


    it('should deployment name change', function() {
      // given
      const input = 'test',
            inputEvent = { target: { value: input } };

      // when
      instance.handleDeploymentNameChange(inputEvent);

      // then
      expect(wrapper.state('deploymentName')).to.eql(input);
    });

  });


  describe('<View>', function() {

    it('should render', function() {
      shallow(<View />);
    });


    it('should render loading indicator', function() {
      // given
      const wrapper = shallow(<View isLoading={ true } />);

      // then
      expect(wrapper.find(Loading)).to.have.lengthOf(1);
    });


    it('should render error message', function() {
      // given
      const wrapper = shallow(<View error={ 'Error' } />);

      // then
      expect(wrapper.find(ErrorMessage)).to.have.lengthOf(1);
    });


    it('should render success message', function() {
      // given
      const wrapper = shallow(<View success={ 'Success message' } />);

      // then
      expect(wrapper.find(Success)).to.have.lengthOf(1);
    });

  });

});
