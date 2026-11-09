/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';

import React from 'react';

import { act, render, waitFor } from '@testing-library/react';

import CamundaProjects from '../CamundaProjects';
import CamundaProjectsPlugin from '../CamundaProjectsPlugin';
import { ResourcesProvider } from '../ResourcesProvider';

import { Slot, SlotFillRoot } from '../../../app/slot-fill';

import { ZeebeAPI } from '../../../app/__tests__/mocks';

import Deployment from '../../../app/zeebe/Deployment';


/**
 * Specification: https://github.com/camunda/product-hub/issues/3888,
 * section "Project membership" and the Desktop Modeler acceptance criteria.
 *
 * Project resources are resolved by the app (cf. `app/lib/file-context/project-resources`)
 * and handed over as `metadata.resources` of the project file item.
 */
describe('CamundaProjects - project membership', function() {

  let camundaProjects;

  beforeEach(function() {
    camundaProjects = new CamundaProjects();
  });


  describe('"The deployed resource set defines project membership"', function() {

    it('should include project resources only (editor intelligence: link resolution, suggestions, navigation)', function() {

      // given
      camundaProjects.emit('items-changed', createItems());

      // when
      camundaProjects.emit('activeTab-changed', { file: PROCESS.file });

      // then
      expect(camundaProjects.hasOpen()).to.be.true;
      expect(paths(camundaProjects.getItems())).to.eql([
        PROCESS.file.path,
        FORM.file.path
      ]);
    });


    it('should provide project resources as deployment resource configs, including non-indexed resources (deployment, start instance)', function() {

      // given
      camundaProjects.emit('items-changed', createItems());

      // when
      camundaProjects.emit('activeTab-changed', { file: PROCESS.file });

      // then
      expect(camundaProjects.getResourceConfigs()).to.eql([
        { path: PROCESS.file.path, type: 'bpmn' },
        { path: FORM.file.path, type: 'form' },
        { path: `${ PROJECT_PATH }/resources/.prompt.md`, type: 'resource' },
        { path: `${ PROJECT_PATH }/target/classes/generated.dmn`, type: 'dmn' }
      ]);
      expect(camundaProjects.getError()).to.be.null;
    });


    it('should use membership of .c8ignore-based selection (deployResources absent)', function() {

      // given
      camundaProjects.emit('items-changed', createItems({
        resources: {
          mode: 'c8ignore',
          selected: [ PROCESS.file.path ],
          error: null
        }
      }));

      // when
      camundaProjects.emit('activeTab-changed', { file: PROCESS.file });

      // then
      expect(paths(camundaProjects.getItems())).to.eql([ PROCESS.file.path ]);
      expect(camundaProjects.getResourceConfigs()).to.eql([ { path: PROCESS.file.path, type: 'bpmn' } ]);
    });

  });


  describe('deployment eligibility', function() {

    let CAMUNDA_7;

    beforeEach(function() {
      CAMUNDA_7 = createItem(`${ PROJECT_PATH }/camunda-7.bpmn`, null);

      CAMUNDA_7.file.messages = [ { error: true, message: 'Not a Camunda 8 BPMN file', source: 'process-error' } ];
    });

    function emitItems(mode) {
      camundaProjects.emit('items-changed', [
        createCamundaProject({
          resources: {
            mode,
            selected: [ PROCESS.file.path, CAMUNDA_7.file.path ],
            error: null
          }
        }),
        PROCESS,
        CAMUNDA_7
      ]);
    }


    it('should not deploy Camunda 7 BPMN next to Camunda 8 BPMN (deployResources absent)', function() {

      // given
      emitItems('c8ignore');

      // when
      camundaProjects.emit('activeTab-changed', { file: PROCESS.file });

      // then
      expect(camundaProjects.getResourceConfigs()).to.eql([
        { path: PROCESS.file.path, type: 'bpmn' }
      ]);
    });


    it('should deploy Camunda 7 BPMN named by deployResources', function() {

      // given
      emitItems('deployResources');

      // when
      camundaProjects.emit('activeTab-changed', { file: PROCESS.file });

      // then
      expect(camundaProjects.getResourceConfigs()).to.eql([
        { path: PROCESS.file.path, type: 'bpmn' },
        { path: CAMUNDA_7.file.path, type: 'bpmn' }
      ]);
    });

  });


  describe('"An excluded file must not contribute project resources merely because it exists under the project root"', function() {

    it('should not include excluded file located in project directory', function() {

      // given
      camundaProjects.emit('items-changed', createItems());

      // when
      camundaProjects.emit('activeTab-changed', { file: PROCESS.file });

      // then
      expect(paths(camundaProjects.getItems())).not.to.include(EXCLUDED.file.path);
      expect(paths(camundaProjects.getResourceConfigs())).not.to.include(EXCLUDED.file.path);
    });


    it('should not restore excluded file via resource references (called element linking to it)', function() {

      // given
      // PROCESS calls the process defined in EXCLUDED
      expect(PROCESS.metadata.linkedIds[0].linkedId).to.eql(EXCLUDED.metadata.processes[0].id);

      camundaProjects.emit('items-changed', createItems());

      // when
      camundaProjects.emit('activeTab-changed', { file: PROCESS.file });

      // then
      expect(paths(camundaProjects.getItems())).not.to.include(EXCLUDED.file.path);
      expect(paths(camundaProjects.getResourceConfigs())).not.to.include(EXCLUDED.file.path);
    });


    it('should not suggest excluded resources in editor (ResourcesProvider)', function() {

      // given
      camundaProjects.emit('items-changed', createItems());
      camundaProjects.emit('activeTab-changed', { file: PROCESS.file });

      const resourcesProvider = new ResourcesProvider({ register() {} }, camundaProjects);

      // when
      const resources = resourcesProvider.getResources();

      // then
      expect(resources).to.eql([
        { name: 'Process', type: 'bpmnProcess', processId: 'Process' },
        { name: 'Form', type: 'form', formId: 'Form' }
      ]);
    });

  });


  describe('"it may still be opened and used as a standalone resource, outside the project context"', function() {

    it('should not open project for excluded file', function() {

      // given
      camundaProjects.emit('items-changed', createItems());

      // when
      camundaProjects.emit('activeTab-changed', { file: EXCLUDED.file });

      // then
      expect(camundaProjects.hasOpen()).to.be.false;
      expect(camundaProjects.getItems()).to.be.empty;
      expect(camundaProjects.getResourceConfigs()).to.be.empty;
    });


    it('should not group excluded file with project', function() {

      // given
      camundaProjects.emit('items-changed', createItems());

      // then
      expect(camundaProjects.findCamundaProjectItemForResource(PROCESS)).to.equal(CAMUNDA_PROJECT);
      expect(camundaProjects.findCamundaProjectItemForResource(EXCLUDED)).not.to.exist;
    });


    it('should close project once active file is excluded and no longer indexed (e.g. behind directory link)', function() {

      // given
      const LINKED = createItem(`${ PROJECT_PATH }/linked/active.bpmn`, {
        type: 'bpmn',
        processes: [ { id: 'Linked', name: 'Linked' } ]
      });

      camundaProjects.emit('items-changed', [
        createCamundaProject({
          resources: {
            mode: 'deployResources',
            selected: [ PROCESS.file.path, LINKED.file.path ],
            error: null
          }
        }),
        PROCESS,
        LINKED
      ]);

      camundaProjects.emit('activeTab-changed', { file: LINKED.file });

      expect(camundaProjects.hasOpen()).to.be.true;

      // when
      // deselected, the explicitly indexed file is dropped from the index
      camundaProjects.emit('items-changed', [
        createCamundaProject({
          resources: {
            mode: 'deployResources',
            selected: [ PROCESS.file.path ],
            error: null
          }
        }),
        PROCESS
      ]);

      // then
      expect(camundaProjects.hasOpen()).to.be.false;
      expect(camundaProjects.getResourceConfigs()).to.be.empty;
    });


    it('should close project once active file is excluded', function() {

      // given
      camundaProjects.emit('items-changed', createItems());
      camundaProjects.emit('activeTab-changed', { file: PROCESS.file });

      expect(camundaProjects.hasOpen()).to.be.true;

      // when
      camundaProjects.emit('items-changed', createItems({
        resources: {
          mode: 'deployResources',
          selected: [ FORM.file.path ],
          error: null
        }
      }));

      // then
      expect(camundaProjects.hasOpen()).to.be.false;
    });

  });


  describe('"Invalid configuration ... / Empty final selection: error, no deployment"', function() {

    it('should keep project open with error and no resources', function() {

      // given
      const error = 'Invalid camunda.json: `deployResources` must be an array of glob patterns.';

      camundaProjects.emit('items-changed', createItems({
        resources: {
          mode: 'deployResources',
          selected: [],
          error
        }
      }));

      // when
      camundaProjects.emit('activeTab-changed', { file: PROCESS.file });

      // then
      expect(camundaProjects.hasOpen()).to.be.true;
      expect(camundaProjects.getError()).to.eql(error);
      expect(camundaProjects.getItems()).to.be.empty;
      expect(camundaProjects.getResourceConfigs()).to.be.empty;
    });


    it('should keep project open with error on invalid camunda.json (no error listener)', function() {

      // given
      camundaProjects.emit('items-changed', createItems({
        contents: '{',
        resources: {
          mode: 'c8ignore',
          selected: [],
          error: 'Invalid camunda.json: Expected property name'
        }
      }));

      // when
      camundaProjects.emit('activeTab-changed', { file: PROCESS.file });

      // then
      expect(camundaProjects.hasOpen()).to.be.true;
      expect(camundaProjects.getError()).to.match(/Invalid camunda.json/);
      expect(camundaProjects.getResourceConfigs()).to.be.empty;
    });


    it('should replace previous selection on camunda.json becoming invalid (no error listener)', function() {

      // given
      camundaProjects.emit('items-changed', createItems());
      camundaProjects.emit('activeTab-changed', { file: PROCESS.file });

      expect(camundaProjects.getResourceConfigs()).not.to.be.empty;

      // when
      camundaProjects.emit('items-changed', createItems({
        contents: '{',
        resources: {
          mode: 'c8ignore',
          selected: [],
          error: 'Invalid camunda.json: Expected property name'
        }
      }));

      // then
      expect(camundaProjects.getError()).to.match(/Invalid camunda.json/);
      expect(camundaProjects.getResourceConfigs()).to.be.empty;
    });


    it('should keep project open with error on invalid camunda.json', function() {

      // given
      const errorSpy = sinon.spy();

      camundaProjects.on('error', errorSpy);

      camundaProjects.emit('items-changed', createItems({
        contents: '{',
        resources: {
          mode: 'c8ignore',
          selected: [],
          error: 'Invalid camunda.json: Expected property name'
        }
      }));

      // when
      camundaProjects.emit('activeTab-changed', { file: PROCESS.file });

      // then
      expect(camundaProjects.hasOpen()).to.be.true;
      expect(camundaProjects.getError()).to.match(/Invalid camunda.json/);
      expect(errorSpy).to.have.been.calledOnce;
    });

  });


  describe('project files', function() {

    it('should list all project resources, including files not indexed', function() {

      // given
      camundaProjects.emit('items-changed', createItems());

      // when
      camundaProjects.emit('activeTab-changed', { file: PROCESS.file });

      // then
      const files = camundaProjects.getFiles();

      expect(paths(files)).to.eql(CAMUNDA_PROJECT_RESOURCES.selected);

      expect(files[0]).to.equal(PROCESS);
      expect(files[2].file).to.include({ name: '.prompt.md', dirname: `${ PROJECT_PATH }/resources` });
      expect(files[2].metadata).to.be.null;
    });

  });


  describe('"Nested projects are unsupported"', function() {

    it('"a nested camunda.json does not exclude that folder from the parent\'s selection"', function() {

      // given
      const nestedProject = createCamundaProject({
        path: `${ PROJECT_PATH }/nested/camunda.json`,
        resources: {
          mode: 'c8ignore',
          selected: [ `${ PROJECT_PATH }/nested/nested.bpmn` ],
          error: null
        }
      });

      const nestedDiagram = createItem(`${ PROJECT_PATH }/nested/nested.bpmn`, { type: 'bpmn', processes: [] });

      camundaProjects.emit('items-changed', [
        ...createItems({
          resources: {
            mode: 'deployResources',
            selected: [ PROCESS.file.path, nestedDiagram.file.path ],
            error: null
          }
        }),
        nestedProject,
        nestedDiagram
      ]);

      // when
      camundaProjects.emit('activeTab-changed', { file: PROCESS.file });

      // then
      expect(paths(camundaProjects.getItems())).to.eql([ PROCESS.file.path, nestedDiagram.file.path ]);
    });

  });


  describe('"membership changes from file or descriptor edits refresh ... live"', function() {

    it('should refresh items and resource configs on <items-changed>', function() {

      // given
      camundaProjects.emit('items-changed', createItems());
      camundaProjects.emit('activeTab-changed', { file: PROCESS.file });

      const changedSpy = sinon.spy();

      camundaProjects.on('changed', changedSpy);

      // when
      // e.g. `camunda.json` changed to include the previously excluded file
      camundaProjects.emit('items-changed', createItems({
        resources: {
          mode: 'deployResources',
          selected: [ EXCLUDED.file.path, PROCESS.file.path ],
          error: null
        }
      }));

      // then
      expect(changedSpy).to.have.been.calledOnce;
      expect(paths(camundaProjects.getItems())).to.eql([ PROCESS.file.path, EXCLUDED.file.path ]);
      expect(paths(camundaProjects.getResourceConfigs())).to.eql([ EXCLUDED.file.path, PROCESS.file.path ]);
    });

  });

});


