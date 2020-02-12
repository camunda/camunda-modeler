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

import { Config } from './../../../../app/__tests__/mocks';

import { DeploymentService } from './mocks';

import StartInstanceTool from '../StartInstanceTool';

describe('<StartInstanceTool>', () => {

  it('should render', () => {
    createStartInstanceTool();
  });


  describe('deploy', () => {

    it('should deploy with saved configuration', async () => {

      // given
      const deploySpy = sinon.spy();

      const activeTab = createTab({ name: 'foo.bpmn' });

      const deployService = {
        getSavedDeployConfiguration: () => {
          return {
            deployment: { name: 'foo1' },
            endpoint: {}
          };
        },
        deployWithConfiguration: deploySpy
      };

      const {
        instance
      } = createStartInstanceTool({ activeTab, deployService });

      // when
      await instance.startInstance();

      // then
      expect(deploySpy).to.have.been.calledOnce;
      expect(deploySpy.args[0][1].deployment.name).to.equal('foo1');
    });


    it('should deploy with user configuration', async () => {

      // given
      const deploySpy = sinon.spy();

      const activeTab = createTab({ name: 'foo.bpmn' });

      const deployService = {
        deployWithConfiguration: deploySpy
      };

      const {
        instance
      } = createStartInstanceTool({ activeTab, deployService });

      // when
      await instance.startInstance();

      // then
      expect(deploySpy).to.have.been.calledOnce;
      expect(deploySpy.args[0][1].deployment.name).to.equal('foo');
    });


    it('should ask for deployment config on connection error', async () => {

      // given
      const deploySpy = sinon.spy();

      const connectionStub = sinon.stub().returns(true);

      const activeTab = createTab({ name: 'foo.bpmn' });

      const deployService = {
        getSavedDeployConfiguration: () => {
          return {
            deployment: { name: 'should not use me' },
            endpoint: {}
          };
        },
        deployWithConfiguration: deploySpy
      };

      const {
        instance
      } = createStartInstanceTool({
        activeTab,
        deployService,
        connectionStub
      });

      // when
      await instance.startInstance();

      // then
      expect(deploySpy).to.have.been.calledOnce;
      expect(deploySpy.args[0][1].deployment.name).to.equal('foo');
    });


    it('should ask for deployment config when starting with new configuration', async () => {

      // given
      const deploySpy = sinon.spy();

      const connectionStub = sinon.stub().returns();

      const activeTab = createTab({ name: 'foo.bpmn' });

      const deployService = {
        getSavedDeployConfiguration: () => {
          return {
            deployment: { name: 'should not use me' },
            endpoint: {}
          };
        },
        deployWithConfiguration: deploySpy
      };

      const {
        instance
      } = createStartInstanceTool({
        activeTab,
        deployService,
        connectionStub
      });

      // when
      await instance.startInstance({ configure: true });

      // then
      expect(deploySpy).to.have.been.calledOnce;
      expect(deploySpy.args[0][1].deployment.name).to.equal('foo');
    });


    it('should save deployment configuration', async () => {

      // given
      const activeTab = createTab({ name: 'foo.bpmn' });

      const saveSpy = sinon.spy();

      const deployService = {
        saveDeployConfiguration: saveSpy
      };

      const {
        instance
      } = createStartInstanceTool({ activeTab, deployService });

      // when
      await instance.startInstance();

      // then
      expect(saveSpy).to.have.been.called;
      expect(saveSpy.args[0][1].deployment.name).to.equal('foo');
    });


    it('should NOT save deployment configuration if user cancelled', async () => {

      // given
      const activeTab = createTab({ name: 'foo.bpmn' });

      const saveSpy = sinon.spy();

      const deployService = {
        getDeployConfigurationFromUserInput: () => {
          return {
            action: 'cancel'
          };
        },
        saveDeployConfiguration: saveSpy
      };

      const {
        instance
      } = createStartInstanceTool({ activeTab, deployService });

      // when
      await instance.startInstance();

      // then
      expect(saveSpy).not.to.have.been.called;
    });


    it('should save process definition after successful deployment', async () => {

      // given
      const activeTab = createTab({ name: 'foo.bpmn' });

      const deployedProcessDefinition = { id: 'foo' };

      const config = {
        setForFile: sinon.spy()
      };

      const deployService = {
        deployWithConfiguration: sinon.stub().returns({ deployedProcessDefinition })
      };

      const {
        instance
      } = createStartInstanceTool({
        activeTab,
        config,
        deployService
      });

      // when
      await instance.startInstance();

      // then
      expect(config.setForFile).to.have.been.calledTwice;

      // 0: start-instance-tool, 1: process-definition
      expect(config.setForFile.args[1][2]).to.eql(deployedProcessDefinition);
    });
  });


  describe('start instance', () => {

    it('should start instance with saved configuration', async () => {

      // given
      const startSpy = sinon.spy();

      const activeTab = createTab({ name: 'foo.bpmn' });

      const config = {
        getForFile: () => {
          return { businessKey: 'foo' };
        }
      };

      const {
        instance
      } = createStartInstanceTool({
        activeTab,
        config,
        startSpy
      });

      // when
      await instance.startInstance();

      // then
      expect(startSpy).to.have.been.calledOnce;
      expect(startSpy.args[0][0].businessKey).to.equal('foo');
    });


    it('should start instance with user configuration', async () => {

      // given
      const startSpy = sinon.spy();

      const activeTab = createTab({ name: 'foo.bpmn' });

      const userConfiguration = {
        businessKey: 'bar'
      };

      const config = {
        getForFile: () => {
          return { };
        }
      };

      const deployService = {
        getSavedDeployConfiguration: () => {
          return {
            deployment: { name: 'foo' },
            endpoint: {}
          };
        }
      };

      const {
        instance
      } = createStartInstanceTool({
        activeTab,
        config,
        deployService,
        startSpy,
        ...userConfiguration,
      });

      // when
      await instance.startInstance({ configure: true });

      // then
      expect(startSpy).to.have.been.calledOnce;
      expect(startSpy.args[0][0].businessKey).to.equal('bar');
    });


    it('should NOT start instance with no executable process', async () =>{

      // given
      const executableStub = sinon.stub().returns(false);

      const displayNotification = sinon.spy();

      const activeTab = createTab({
        name: 'foo.bpmn'
      });

      const {
        instance
      } = createStartInstanceTool({
        activeTab,
        executableStub,
        displayNotification
      });

      // when
      await instance.startInstance();

      // then
      expect(displayNotification).to.have.been.calledWith({
        content: 'No executable process available.',
        duration: 10000,
        title: 'Starting process instance failed',
        type: 'error'
      });
    });


    it('should NOT start instance if deployment failed', async () => {

      // given
      const startSpy = sinon.spy();

      const deployStub = sinon.stub().throws();

      const activeTab = createTab({ name: 'foo.bpmn' });

      const config = {
        getForFile: () => {
          return { businessKey: 'foo' };
        }
      };

      const deployService = {
        deployWithConfiguration: deployStub
      };

      const {
        instance
      } = createStartInstanceTool({
        activeTab,
        config,
        deployService,
        startSpy
      });

      // when
      await instance.startInstance();

      // then
      expect(startSpy).not.to.have.been.called;
    });


    it('should NOT start instance if user cancelled deployment step', async () => {

      // given
      const startSpy = sinon.spy();

      const deployService = {
        getDeployConfigurationFromUserInput: () => {
          return {
            action: 'cancel'
          };
        }
      };

      const activeTab = createTab({ name: 'foo.bpmn' });

      const {
        instance
      } = createStartInstanceTool({
        activeTab,
        deployService,
        startSpy
      });

      // when
      await instance.startInstance();

      // then
      expect(startSpy).not.to.have.been.called;
    });


    it('should NOT start instance if user cancelled start step', async () => {

      // given
      const startSpy = sinon.spy();

      const activeTab = createTab({ name: 'foo.bpmn' });

      const {
        instance
      } = createStartInstanceTool({
        userAction: 'cancel',
        activeTab,
        startSpy
      });

      // when
      await instance.startInstance();

      // then
      expect(startSpy).not.to.have.been.called;
    });


    it('should handle start instance error', async () => {

      // given
      const startSpy = sinon.stub().throws();

      const logSpy = sinon.spy();

      const activeTab = createTab({ name: 'foo.bpmn' });

      const config = {
        getForFile: () => {
          return { businessKey: 'foo' };
        }
      };

      const {
        instance
      } = createStartInstanceTool({
        activeTab,
        config,
        log: logSpy,
        startSpy
      });

      // when
      await instance.startInstance();

      // then
      expect(logSpy).to.have.been.calledOnce;
      expect(logSpy.args[0][0].category).to.eql('start-instance-error');
    });


    describe('Cockpit link', function() {

      function testCockpitLink(deploymentUrl, expectedCockpitLink) {

        return done => {

          // given
          const activeTab = createTab({ name: 'foo.bpmn' });

          const startSpy = sinon.stub().returns({ id: 'foo' });

          const deployService = {
            getSavedDeployConfiguration: () => {
              return {
                deployment: { name: 'foo' },
                endpoint: { url: deploymentUrl }
              };
            }
          };

          const {
            instance
          } = createStartInstanceTool({
            activeTab,
            deployService,
            displayNotification,
            startSpy
          });

          // when
          instance.startInstance();

          function displayNotification(notification) {

            // then
            try {
              const cockpitLink = shallow(notification.content).find('a').first();
              const { href } = cockpitLink.props();

              expect(href).to.eql(expectedCockpitLink);

              done();
            } catch (error) {
              done(error);
            }
          }
        };
      }


      it('should display Spring-specific Cockpit link', testCockpitLink(
        'http://localhost:8080/rest',
        'http://localhost:8080/app/cockpit/default/#/process-instance/foo'
      ));


      it('should display Tomcat-specific Cockpit link', testCockpitLink(
        'http://localhost:8080/engine-rest',
        'http://localhost:8080/camunda/app/cockpit/default/#/process-instance/foo'
      ));


      it('should display Spring-specific Cockpit link for custom rest url', testCockpitLink(
        'http://customized-camunda.bpmn.io/custom-rest',
        'http://customized-camunda.bpmn.io/app/cockpit/default/#/process-instance/foo'
      ));
    });

  });


});

