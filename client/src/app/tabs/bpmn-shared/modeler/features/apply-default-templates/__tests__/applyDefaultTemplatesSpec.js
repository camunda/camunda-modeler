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

import Modeler from 'test/mocks/bpmn-js/Modeler';

import applyDefaultTemplates from '../applyDefaultTemplates';


describe('applyDefaultTemplates', function() {

  /**
   * @type sinon.SinonStub
   */
  let getDefaultTemplateStub;

  beforeEach(function() {
    getDefaultTemplateStub = sinon.stub();
  });


  it('should depend on <config.changeTemplateCommand>', function() {
    expect(
      applyDefaultTemplates.$inject
    ).to.include('config.changeTemplateCommand');
  });


  it('should not throw errors for empty diagram', function() {

    // given
    const dependencies = getDependencies({
      elementTemplates: {
        getDefault: getDefaultTemplateStub
      },
      elementRegistry: {
        getAll: () => []
      }
    });

    try {

      // when
      applyDefaultTemplates(...dependencies);
    } catch (error) {

      // then
      expect(error).to.not.exist;
    }

    expect(getDefaultTemplateStub).to.not.be.called;

  });


  it('should apply default template', function() {

    // given
    const defaultTemplate = getMockTemplate();

    getDefaultTemplateStub.returns(defaultTemplate);

    const commandStackStub = sinon.stub({
      execute() {},
      clear() {}
    });

    const dependencies = getDependencies({
      commandStack: commandStackStub,
      elementTemplates: {
        getDefault: getDefaultTemplateStub
      },
      elementRegistry: {
        getAll: () => [ null ]
      }
    });

    // when
    applyDefaultTemplates(...dependencies);

    // then
    expect(commandStackStub.execute).to.be.calledOnce;
    expect(commandStackStub.clear).to.be.calledOnce;

  });


  it('should not apply not default template', function() {

    // given
    getDefaultTemplateStub.onFirstCall().returns().onSecondCall().returns({});

    const commandStackStub = sinon.stub({
      execute() {},
      clear() {}
    });

    const dependencies = getDependencies({
      commandStack: commandStackStub,
      elementTemplates: {
        getDefault: getDefaultTemplateStub
      },
      elementRegistry: {
        getAll: () => [ null, null ]
      }
    });

    // when
    applyDefaultTemplates(...dependencies);

    // then
    expect(commandStackStub.execute).to.be.calledOnce;
    expect(commandStackStub.execute.getCall(0).args[1]).to.have.lengthOf(1);

    expect(commandStackStub.clear).to.be.called;

  });


  it('should not execute commands if there are none', function() {

    // given
    getDefaultTemplateStub.returns();

    const commandStackStub = sinon.stub({
      execute() {},
      clear() {}
    });

    const dependencies = getDependencies({
      commandStack: commandStackStub,
      elementTemplates: {
        getDefault: getDefaultTemplateStub
      },
      elementRegistry: {
        getAll: () => [ null, null ]
      }
    });

    // when
    applyDefaultTemplates(...dependencies);

    // then
    expect(commandStackStub.execute).to.not.be.called;
    expect(commandStackStub.clear).to.not.be.called;

  });

});



// helpers ///////////

function getDependencies(mockModules = {}) {
  const modeler = new Modeler({
    modules: {
      eventBus: {
        on(_, callback) { callback(); }
      },
      'config.changeTemplateCommand': 'propertiesPanel.camunda.changeTemplate',
      ...mockModules
    }
  });
  const dependencies = applyDefaultTemplates.$inject.map(name => modeler.get(name));

  return dependencies;
}

function getMockTemplate() {
  return {
    isDefault: true,
    'name': 'Mock Template',
    'id': 'com.camunda.mock.template',
    'appliesTo': [
      'bpmn:Activity',
      'bpmn:Event',
      'bpmn:Gateway'
    ],
    'properties': [],
    'entriesVisible': {
      '_all': true
    }
  };
}