describe('<CamundaProjectsPlugin> - project membership', function() {

  afterEach(function() {

    // the plugin keeps module-level state, reset it
    this.reset && this.reset();
  });


  it('should refresh deploy resources live, without automatic deployment', async function() {

    // given
    const deploySpy = sinon.stub().resolves({ success: true, response: {} });

    const deployment = new Deployment(null, null, new ZeebeAPI({ deploy: deploySpy }), null);

    const { emit, emitBackend, reset } = createCamundaProjectsPlugin({ deployment });

    this.reset = reset;

    act(() => emitBackend('file-context:changed', createItems()));
    act(() => emit('app.activeTabChanged', { activeTab: { type: 'cloud-bpmn', file: PROCESS.file } }));

    // when
    act(() => emitBackend('file-context:changed', createItems({
      resources: {
        mode: 'deployResources',
        selected: [ PROCESS.file.path ],
        error: null
      }
    })));

    // then
    await waitFor(() => {
      expect(collectResourceConfigs(deployment)).to.eql([ { path: PROCESS.file.path, type: 'bpmn' } ]);
    });

    expect(deploySpy).not.to.have.been.called;
  });


  it('should deploy project resources when task testing an active project resource ("task/scenario testing use(s) the same membership rules")', async function() {

    // given
    const deployment = new Deployment(null, null, new ZeebeAPI(), null);

    const { emit, emitBackend, reset } = createCamundaProjectsPlugin({ deployment });

    this.reset = reset;

    act(() => emitBackend('file-context:changed', createItems()));
    act(() => emit('app.activeTabChanged', { activeTab: { type: 'cloud-bpmn', file: PROCESS.file } }));

    // then
    // task testing deploys the active tab, resources providers add the project resources
    await waitFor(() => {
      expect(paths(collectResourceConfigs(deployment, [ { path: PROCESS.file.path, type: 'bpmn' } ]))).to.eql([
        PROCESS.file.path,
        FORM.file.path,
        `${ PROJECT_PATH }/resources/.prompt.md`,
        `${ PROJECT_PATH }/target/classes/generated.dmn`
      ]);
    });
  });


  it('should deploy excluded file standalone when task testing it ("including deployment and local testing")', async function() {

    // given
    const deployment = new Deployment(null, null, new ZeebeAPI(), null);

    const { emit, emitBackend, reset } = createCamundaProjectsPlugin({ deployment });

    this.reset = reset;

    act(() => emitBackend('file-context:changed', createItems()));
    act(() => emit('app.activeTabChanged', { activeTab: { type: 'cloud-bpmn', file: PROCESS.file } }));

    // when
    act(() => emit('app.activeTabChanged', { activeTab: { type: 'cloud-bpmn', file: EXCLUDED.file } }));

    // then
    // excluded files deploy on their own, no project test dependencies are added
    await waitFor(() => {
      expect(collectResourceConfigs(deployment, [ { path: EXCLUDED.file.path, type: 'bpmn' } ])).to.eql([
        { path: EXCLUDED.file.path, type: 'bpmn' }
      ]);
    });
  });


  it('should keep file deployment and start instance for excluded file (standalone use outside project context)', async function() {

    // given
    const deployment = new Deployment(null, null, new ZeebeAPI(), null);

    const { container, emit, emitBackend, reset } = createCamundaProjectsPlugin({ deployment });

    this.reset = reset;

    act(() => emitBackend('file-context:changed', createItems()));

    // when
    act(() => emit('app.activeTabChanged', { activeTab: { type: 'cloud-bpmn', file: PROCESS.file } }));

    // then
    // project deployment and start instance replace the file ones
    await waitFor(() => {
      expect(container.querySelector('[title="Open project deployment"]')).to.exist;
      expect(container.querySelector('[title="Open project start instance"]')).to.exist;
    });

    // when
    act(() => emit('app.activeTabChanged', { activeTab: { type: 'cloud-bpmn', file: EXCLUDED.file } }));

    // then
    // file deployment and start instance (not rendered here) are not replaced
    await waitFor(() => {
      expect(container.querySelector('[title="Open project deployment"]')).not.to.exist;
      expect(container.querySelector('[title="Open project start instance"]')).not.to.exist;
    });
  });


  it('should list all project resources in status bar, including files not indexed', async function() {

    // given
    const deployment = new Deployment(null, null, new ZeebeAPI(), null);

    const { container, emit, emitBackend, getByText, reset } = createCamundaProjectsPlugin({ deployment });

    this.reset = reset;

    act(() => emitBackend('file-context:changed', createItems()));
    act(() => emit('app.activeTabChanged', { activeTab: { type: 'cloud-bpmn', file: PROCESS.file } }));

    await waitFor(() => {
      expect(container.querySelector('.has-camunda-project')).to.exist;
    });

    // when
    act(() => container.querySelector('.has-camunda-project').click());

    // then
    await waitFor(() => {
      expect(getByText('.prompt.md')).to.exist;
    });

    expect(getByText('generated.dmn')).to.exist;
    expect(getByText('process.bpmn')).to.exist;
    expect(getByText('form.form')).to.exist;
  });


  it('should report invalid camunda.json and prevent deployment (production plugin without error listener)', async function() {

    // given
    const deploySpy = sinon.stub().resolves({ success: true, response: {} });

    const deployment = new Deployment(null, null, new ZeebeAPI({ deploy: deploySpy }), null);

    const { container, emit, emitBackend, getByText, reset } = createCamundaProjectsPlugin({ deployment });

    this.reset = reset;

    act(() => emitBackend('file-context:changed', createItems()));
    act(() => emit('app.activeTabChanged', { activeTab: { type: 'cloud-bpmn', file: PROCESS.file } }));

    // when
    act(() => emitBackend('file-context:changed', createItems({
      contents: '{',
      resources: {
        mode: 'c8ignore',
        selected: [],
        error: 'Invalid camunda.json: Expected property name'
      }
    })));

    // then
    await waitFor(() => {
      expect(() => collectResourceConfigs(deployment)).to.throw('Invalid camunda.json');
    });

    act(() => container.querySelector('.has-camunda-project').click());

    await waitFor(() => {
      expect(getByText('Invalid camunda.json: Expected property name')).to.exist;
    });

    expect(deploySpy).not.to.have.been.called;
  });


  it('should prevent any deployment in project context on invalid configuration', async function() {

    // given
    const deploySpy = sinon.stub().resolves({ success: true, response: {} });

    const deployment = new Deployment(null, null, new ZeebeAPI({ deploy: deploySpy }), null);

    const { emit, emitBackend, reset } = createCamundaProjectsPlugin({ deployment });

    this.reset = reset;

    act(() => emitBackend('file-context:changed', createItems({
      resources: {
        mode: 'deployResources',
        selected: [],
        error: 'No deployable files found: `deployResources` in camunda.json selects no files.'
      }
    })));
    act(() => emit('app.activeTabChanged', { activeTab: { type: 'cloud-bpmn', file: PROCESS.file } }));

    // when
    let result;

    await waitFor(async () => {
      result = await deployment.deploy([ { path: PROCESS.file.path, type: 'bpmn' } ], {
        endpoint: { id: 'foo', targetType: 'selfHosted', url: 'http://localhost:8080' }
      });

      expect(result.success).to.be.false;
      expect(result.response.message).to.match(/No deployable files found/);
    });

    // then
    expect(deploySpy).not.to.have.been.called;
  });

});


