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


  it('should set state.error to error message when onDeploy throws error', async function() {
    // given
    const errorMessage = 'error';

    const onDeployStub = sinon.stub().throws({ message: errorMessage });

    const wrapper = shallow(<DeployDiagramModal onDeploy={ onDeployStub } />);
    const instance = wrapper.instance();

    // when
    await instance.handleDeploy(new Event('click'));

    // expect
    expect(instance.state.error).to.be.equal(errorMessage);
  });


  it('should set state.success to success message when onDeploy resolves', async function() {
    // given
    const endpointUrl = 'http://example.com';
    const successMessage = `Successfully deployed diagram to ${endpointUrl}`;

    const onDeployStub = sinon.stub().resolves();

    const wrapper = shallow(<DeployDiagramModal onDeploy={ onDeployStub } />);
    const instance = wrapper.instance();
    instance.state.endpointUrl = endpointUrl;

    // when
    await instance.handleDeploy(new Event('click'));

    // expect
    expect(instance.state.success).to.be.equal(successMessage);
  });

});
