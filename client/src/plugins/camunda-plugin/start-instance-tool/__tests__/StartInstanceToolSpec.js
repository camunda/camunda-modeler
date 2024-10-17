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
  shallow,
  mount
} from 'enzyme';

import { Config } from './../../../../app/__tests__/mocks';

import { DeploymentService } from './mocks';

import StartInstanceTool from '../StartInstanceTool';

import {
  DeploymentError,
  StartInstanceError
} from '../../shared/CamundaAPI';

import { ConnectionError } from '../../shared/RestAPI';

import {
  Slot,
  SlotFillRoot
} from '../../../../app/slot-fill';

describe('<StartInstanceTool>', function() {

  it('should render', function() {
    createStartInstanceTool();
  });


  describe('deploy', function() {

    it('should deploy with saved configuration', async function() {

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


    it('should deploy with user configuration', async function() {

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


    it('should ask for deployment config on connection error', async function() {

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


    it('should ask for deployment config when starting with new configuration', async function() {

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


    it('should save deployment configuration', async function() {

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


    it('should NOT save deployment configuration if user cancelled', async function() {

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


    it('should save process definition after successful deployment', async function() {

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


    it('should get version after successful deployment', async function() {

      // given
      const activeTab = createTab({ name: 'foo.bpmn' });

      const getVersionSpy = sinon.spy(() => { return { version: '7.15.0' }; });

      const deployService = {
        getSavedDeployConfiguration: () => {
          return {
            deployment: { name: 'foo1' },
            endpoint: {
              url: 'someURI'
            }
          };
        },
        getVersion: getVersionSpy
      };

      const {
        instance
      } = createStartInstanceTool({ activeTab, deployService });

      // when
      await instance.startInstance();

      // then
      expect(getVersionSpy).to.have.been.calledOnce;
      expect(getVersionSpy.args[0][0].endpoint).to.eql({ url: 'someURI' });
    });


    it('should deploy even if version could not be fetched due to a ConnectionError', async function() {

      // given
      let deployedTo;
      const actionTriggered = {
        emitEvent: 'emit-event',
        type: 'deployment.done',
        handler: deployment => deployedTo = deployment.payload.deployedTo
      };
      const deployService = {
        getVersion() {
          throw new ConnectionError({ status: 404 });
        }
      };
      const { instance } = createStartInstanceTool({ actionTriggered, deployService });

      // when
      await instance.startInstance();

      // then
      expect(deployedTo).to.exist;
      expect(deployedTo.executionPlatformVersion).to.be.null;
      expect(deployedTo.executionPlatform).to.equal('Camunda Platform');
    });


    it('should NOT hide errors other than Connection Error', async function() {

      // given
      const handler = sinon.spy();
      const actionTriggered = {
        emitEvent: 'emit-event',
        type: 'deployment.done',
        handler
      };
      const deployService = {
        getVersion() {
          throw new TypeError('we don\'t want to ignore that!');
        }
      };
      const { instance } = createStartInstanceTool({ actionTriggered, deployService });

      // when
      let error;
      try {
        await instance.startInstance();
      } catch (e) {
        error = e;
      }

      // then
      expect(error).to.exist;
      expect(handler).not.to.have.been.called;
    });


    it('should handle deployment error given a DeploymentError', async function() {

      // given
      const activeTab = createTab({ name: 'foo.bpmn' });

      const deployErrorThrown = new DeploymentError({ status: 500 }),
            deploymentErrorSpy = sinon.spy(),
            {
              instance
            } = createStartInstanceTool({ activeTab, deployErrorThrown, deploymentErrorSpy });

      // when
      await instance.startInstance();

      // then
      expect(deploymentErrorSpy).to.have.been.calledOnce;
    });


    it('should not handle deployment error given a non DeploymentError', async function() {

      // given
      const deploymentErrorSpy = sinon.spy(),
            activeTab = createTab({ name: 'foo.bpmn' });

      const errorThrown = [
        new ConnectionError({ status: 500 }),
        new Error()
      ];

      for (let i = 0; i < errorThrown.length; i++) {

        // given
        const {
          instance
        } = createStartInstanceTool({ activeTab, deployErrorThrown: errorThrown[i], deploymentErrorSpy });

        let error;

        // when
        try {
          await instance.startInstance();
        } catch (e) {
          error = e;
        }

        // then
        expect(error).to.equal(errorThrown[i]);
        expect(deploymentErrorSpy).to.not.have.been.called;
      }
    });


    describe('emit-event action', function() {

      it('should trigger deployment.done action after successful deployment', async function() {

        // given
        const activeTab = createTab({ name: 'foo.bpmn' });

        const actionSpy = sinon.spy(),
              actionTriggered = {
                emitEvent: 'emit-event',
                type: 'deployment.done',
                handler:actionSpy
              };

        const {
          instance
        } = createStartInstanceTool({ activeTab, actionTriggered });

        // when
        await instance.startInstance();

        // then
        expect(actionSpy).to.have.been.calledOnce;
      });


      it('should include executionPlatform details in deployment.done', async function() {

        // given
        const activeTab = createTab({ name: 'foo.bpmn' });

        const actionSpy = sinon.spy(),
              getVersionSpy = sinon.spy(() => { return { version: '7.14.0' }; }),
              actionTriggered = {
                emitEvent: 'emit-event',
                type: 'deployment.done',
                handler:actionSpy
              };

        const deployService = {
          getVersion: getVersionSpy
        };

        const {
          instance
        } = createStartInstanceTool({ activeTab, actionTriggered, deployService });

        // when
        await instance.startInstance();

        // then
        expect(actionSpy).to.have.been.calledOnce;

        const deployedTo = actionSpy.args[0][0].payload.deployedTo;
        expect(deployedTo).to.exist;
        expect(deployedTo.executionPlatformVersion).to.equal('7.14.0');
        expect(deployedTo.executionPlatform).to.equal('Camunda Platform');
      });


      it('should not trigger deployment.done action after failed deployment', async function() {

        // given
        const activeTab = createTab({ name: 'foo.bpmn' });

        const actionSpy = sinon.spy(),
              actionTriggered = {
                emitEvent: 'emit-event',
                type: 'deployment.done',
                handler:actionSpy
              };

        const deployErrorThrown = new DeploymentError({ status: 500 });

        const {
          instance
        } = createStartInstanceTool({ activeTab, actionTriggered, deployErrorThrown });

        // when
        await instance.startInstance();

        // then
        expect(actionSpy).to.not.have.been.called;
      });


      it('should trigger deployment.error action after failed deployment', async function() {

        // given
        const activeTab = createTab({ name: 'foo.bpmn' });

        const actionSpy = sinon.spy(),
              actionTriggered = {
                emitEvent: 'emit-event',
                type: 'deployment.error',
                handler:actionSpy
              };

        const deployErrorThrown = new DeploymentError({ status: 500 });

        const {
          instance
        } = createStartInstanceTool({ activeTab, actionTriggered, deployErrorThrown });

        // when
        await instance.startInstance();

        // then
        expect(actionSpy).to.have.been.calledOnce;
      });


      it('should include executionPlatform details in deployment.error', async function() {

        // given
        const activeTab = createTab({ name: 'foo.bpmn' });

        const actionSpy = sinon.spy(),
              actionTriggered = {
                emitEvent: 'emit-event',
                type: 'deployment.error',
                handler:actionSpy
              };

        const deployErrorThrown = new DeploymentError({ status: 500 });

        const {
          instance
        } = createStartInstanceTool({ activeTab, actionTriggered, deployErrorThrown });

        // when
        await instance.startInstance();

        // then
        expect(actionSpy).to.have.been.calledOnce;

        const deployedTo = actionSpy.args[0][0].payload.deployedTo;
        expect(deployedTo).to.exist;
        expect(deployedTo.executionPlatformVersion).to.equal('7.15.0');
        expect(deployedTo.executionPlatform).to.equal('Camunda Platform');
      });


      it('should not trigger deployment.error action after successful deployment', async function() {

        // given
        const activeTab = createTab({ name: 'foo.bpmn' });

        const actionSpy = sinon.spy(),
              actionTriggered = {
                emitEvent: 'emit-event',
                type: 'deployment.error',
                handler:actionSpy
              };

        const {
          instance
        } = createStartInstanceTool({ activeTab, actionTriggered });

        // when
        await instance.startInstance();

        // then
        expect(actionSpy).to.not.have.been.called;
      });
    });

  });


  describe('start instance', function() {

    it('should start instance with saved configuration', async function() {

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


    it('should start instance with user configuration', async function() {

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


    it('should start instance with businessKey=null', async function() {

      // given
      const startSpy = sinon.spy();

      const activeTab = createTab({ name: 'foo.bpmn' });

      const userConfiguration = {
        businessKey: ''
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
      expect(startSpy.args[0][0].businessKey).to.be.null;
    });


    it('should NOT start instance with no executable process', async function() {

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
        duration: 4000,
        title: 'Starting process instance failed',
        type: 'error'
      });
    });


    it('should NOT start instance if deployment failed', async function() {

      // given
      const startSpy = sinon.spy();

      const deployStub = sinon.stub().throws(new DeploymentError({ status: 500 }));

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


    it('should NOT start instance if user cancelled deployment step', async function() {

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


    it('should NOT start instance if user cancelled start step', async function() {

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


    it('should handle start instance error given StartInstanceError', async function() {

      // given
      const startSpy = sinon.stub().throws(new StartInstanceError({ status: 500 }));

      const displayNotification = sinon.spy();

      const actionSpy = sinon.spy(),
            actionTriggered = {
              emitEvent: 'emit-event',
              type: 'deployment.done',
              handler: actionSpy
            };

      const activeTab = createTab({ name: 'foo.bpmn' });

      const {
        instance
      } = createStartInstanceTool({
        activeTab,
        displayNotification,
        startSpy,
        actionTriggered
      });

      // when
      await instance.startInstance();

      // then
      expect(displayNotification).to.have.been.calledOnce;
      expect(actionSpy).to.have.been.calledOnce;

      const notification = displayNotification.getCall(0).args[0];

      expect(notification.title).to.eql('Starting process instance failed');
      expect(notification.content.type).to.eql('button');

    });


    it('should not handle start instance error given non StartInstanceError', async function() {

      // given
      const errorThrown = new Error({ status: 500 });

      const startSpy = sinon.stub().throws(errorThrown);

      const logSpy = sinon.spy();

      const actionSpy = sinon.spy(),
            actionTriggered = {
              emitEvent: 'emit-event',
              type: 'deployment.done',
              handler: actionSpy
            };

      const activeTab = createTab({ name: 'foo.bpmn' });

      const {
        instance
      } = createStartInstanceTool({
        activeTab,
        log: logSpy,
        startSpy,
        actionTriggered
      });

      let error;

      // when
      try {
        await instance.startInstance();
      } catch (e) {
        error = e;
      }

      // then
      expect(error).to.equal(errorThrown);
      expect(logSpy).to.not.have.been.called;
      expect(actionSpy).to.have.been.calledOnce; // deployment still succeeds
      expect(logSpy.args.length).to.eql(0);
    });

    it('should start process instance with variables', async function() {

      // given
      const startSpy = sinon.spy();

      const activeTab = createTab({ name: 'foo.bpmn' });

      const variables = {
        'aVariable' : {
          'value' : 'aStringValue',
          'type': 'String'
        },
        'anotherVariable' : {
          'value' : true,
          'type': 'Boolean'
        }
      };

      const config = {
        getForFile: () => {
          return { businessKey: 'foo', variables: JSON.stringify(variables) };
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
      expect(startSpy.args[0][0].variables).to.eql(variables);
    });


    it('should open log error via StartInstanceError notification', async function() {

      // given
      const startSpy = sinon.stub().throws(new StartInstanceError({ status: 500 }));

      const displayNotification = sinon.spy();
      const logSpy = sinon.spy();

      const actionSpy = sinon.spy(),
            actionTriggered = {
              emitEvent: 'open-log',
              handler: actionSpy
            };

      const activeTab = createTab({ name: 'foo.bpmn' });

      const {
        instance
      } = createStartInstanceTool({
        activeTab,
        displayNotification,
        startSpy,
        actionTriggered,
        log:logSpy
      });

      // when
      await instance.startInstance();

      // then
      expect(displayNotification).to.have.been.calledOnce;
      const notification = displayNotification.getCall(0).args[0];
      expect(logSpy).to.have.been.calledOnceWith({
        category: 'start-instance-error',
        message: 'Starting instance failed',
        silent: true
      });

      expect(actionSpy).to.not.have.been.called;
      notification.content.props.onClick();
      expect(actionSpy).to.have.been.calledOnce;

    });


    describe('overlay', function() {

      describe('overlay dropdown', function() {

        it('should open', async function() {

          // given
          const activeTab = createTab({ type: 'bpmn' });

          const {
            wrapper
          } = createStartInstanceTool({
            activeTab,
            withFillSlot: true
          }, mount);

          expectOverlayDropdown(wrapper);
        });


        it('should close on button click', async function() {

          // given
          const activeTab = createTab({ type: 'bpmn' });
          const {
            wrapper
          } = createStartInstanceTool({
            activeTab,
            withFillSlot: true
          }, mount);

          const statusBarBtn = expectOverlayDropdown(wrapper);

          // then
          statusBarBtn.simulate('click');
          wrapper.update();

          // assume
          expect(wrapper.find("button[title='Start process instance']").exists()).to.be.false;
        });


        it('should close on background click', async function() {

          // given
          const activeTab = createTab({ type: 'bpmn' });

          const {
            wrapper
          } = createStartInstanceTool({
            activeTab,
            withFillSlot: true
          }, mount);

          expectOverlayDropdown(wrapper);

          // when
          document.body.dispatchEvent(new MouseEvent('mousedown'));
          wrapper.update();

          // then
          expect(wrapper.find("button[title='Start process instance']").exists()).to.be.false;
        });

      });


      it('should open', async function() {

        // given
        const activeTab = createTab({ type: 'bpmn' });

        const {
          wrapper
        } = createStartInstanceTool({
          activeTab,
          withFillSlot: true,
          keepOpen: true
        }, mount);

        // open dropdown overlay
        expectOverlayDropdown(wrapper);

        // open start instance overlay
        expectStartInstanceOverlay(wrapper);
      });


      it('should close when button is clicked', async function() {

        // given
        const activeTab = createTab({ type: 'bpmn' });

        const {
          wrapper
        } = createStartInstanceTool({
          activeTab,
          withFillSlot: true,
          keepOpen: true
        }, mount);

        // open dropdown overlay
        expectOverlayDropdown(wrapper);

        // open start instance overlay
        expectStartInstanceOverlay(wrapper);

        // click status bar button
        clickButton(wrapper, "button[title='Start current diagram']");

        expect(wrapper.html().includes('form')).to.be.false;
      });


      it('should close when active tab changes', async function() {

        // given
        const activeTab = createTab({ type: 'bpmn' });
        const { subscribe, callSubscriber } = createSubscribe(activeTab);

        const {
          wrapper
        } = createStartInstanceTool({
          activeTab,
          subscribe,
          withFillSlot: true,
          keepOpen: true
        }, mount);

        // open dropdown overlay
        expectOverlayDropdown(wrapper);

        // open start instance overlay
        expectStartInstanceOverlay(wrapper);

        // then
        callSubscriber({ activeTab: createTab() });

        // expect
        expect(wrapper.html().includes('form')).to.not.be.true;
      });

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

          const [ protocol,, host ] = deploymentUrl.split('/');
          const getCockpitUrlSpy = sinon.stub().returns(`${protocol}//${host}/app/cockpit/default/#/`);

          const {
            instance
          } = createStartInstanceTool({
            activeTab,
            deployService,
            displayNotification,
            startSpy,
            getCockpitUrlSpy,
          });

          // when
          instance.startInstance();

          function displayNotification(notification) {

            // then
            try {
              const cockpitLink = mount(notification.content).find('a').first();
              const { href } = cockpitLink.props();

              expect(href).to.eql(expectedCockpitLink);

              done();
            } catch (error) {
              done(error);
            }
          }
        };
      }


      it('should display Cockpit link', testCockpitLink(
        'http://localhost:8080/rest',
        'http://localhost:8080/app/cockpit/default/#/process-instance/foo'
      ));
    });

  });


});

// helpers //////
class TestStartInstanceTool extends StartInstanceTool {

  /**
   * @param {object} props
   * @param {'cancel'|'start'} [props.userAction='start'] user action in configuration overlay
   * @param {object} [props.businessKey] overrides for businessKey configuration
   */
  constructor(props) {
    super(props);
  }

  // removes CamundaAPI dependency
  startWithConfiguration(...args) {
    if (this.props.startInstanceErrorThrown) {
      throw this.props.startInstanceErrorThrown;
    }

    return this.props.startSpy && this.props.startSpy(...args);
  }

  // removes WellKnownAPI dependency
  async getCockpitUrl(engineUrl) {
    return this.props.getCockpitUrlSpy && await this.props.getCockpitUrlSpy(engineUrl);
  }

  async deploy(...args) {
    if (this.props.deployErrorThrown) {
      throw this.props.deployErrorThrown;
    }

    return await super.deploy(...args);
  }

  handleDeploymentError(...args) {
    super.handleDeploymentError(...args);

    return this.props.deploymentErrorSpy && this.props.deploymentErrorSpy(...args);
  }

  handleStartError(...args) {
    super.handleStartError(...args);

    return this.props.startInstanceErrorSpy && this.props.startInstanceErrorSpy(...args);
  }

  checkConnection = (...args) => {
    return this.props.connectionStub && this.props.connectionStub(...args);
  };

  hasExecutableProcess = (...args) => {
    if (this.props.executableStub) {
      return this.props.executableStub(...args);
    }

    return true;
  };

  // closes automatically when overlay is opened
  componentDidUpdate(...args) {
    super.componentDidUpdate && super.componentDidUpdate(...args);

    const { overlayState } = this.state;
    const {
      userAction,
      businessKey,
      keepOpen
    } = this.props;

    if (overlayState && overlayState.configuration) {
      const action = userAction || 'start';

      const configuration = action !== 'cancel' && {
        businessKey: businessKey || overlayState.configuration.businessKey
      };

      if (!keepOpen) {
        overlayState.handleClose(action, configuration);
      }
    }
  }

}

function createStartInstanceTool({
  activeTab = createTab(),
  ...props
} = {}, render = shallow) {
  const subscribe = (event, callback) => {
    event === 'app.activeTabChanged' && callback({ activeTab });
  };

  const triggerAction = (event, context) => {
    switch (true) {
    case (event === 'save'):
      return activeTab;
    case (props.actionTriggered &&
      props.actionTriggered.emitEvent == event &&
      props.actionTriggered.type == (context ? context.type : undefined)):
      props.actionTriggered.handler(context);
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
    getVersion: () => {
      return { version: '7.15.0' };
    },
    ...props.deployService
  });

  const StartInstance = (
    <TestStartInstanceTool
      subscribe={ props.subscribe || subscribe }
      triggerAction={ triggerAction }
      displayNotification={ noop }
      log={ props.log || noop }
      { ...props }
      deployService={ deployService }
      config={ config }
    />
  );

  const StartInstanceWithFillSlot = (
    <SlotFillRoot>
      <Slot name="status-bar__file" />
      {StartInstance}
    </SlotFillRoot>
  );

  const wrapper = render(
    props.withFillSlot ? StartInstanceWithFillSlot : StartInstance
  );

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

function createSubscribe(activeTab) {
  let callback = null;

  function subscribe(event, _callback) {
    if (event === 'app.activeTabChanged') {
      callback = _callback;
      callback({ activeTab });
    }
  }

  async function callSubscriber(...args) {
    if (callback) {
      await callback(...args);
    }
  }

  return {
    callSubscriber,
    subscribe
  };
}

function clickButton(wrapper, searchString) {
  const button = wrapper.find(searchString);
  button.simulate('click');

  return button;
}

function expectOverlayDropdown(wrapper) {

  // when
  const statusBarBtn = clickButton(wrapper, "button[title='Start current diagram']");

  // then
  expect(wrapper.find("button[title='Start process instance']").exists()).to.be.true;

  return statusBarBtn;
}

async function expectStartInstanceOverlay(wrapper) {

  // open start instance overlay
  clickButton(wrapper, "button[title='Start process instance']");

  await new Promise(function(resolve) {
    setTimeout(resolve, 10);
  });

  // assume
  expect(wrapper.html().includes('form')).to.be.true;
}