// helpers //////////

const PROJECT_PATH = 'C://camunda-project';

const CAMUNDA_PROJECT_RESOURCES = {
  mode: 'deployResources',
  selected: [
    `${ PROJECT_PATH }/process.bpmn`,
    `${ PROJECT_PATH }/resources/form.form`,
    `${ PROJECT_PATH }/resources/.prompt.md`,
    `${ PROJECT_PATH }/target/classes/generated.dmn`
  ],
  error: null
};

const PROCESS = createItem(`${ PROJECT_PATH }/process.bpmn`, {
  type: 'bpmn',
  processes: [ { id: 'Process', name: 'Process' } ],
  linkedIds: [ { type: 'bpmn', elementId: 'CallActivity', linkedId: 'Excluded' } ]
});

const FORM = createItem(`${ PROJECT_PATH }/resources/form.form`, {
  type: 'form',
  forms: [ { id: 'Form', name: 'Form' } ]
});

const EXCLUDED = createItem(`${ PROJECT_PATH }/drafts/excluded.bpmn`, {
  type: 'bpmn',
  processes: [ { id: 'Excluded', name: 'Excluded' } ]
});

const CAMUNDA_PROJECT = createCamundaProject();

function createItem(path, metadata) {
  const segments = path.split('/');

  return {
    file: {
      name: segments.pop(),
      uri: `file:///${ path }`,
      path,
      dirname: segments.join('/'),
      contents: ''
    },
    metadata
  };
}