// helpers //////
class TestStartInstanceTool extends StartInstanceTool {

  /**
   * @param {object} props
   * @param {'cancel'|'start'} [props.userAction='start'] user action in configuration modal
   * @param {object} [props.businessKey] overrides for businessKey configuration
   */
  constructor(props) {
    super(props);
  }

  // removes CamundaAPI dependency
  startWithConfiguration(...args) {
    return this.props.startSpy && this.props.startSpy(...args);
  }

  checkConnection = (...args) => {
    return this.props.connectionStub && this.props.connectionStub(...args);
  }

  hasExecutableProcess = (...args) => {
    if (this.props.executableStub) {
      return this.props.executableStub(...args);
    }

    return true;
  }

  // closes automatically when modal is opened
  componentDidUpdate(...args) {
    super.componentDidUpdate && super.componentDidUpdate(...args);

    const { modalState } = this.state;
    const {
      userAction,
      businessKey
    } = this.props;

    if (modalState) {
      const action = userAction || 'start';

      const configuration = action !== 'cancel' && {
        businessKey: businessKey || modalState.configuration.businessKey
      };

      modalState.handleClose(action, configuration);
    }
  }

}

function createStartInstanceTool({
  activeTab = createTab(),
  ...props
} = {}, render = shallow) {
  const subscribe = (event, callback) => {
    event === 'app.activeTabChanged' && callback(activeTab);
  };

  const triggerAction = event => {
    switch (event) {
    case 'save':
      return activeTab;
    }
  };

  const config = new Config({
    get: (_, defaultValue) => defaultValue,
    ...props.config
  });

  const deployService = new DeploymentService({
    getDeployConfigurationFromUserInput: () => {
      return {
        configuration: {
          deployment: { name: 'foo' },
          endpoint: {}
        }
      };
    },
    ...props.deployService
  });

  const wrapper = render(<TestStartInstanceTool
    subscribe={ subscribe }
    triggerAction={ triggerAction }
    displayNotification={ noop }
    log={ props.log || noop }
    { ...props }
    deployService={ deployService }
    config={ config }
  />);

  return {
    wrapper,
    instance: wrapper.instance()
  };
}

function createTab(overrides = {}) {
  return {
    id: 42,
    name: 'foo.bar',
    type: 'bar',
    title: 'unsaved',
    file: {
      name: 'foo.bar',
      contents: '',
      path: null
    },
    ...overrides
  };
}

function noop() {}
