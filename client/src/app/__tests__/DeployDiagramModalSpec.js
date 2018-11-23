/* global sinon */

import React from 'react';

import {
  shallow
} from 'enzyme';

import { DeployDiagramModal } from '../deploy-diagram-modal';


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


  it('should set state.success when onDeploy resolves', async function() {
    // given
    const endpointUrl = 'http://example.com';

    const onDeployStub = sinon.stub().resolves();

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

});