function createCamundaProject(options = {}) {
  const {
    contents = '{ "deployResources": [ "..." ] }',
    path = `${ PROJECT_PATH }/camunda.json`,
    resources = CAMUNDA_PROJECT_RESOURCES
  } = options;

  const item = createItem(path, {
    type: 'camundaProject',
    resources
  });

  item.file.contents = contents;

  return item;
}

function createItems(options) {
  return [
    options ? createCamundaProject(options) : CAMUNDA_PROJECT,
    PROCESS,
    FORM,
    EXCLUDED
  ];
}

function paths(items) {
  return items.map(item => item.file ? item.file.path : item.path);
}

/**
 * Apply registered resources providers, as `Deployment#deploy` does.
 */
function collectResourceConfigs(deployment, resourceConfigs = []) {
  return deployment._resourcesProviders.reduce((configs, provider) => provider(configs), resourceConfigs);
}

function createCamundaProjectsPlugin({ deployment }) {
  const backendSubscribers = {};

  const backend = {
    on(event, callback) {
      backendSubscribers[ event ] = callback;

      return { cancel() {} };
    },
    send() {}
  };

  const _getGlobal = (name) => {
    if (name === 'backend') {
      return backend;
    } else if (name === 'deployment') {
      return deployment;
    } else if (name === 'zeebeAPI') {
      return new ZeebeAPI();
    } else if (name === 'startInstance') {
      return {};
    }
  };

  const subscribers = {};

  const subscribe = (event, callback) => {
    subscribers[ event ] = subscribers[ event ] || [];
    subscribers[ event ].push(callback);

    return {
      cancel() {
        subscribers[ event ] = subscribers[ event ].filter(cb => cb !== callback);
      }
    };
  };

  const emit = (event, payload) => {
    (subscribers[ event ] || []).forEach(cb => cb(payload));
  };

  const emitBackend = (event, payload) => {
    backendSubscribers[ event ](null, payload);
  };

  const _getFromApp = (prop) => {
    if (prop === 'props') {
      return { tabsProvider: { getProviderForFile() {} } };
    }
  };

  const result = render(<SlotFillRoot>
    <Slot name="status-bar__file" />
    <CamundaProjectsPlugin
      _getFromApp={ _getFromApp }
      _getGlobal={ _getGlobal }
      displayNotification={ () => {} }
      emit={ () => {} }
      log={ () => {} }
      subscribe={ subscribe }
      triggerAction={ () => {} } />
  </SlotFillRoot>);

  const reset = () => {
    act(() => emit('app.activeTabChanged', { activeTab: { type: 'cloud-bpmn', file: null } }));
    act(() => emitBackend('file-context:changed', []));

    result.unmount();
  };

  return {
    ...result,
    emit,
    emitBackend,
    reset
  };
}
