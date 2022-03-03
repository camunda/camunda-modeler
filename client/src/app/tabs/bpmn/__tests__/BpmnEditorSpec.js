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

import { mount } from 'enzyme';

import {
  find
} from 'min-dash';

import {
  Cache,
  WithCachedState
} from '../../../cached';

import {
  BpmnEditor,
  DEFAULT_ENGINE_PROFILE
} from '../BpmnEditor';

import BpmnModeler from 'test/mocks/bpmn-js/Modeler';

import diagramXML from './diagram.bpmn';
import activitiXML from './activiti.bpmn';
import activitiConvertedXML from './activitiConverted.bpmn';

import engineProfileXML from '../../__tests__/EngineProfile.platform.bpmn';
import noEngineProfileXML from '../../__tests__/EngineProfile.vanilla.bpmn';
import unknownEngineProfileXML from '../../__tests__/EngineProfile.unknown.bpmn';
import missingPatchEngineProfileXML from '../../__tests__/EngineProfile.missing-patch.platform.bpmn';
import patchEngineProfileXML from '../../__tests__/EngineProfile.patch.platform.bpmn';
import namespaceEngineProfileXML from '../../__tests__/EngineProfile.namespace.platform.bpmn';

import applyDefaultTemplates from '../../bpmn-shared/modeler/features/apply-default-templates/applyDefaultTemplates';

import {
  getCanvasEntries,
  getCopyCutPasteEntries,
  getDiagramFindEntries,
  getSelectionEntries,
  getToolEntries,
  getUndoRedoEntries
} from '../../getEditMenu';

const { spy } = sinon;


describe('<BpmnEditor>', function() {

  it('should render', async function() {
    const {
      instance
    } = await renderEditor(diagramXML);

    expect(instance).to.exist;
  });


  describe('caching behavior', function() {

    let createSpy;

    beforeEach(function() {
      createSpy = sinon.spy(BpmnEditor, 'createCachedState');
    });

    afterEach(function() {
      createSpy.restore();
    });


    it('should create modeler if not cached', async function() {

      // when
      const {
        instance
      } = await renderEditor(diagramXML);

      // then
      const {
        modeler
      } = instance.getCached();

      expect(modeler).to.exist;
      expect(createSpy).to.have.been.calledOnce;
    });


    it('should use cached modeler', async function() {

      // given
      const cache = new Cache();

      cache.add('editor', {
        cached: {
          modeler: new BpmnModeler()
        },
        __destroy: () => {}
      });

      // when
      await renderEditor(diagramXML, {
        id: 'editor',
        cache
      });

      // then
      expect(createSpy).not.to.have.been.called;
    });

  });


  describe('plugins', function() {

    it('should accept plugins', async function() {

      // given
      const additionalModule = {
        __init__: [ 'foo' ],
        foo: [ 'type', noop ]
      };

      const additionalModulePlatform = {
        __init__: [ 'platfoo' ],
        platfoo: [ 'type', noop ]
      };

      const additionalModuleCloud = {
        __init__: [ 'cloudfoo' ],
        cloudfoo: [ 'type', noop ]
      };

      const moddleExtension = {
        name: 'bar',
        uri: 'http://bar',
        prefix: 'bar',
        xml: {
          tagAlias: 'lowerCase'
        },
        types: []
      };

      const moddleExtensionPlatform = {
        name: 'platbar',
        uri: 'http://platbar',
        prefix: 'platbar',
        xml: {
          tagAlias: 'lowerCase'
        },
        types: []
      };

      const moddleExtensionCloud = {
        name: 'cloudbar',
        uri: 'http://cloudbar',
        prefix: 'cloudbar',
        xml: {
          tagAlias: 'lowerCase'
        },
        types: []
      };

      // when
      const {
        instance
      } = await renderEditor(diagramXML, {
        getPlugins(type) {
          switch (type) {
          case 'bpmn.modeler.additionalModules':
            return [ additionalModule ];
          case 'bpmn.platform.modeler.additionalModules':
            return [ additionalModulePlatform ];
          case 'bpmn.cloud.modeler.additionalModules':
            return [ additionalModuleCloud ];
          case 'bpmn.modeler.moddleExtension':
            return [ moddleExtension ];
          case 'bpmn.platform.modeler.moddleExtension':
            return [ moddleExtensionPlatform ];
          case 'bpmn.cloud.modeler.moddleExtension':
            return [ moddleExtensionCloud ];
          }

          return [];
        }
      });

      // then
      const { modeler } = instance.getCached();

      expect(modeler.options.additionalModules).to.include(additionalModule);
      expect(modeler.options.additionalModules).to.include(additionalModulePlatform);
      expect(modeler.options.additionalModules).to.not.include(additionalModuleCloud);

      expect(modeler.options.moddleExtensions).to.include({
        bar: moddleExtension,
        platbar: moddleExtensionPlatform,
      });

      expect(modeler.options.moddleExtensions).to.not.have.property('cloudbar');

    });


    it('should handle invalid moddle extensions', async function() {

      // given
      const onErrorSpy = sinon.spy();

      const unnamedModdleExtension = {};

      const circularModdleExtension = {};
      circularModdleExtension.name = circularModdleExtension;

      const props = {
        getPlugins(type) {
          switch (type) {
          case 'bpmn.modeler.moddleExtension':
            return [
              unnamedModdleExtension,
              circularModdleExtension
            ];
          }

          return [];
        },
        onError: onErrorSpy,
        onAction: noop
      };

      // then
      expect(() => BpmnEditor.createCachedState(props)).to.not.throw();
      expect(onErrorSpy).to.be.calledOnce;
    });

  });


  it('#getModeler', async function() {

    // given
    const { instance } = await renderEditor(diagramXML);

    // when
    const modeler = instance.getModeler();

    // then
    expect(modeler).to.exist;
  });


  it('#getXML', async function() {

    // given
    const { instance } = await renderEditor(diagramXML);

    // when
    const xml = await instance.getXML();

    // then
    expect(xml).to.exist;
    expect(xml).to.eql(diagramXML);
  });


  describe('#exportAs', function() {

    // increase test time-outs, as exporting takes a
    // long certain underpowered CI systems (AppVeyor, wink, wink)
    this.timeout(5000);

    let instance;

    beforeEach(async function() {
      instance = (await renderEditor(diagramXML)).instance;
    });


    it('svg', async function() {
      const contents = await instance.exportAs('svg');

      expect(contents).to.exist;
      expect(contents).to.equal('<svg />');
    });


    it('png', async function() {
      const contents = await instance.exportAs('png');

      expect(contents).to.exist;
      expect(contents).to.contain('data:image/png');
    });


    it('jpeg', async function() {
      const contents = await instance.exportAs('jpeg');

      expect(contents).to.exist;
      expect(contents).to.contain('data:image/jpeg');
    });

  });


  describe('#listen', function() {

    function expectHandleChanged(event) {
      return async function() {
        const modeler = new BpmnModeler();

        const cache = new Cache();

        cache.add('editor', {
          cached: {
            modeler
          },
          __destroy: () => {}
        });

        const changedSpy = spy();

        await renderEditor(diagramXML, {
          id: 'editor',
          cache,
          onChanged: changedSpy
        });

        modeler._emit(event);

        expect(changedSpy).to.have.been.called;
      };
    }


    it('import.done', expectHandleChanged('import.done'));


    it('saveXML.done', expectHandleChanged('saveXML.done'));


    it('commandStack.changed', expectHandleChanged('commandStack.changed'));


    it('selection.changed', expectHandleChanged('selection.changed'));


    it('attach', expectHandleChanged('attach'));


    it('elements.copied', expectHandleChanged('elements.copied'));


    it('propertiesPanel.focusin', expectHandleChanged('propertiesPanel.focusin'));


    it('propertiesPanel.focusout', expectHandleChanged('propertiesPanel.focusout'));


    it('directEditing.activate', expectHandleChanged('directEditing.activate'));


    it('directEditing.deactivate', expectHandleChanged('directEditing.deactivate'));


    it('searchPad.opened', expectHandleChanged('searchPad.opened'));


    it('searchPad.closed', expectHandleChanged('searchPad.closed'));
  });


  describe('linting', function() {

    let modeler, actionSpy, container;

    beforeEach(async function() {
      modeler = new BpmnModeler();
      actionSpy = spy();

      const cache = new Cache();

      cache.add('editor', {
        cached: {
          modeler
        },
        __destroy: () => {}
      });


      const { wrapper } = await renderEditor(diagramXML, {
        id: 'editor',
        cache,
        onAction: actionSpy
      });

      container = wrapper;
    });


    it('should call linting on change', async function() {

      // assume
      // lint on import
      expect(actionSpy).to.have.been.calledOnce;

      // when
      modeler._emit('commandStack.changed');

      // then
      expect(actionSpy).to.have.been.calledTwice;
    });


    it('should only register once', async function() {

      // assume
      // lint on import
      expect(actionSpy).to.have.been.calledOnce;

      // when
      container.unmount();
      container.mount();

      modeler._emit('commandStack.changed');

      // then
      expect(actionSpy).to.have.been.calledTwice;
    });

  });


  describe('#handleChanged', function() {

    it('should notify about changes', async function() {

      // given
      const onChangedSpy = spy((state) => {

        // then
        expect(state).to.include({
          align: false,
          copy: false,
          defaultCopyCutPaste: false,
          defaultUndoRedo: false,
          dirty: true,
          distribute: false,
          editLabel: false,
          find: true,
          globalConnectTool: true,
          handTool: true,
          inputActive: false,
          lassoTool: true,
          moveCanvas: true,
          moveToOrigin: true,
          paste: false,
          redo: true,
          removeSelected: false,
          setColor: false,
          spaceTool: true,
          undo: true
        });
      });

      const cache = new Cache();

      cache.add('editor', {
        cached: {
          engineProfile: DEFAULT_ENGINE_PROFILE,
          lastXML: diagramXML,
          modeler: new BpmnModeler({
            modules: {
              clipboard: {
                isEmpty: () => true
              },
              commandStack: {
                canRedo: () => true,
                canUndo: () => true,
                _stackIdx: 1
              },
              selection: {
                get: () => []
              }
            }
          }),
          stackIdx: 2
        },
        __destroy: () => {}
      });

      const { instance } = await renderEditor(diagramXML, {
        id: 'editor',
        cache,
        onChanged: onChangedSpy,
        waitForImport: false
      });

      // when
      instance.handleChanged();

      // then
      expect(onChangedSpy).to.have.been.calledOnce;
    });


    it('should notify about plugin related changes', async function() {

      // given
      const changedSpy = sinon.spy();

      const { instance } = await renderEditor(diagramXML, {
        id: 'editor',
        onChanged: changedSpy
      });

      changedSpy.resetHistory();

      // when
      instance.handleChanged();

      // then
      expect(changedSpy).to.be.calledOnce;

      const state = changedSpy.firstCall.args[0];

      expect(state).to.have.property('bpmn');
      expect(state).to.have.property('editable');
      expect(state).to.have.property('elementsSelected');
      expect(state).to.have.property('inactiveInput');
    });


    describe('edit menu', function() {

      const includesEntryDeeply = (editMenu, label) => {
        return editMenu.filter(entries => {
          return entries.some(e => e.label === label);
        }).length > 0;
      };

      it('should provide undo/redo entries', async function() {

        // given
        const changedSpy = (state) => {

          const editMenuEntries = getUndoRedoEntries(state);

          // then
          expect(state.editMenu).to.deep.include(editMenuEntries);

        };

        const { instance } = await renderEditor(diagramXML, {
          onChanged: changedSpy
        });

        // when
        instance.handleChanged();
      });


      it('should provide copy/paste entries', async function() {

        // given
        const changedSpy = (state) => {

          const editMenuEntries = getCopyCutPasteEntries(state);

          // then
          expect(state.editMenu).to.deep.include(editMenuEntries);

        };

        const { instance } = await renderEditor(diagramXML, {
          onChanged: changedSpy
        });

        // when
        instance.handleChanged();
      });


      it('should provide tool entries', async function() {

        // given
        const changedSpy = (state) => {

          const editMenuEntries = getToolEntries(state);

          // then
          expect(state.editMenu).to.deep.include(editMenuEntries);

        };

        const { instance } = await renderEditor(diagramXML, {
          onChanged: changedSpy
        });

        // when
        instance.handleChanged();
      });


      it('should provide find entries', async function() {

        // given
        const changedSpy = (state) => {

          const editMenuEntries = getDiagramFindEntries(state);

          // then
          expect(state.editMenu).to.deep.include(editMenuEntries);

        };

        const { instance } = await renderEditor(diagramXML, {
          onChanged: changedSpy
        });

        // when
        instance.handleChanged();
      });


      it('should provide selection + canvas entries', async function() {

        // given
        const changedSpy = (state) => {

          const editMenuEntries = [
            ...getCanvasEntries(state),
            ...getSelectionEntries(state)
          ];

          // then
          expect(state.editMenu).to.deep.include(editMenuEntries);

        };

        const { instance } = await renderEditor(diagramXML, {
          onChanged: changedSpy
        });

        // when
        instance.handleChanged();
      });


      it('should provide align/distribute entries', async function() {

        // given
        const changedSpy = (state) => {

          // then
          expect(includesEntryDeeply(state.editMenu, 'Align Elements')).to.be.true;
          expect(includesEntryDeeply(state.editMenu, 'Distribute Elements')).to.be.true;
        };

        const { instance } = await renderEditor(diagramXML, {
          onChanged: changedSpy
        });

        // when
        instance.handleChanged();
      });

    });

  });


  describe('#handleNamespace', function() {

    it('should replace namespace', async function() {

      // given
      const onContentUpdated = sinon.spy();
      const onAction = sinon.stub().resolves({
        button: 'yes'
      });

      // when
      await renderEditor(activitiXML, {
        onAction,
        onContentUpdated
      });

      // then
      expect(onContentUpdated).to.be.calledOnce;
      expect(onContentUpdated).to.be.calledWith(activitiConvertedXML);
    });


    it('should not convert the diagram if declined', async function() {

      // given
      const onContentUpdated = sinon.spy();
      const onAction = sinon.stub().resolves('cancel');

      // when
      await renderEditor(activitiXML, {
        onAction,
        onContentUpdated
      });

      // then
      expect(onContentUpdated).to.not.have.been.called;
    });


    it('should not ask for permission if diagram does not have seeked namespace', async function() {

      // given
      const onContentUpdated = sinon.spy();
      const onAction = sinon.spy();

      // when
      await renderEditor(diagramXML, {
        onAction,
        onContentUpdated
      });

      // then
      expect(onContentUpdated).to.not.have.been.called;
      expect(onAction).to.not.have.been.calledWith('show-dialog');
    });


    it('should not fail import for broken diagrams', async function() {

      // given
      const onContentUpdated = sinon.spy();
      const onAction = sinon.stub().resolves('yes');

      // when
      await renderEditor('broken-diagram', {
        onAction,
        onContentUpdated
      });

      // then
      expect(onContentUpdated).to.have.not.been.called;
    });

  });


  describe('#triggerAction', function() {

    it('should return value of editor action', async function() {

      // given
      const editorActions = {
        trigger(action, context) {
          if (action === 'foo') {
            return 'bar';
          }
        }
      };

      const cache = new Cache();

      cache.add('editor', {
        cached: {
          modeler: new BpmnModeler({
            modules: {
              editorActions
            }
          })
        }
      });

      // when
      const { instance } = await renderEditor(diagramXML, { cache });

      // when
      const returnValue = instance.triggerAction('foo');

      // then
      expect(returnValue).to.equal('bar');
    });

  });


  describe('layout', function() {

    it('should open properties panel (no layout)', async function() {

      // given
      let layout = {};

      function onLayoutChanged(newLayout) {
        layout = newLayout;
      }

      const {
        wrapper
      } = await renderEditor(diagramXML, {
        layout,
        onLayoutChanged
      });

      wrapper.update();

      const toggle = wrapper.find('.toggle');

      // when
      toggle.simulate('click');

      // then
      expect(layout.propertiesPanel.open).to.be.true;
      expect(layout.propertiesPanel.width).to.equal(280);
    });


    it('should open properties panel', async function() {

      // given
      let layout = {
        propertiesPanel: {
          open: false
        }
      };

      function onLayoutChanged(newLayout) {
        layout = newLayout;
      }

      const {
        wrapper
      } = await renderEditor(diagramXML, {
        layout,
        onLayoutChanged
      });

      wrapper.update();

      const toggle = wrapper.find('.toggle');

      // when
      toggle.simulate('click');

      // then
      expect(layout.propertiesPanel.open).to.be.true;
      expect(layout.propertiesPanel.width).to.equal(280);
    });


    it('should close properties panel', async function() {

      // given
      let layout = {
        propertiesPanel: {
          open: true
        }
      };

      function onLayoutChanged(newLayout) {
        layout = newLayout;
      }

      const {
        wrapper
      } = await renderEditor(diagramXML, {
        layout,
        onLayoutChanged
      });

      const toggle = wrapper.find('.toggle');

      // when
      toggle.simulate('click');

      // then
      expect(layout.propertiesPanel.open).to.be.false;
    });


    it('should handle missing layout', async function() {

      // given
      const layout = { };

      // then
      await renderEditor(diagramXML, {
        layout
      });

    });

  });


  describe('errors', function() {

    // TODO
    it('should handle template error');


    it('should handle XML export error', async function() {

      // given
      const errorSpy = spy();

      const { instance } = await renderEditor('export-error', {
        onError: errorSpy
      });

      // make sure editor is dirty
      const commandStack = instance.getModeler().get('commandStack');

      commandStack.execute(1);

      // when
      let err;

      try {
        await instance.getXML();
      } catch (e) {
        err = e;
      }

      // then
      expect(err).to.exist;
      expect(errorSpy).to.have.been.calledOnce;
    });


    it('should handle image export error', async function() {

      // given
      const errorSpy = spy();

      const { instance } = await renderEditor('export-as-error', {
        onError: errorSpy
      });

      // when
      let err;

      try {
        await instance.exportAs('svg');
      } catch (e) {
        err = e;
      }

      // then
      expect(err).to.exist;
      expect(err.message).to.equal('failed to save svg');
      expect(errorSpy).to.have.been.calledOnce;
    });

  });


  describe('import', function() {

    afterEach(sinon.restore);


    it('should import without errors and warnings', async function() {

      // given
      const onImportSpy = spy((error, warnings) => {

        // then
        expect(error).to.not.exist;
        expect(warnings).to.be.empty;
      });

      // when
      await renderEditor(diagramXML, {
        onImport: onImportSpy
      });

      // then
      expect(onImportSpy).to.have.been.calledOnce;
    });


    it('should import with warnings', async function() {

      // given
      const onImportSpy = spy((error, warnings) => {

        // then
        expect(error).to.not.exist;
        expect(warnings).to.have.length(1);
      });

      // when
      await renderEditor('import-warnings', {
        onImport: onImportSpy
      });

      // then
      expect(onImportSpy).to.have.been.calledOnce;
    });


    it('should import with error', async function() {

      // given
      const onImportSpy = spy((error, warnings) => {

        // then
        expect(error).to.exist;
        expect(warnings).to.have.length(0);
      });

      // when
      await renderEditor('import-error', {
        onImport: onImportSpy
      });

      // then
      expect(onImportSpy).to.have.been.calledOnce;
    });


    it('should not import when provided xml is the same as the cached one', async function() {

      // given
      const isImportNeededSpy = sinon.spy(BpmnEditor.prototype, 'isImportNeeded');

      const cache = new Cache();

      cache.add('editor', {
        cached: {
          lastXML: diagramXML,
          modeler: new BpmnModeler()
        }
      });

      await renderEditor(diagramXML, {
        cache,
        waitForImport: false
      });

      // then
      // BpmnEditor#componentDidMount is async
      process.nextTick(() => {
        expect(isImportNeededSpy).to.have.been.calledOnce;
        expect(isImportNeededSpy).to.have.always.returned(false);
      });
    });


    it('should not import when props did not change', async function() {

      // given
      const {
        instance
      } = await renderEditor(diagramXML);

      const isImportNeededSpy = sinon.spy(instance, 'isImportNeeded');

      // when
      await instance.componentDidUpdate({
        xml: diagramXML
      });

      // then
      expect(isImportNeededSpy).to.be.called;
      expect(isImportNeededSpy).to.have.always.returned(false);

    });


    it('should unset lastXML on import error', async function() {

      // given
      const { instance } = await renderEditor(diagramXML);

      // assume
      expect(instance.getCached().lastXML).to.equal(diagramXML);

      // when
      await instance.importXML('import-error');

      // then
      expect(instance.getCached().lastXML).to.be.null;
    });

  });


  describe('element templates', function() {

    it('should load templates when mounted', async function() {

      // given
      const getConfigSpy = sinon.spy(),
            elementTemplatesLoaderMock = { setTemplates() {} };

      const cache = new Cache();

      cache.add('editor', {
        cached: {
          modeler: new BpmnModeler({
            modules: {
              elementTemplatesLoader: elementTemplatesLoaderMock
            }
          })
        }
      });

      // when
      await renderEditor(diagramXML, {
        cache,
        getConfig: getConfigSpy
      });

      // expect
      expect(getConfigSpy).to.be.called;
      expect(getConfigSpy).to.be.calledWith('bpmn.elementTemplates');
    });


    it('should reload templates on action triggered', async function() {

      // given
      const getConfigSpy = sinon.spy(),
            elementTemplatesLoaderStub = sinon.stub({ setTemplates() {} });

      const cache = new Cache();

      cache.add('editor', {
        cached: {
          modeler: new BpmnModeler({
            modules: {
              elementTemplatesLoader: elementTemplatesLoaderStub
            }
          })
        }
      });

      // when
      const { instance } = await renderEditor(diagramXML, {
        cache,
        getConfig: getConfigSpy
      });

      await instance.triggerAction('elementTemplates.reload');

      // expect
      expect(getConfigSpy).to.be.calledTwice;
      expect(getConfigSpy).to.be.always.calledWith('bpmn.elementTemplates');
      expect(elementTemplatesLoaderStub.setTemplates).to.be.calledTwice;
    });


    it('should only load platform templates', async function() {

      // given
      const platformTemplates = [
        {
          '$schema': 'https://unpkg.com/@camunda/element-templates-json-schema/resources/schema.json',
          'id': 'one'
        },
        {
          'id': 'two'
        },
        {
          '$schema': 'https://unpkg.com/@camunda/element-templates-json-schema0.6.0/resources/schema.json',
          'id': 'three'
        },
        {
          '$schema': 'https://cdn.jsdelivr.net/npm/@camunda/element-templates-json-schema/resources/schema.json',
          'id': 'four'
        }
      ];

      const otherTemplates = [
        {
          '$schema': 'https://unpkg.com/@camunda/zeebe-element-templates-json-schema/resources/schema.json',
          'id': 'five'
        }
      ];

      const allTemplates = [
        ...platformTemplates, ...otherTemplates
      ];

      const getConfig = () => allTemplates;

      const elementTemplatesLoaderStub = sinon.stub({ setTemplates() {} });

      const cache = new Cache();

      cache.add('editor', {
        cached: {
          modeler: new BpmnModeler({
            modules: {
              elementTemplatesLoader: elementTemplatesLoaderStub
            }
          })
        }
      });

      // when
      await renderEditor(diagramXML, {
        cache,
        getConfig
      });

      // expect
      expect(elementTemplatesLoaderStub.setTemplates).not.to.be.calledWith(allTemplates);
      expect(elementTemplatesLoaderStub.setTemplates).to.be.calledWith(platformTemplates);
    });


    it('should apply default templates to unsaved diagram', async function() {

      // given
      const modeler = new BpmnModeler();

      const invokeSpy = sinon.spy(modeler, 'invoke');

      const cache = new Cache();

      cache.add('editor', {
        cached: {
          modeler
        }
      });

      // when
      await renderEditor(diagramXML, {
        cache,
        isNew: true
      });

      // then
      expect(invokeSpy).to.have.been.calledWith(applyDefaultTemplates);
    });


    it('should NOT apply default templates to unsaved diagram twice', async function() {

      // given
      const modeler = new BpmnModeler();

      const invokeSpy = sinon.spy(modeler, 'invoke');

      const cache = new Cache();

      cache.add('editor', {
        cached: {
          modeler,
          defaultTemplatesApplied: true
        }
      });

      // when
      await renderEditor(diagramXML, {
        cache,
        isNew: true
      });

      // then
      expect(invokeSpy).not.to.have.been.called;
    });


    it('should NOT apply default templates to saved diagram', async function() {

      // given
      const modeler = new BpmnModeler();

      const invokeSpy = sinon.spy(modeler, 'invoke');

      const cache = new Cache();

      cache.add('editor', {
        cached: {
          modeler
        }
      });

      // when
      renderEditor(diagramXML, {
        cache,
        isNew: false
      });

      // then
      expect(invokeSpy).not.to.have.been.called;
    });


    it('should handle template errors as warning', async function() {

      // given
      const warningSpy = spy();

      const error1 = new Error('template error 1');
      const error2 = new Error('template error 2');
      const error3 = new Error('template error 3');

      const { instance } = await renderEditor(diagramXML, {
        onWarning: warningSpy
      });

      // when
      await instance.handleElementTemplateErrors({ errors: [ error1, error2, error3 ] });

      // then
      expect(warningSpy).to.have.been.calledThrice;
      expect(warningSpy).to.have.been.calledWith({ message: error1.message });
      expect(warningSpy).to.have.been.calledWith({ message: error2.message });
      expect(warningSpy).to.have.been.calledWith({ message: error3.message });
    });

  });


  describe('dirty state', function() {

    let instance;

    beforeEach(async function() {
      instance = (await renderEditor(diagramXML)).instance;
    });


    it('should NOT be dirty initially', function() {

      // then
      const dirty = instance.isDirty();

      expect(dirty).to.be.false;
    });


    it('should be dirty after modeling', function() {

      // given
      const { modeler } = instance.getCached();

      // when
      // execute 1 command
      modeler.get('commandStack').execute(1);

      // then
      const dirty = instance.isDirty();

      expect(dirty).to.be.true;
    });


    it('should NOT be dirty after modeling -> undo', function() {

      // given
      const { modeler } = instance.getCached();

      modeler.get('commandStack').execute(1);

      // when
      modeler.get('commandStack').undo();

      // then
      const dirty = instance.isDirty();

      expect(dirty).to.be.false;
    });


    it('should NOT be dirty after save', async function() {

      // given
      const { modeler } = instance.getCached();

      // execute 1 command
      modeler.get('commandStack').execute(1);

      // when
      await instance.getXML();

      // then
      const dirty = instance.isDirty();

      expect(dirty).to.be.false;
    });


    it('should be dirty after export error', async function() {

      // given
      const { instance } = await renderEditor('export-error');

      const { modeler } = instance.getCached();

      // execute 1 command
      modeler.get('commandStack').execute(1);

      let err;

      // when
      try {
        await instance.getXML();
      } catch (e) {
        err = e;
      }

      // then
      const dirty = instance.isDirty();

      expect(err).to.exist;
      expect(dirty).to.be.true;
    });

  });


  describe('properties panel actions', function() {

    it('should toggle properties panel', async function() {

      // given
      const onLayoutChangedSpy = sinon.spy();
      const {
        instance
      } = await renderEditor(diagramXML, {
        layout: {
          propertiesPanel: {
            open: false,
          }
        },
        onLayoutChanged: onLayoutChangedSpy
      });

      // when
      instance.triggerAction('toggleProperties');

      // then
      expect(onLayoutChangedSpy).to.be.calledOnceWith({
        propertiesPanel: {
          open: true,
          width: 280
        }
      });
    });


    it('should reset properties panel', async function() {

      // given
      const onLayoutChangedSpy = sinon.spy();
      const {
        instance
      } = await renderEditor(diagramXML, {
        onLayoutChanged: onLayoutChangedSpy
      });

      // when
      instance.triggerAction('resetProperties');

      // then
      expect(onLayoutChangedSpy).to.be.calledOnceWith({
        propertiesPanel: {
          open: true,
          width: 280
        }
      });
    });

  });


  describe('zoom actions', function() {

    let editorActionsStub,
        instance;

    beforeEach(async function() {

      // given
      editorActionsStub = sinon.stub({ trigger() {} });

      const cache = new Cache();

      cache.add('editor', {
        cached: {
          modeler: new BpmnModeler({
            modules: {
              editorActions: editorActionsStub
            }
          })
        }
      });

      instance = (await renderEditor(diagramXML, { cache })).instance;
    });


    afterEach(sinon.restore);


    it('should zoom in', function() {

      // when
      instance.triggerAction('zoomIn');

      // then
      expect(editorActionsStub.trigger).to.be.calledOnceWith('stepZoom', {
        value: 1
      });
    });


    it('should zoom out', function() {

      // when
      instance.triggerAction('zoomOut');

      // then
      expect(editorActionsStub.trigger).to.be.calledOnceWith('stepZoom', {
        value: -1
      });
    });


    it('should zoom to fit diagram', function() {

      // when
      instance.triggerAction('zoomFit');

      // then
      expect(editorActionsStub.trigger).to.be.calledOnceWith('zoom', {
        value: 'fit-viewport'
      });
    });


    it('should reset zoom', async function() {

      // when
      instance.triggerAction('resetZoom');

      // then
      expect(editorActionsStub.trigger).to.be.calledOnceWith('zoom', {
        value: 1
      });
    });

  });


  describe('extensions event emitting', function() {

    let recordActions, emittedEvents;

    beforeEach(function() {
      emittedEvents = [];

      recordActions = (action, options) => {
        emittedEvents.push(options);
      };
    });

    it('should notify when modeler configures', async function() {

      // when
      await renderEditor(diagramXML, {
        onAction: recordActions
      });

      // then
      const modelerConfigureEvent = getEvent(emittedEvents, 'bpmn.modeler.configure');

      const {
        payload
      } = modelerConfigureEvent;

      expect(modelerConfigureEvent).to.exist;
      expect(payload.middlewares).to.exist;
    });


    it('should notify when modeler was created', async function() {

      // when
      const {
        instance
      } = await renderEditor(diagramXML, {
        onAction: recordActions
      });

      // then
      const modeler = instance.getModeler();

      const modelerCreatedEvent = getEvent(emittedEvents, 'bpmn.modeler.created');

      const {
        payload
      } = modelerCreatedEvent;

      expect(modelerCreatedEvent).to.exist;
      expect(payload.modeler).to.eql(modeler);
    });

  });


  describe('engine profile', function() {

    function expectEngineProfile(xml, engineProfile) {
      return async function() {

        // when
        const { instance, wrapper } = await renderEditor(xml);

        wrapper.update();

        // then
        expect(wrapper.find('EngineProfile').exists()).to.be.true;

        expect(instance.getCached().engineProfile).to.eql(engineProfile);
      };
    }


    it('should show engine profile (no engine profile)', expectEngineProfile(noEngineProfileXML, {
      executionPlatform: 'Camunda Platform',
      executionPlatformVersion: undefined
    }));


    it('should show engine profile (with namespace)', expectEngineProfile(namespaceEngineProfileXML, {
      executionPlatform: 'Camunda Platform',
      executionPlatformVersion: undefined
    }));


    it('should show engine profile (Camunda Platform 7.16.0)', expectEngineProfile(engineProfileXML, {
      executionPlatform: 'Camunda Platform',
      executionPlatformVersion: '7.16.0'
    }));


    it('should show engine profile (Camunda Platform 7.16)', expectEngineProfile(missingPatchEngineProfileXML, {
      executionPlatform: 'Camunda Platform',
      executionPlatformVersion: '7.16.0'
    }));


    it('should show engine profile (Camunda Platform 7.16.1)', expectEngineProfile(patchEngineProfileXML, {
      executionPlatform: 'Camunda Platform',
      executionPlatformVersion: '7.16.1'
    }));


    it('should not open form if unknown execution profile', async function() {

      // given
      const onImportSpy = spy();

      // when
      const { instance } = await renderEditor(unknownEngineProfileXML, {
        onImport: onImportSpy
      });

      // then
      expect(onImportSpy).to.have.been.calledOnce;
      expect(onImportSpy).to.have.been.calledWith(sinon.match({ message: 'An unknown execution platform (Camunda Unknown 7.15.0) was detected.' }), []);

      expect(instance.getCached().engineProfile).to.be.null;
    });

  });

});


// helpers //////////

function noop() {}

const TestEditor = WithCachedState(BpmnEditor);

const defaultLayout = {
  minimap: {
    open: false
  },
  propertiesPanel: {
    open: true
  }
};

function renderEditor(xml, options = {}) {
  const {
    cache = new Cache(),
    getConfig = noop,
    getPlugins = () => [],
    id = 'editor',
    isNew = true,
    layout = defaultLayout,
    onAction = noop,
    onChanged = noop,
    onContentUpdated = noop,
    onError = noop,
    onImport = noop,
    onLayoutChanged = noop,
    onModal = noop,
    onWarning = noop,
    waitForImport = true
  } = options;

  return new Promise((resolve) => {
    let instance,
        wrapper;

    const resolveOnImport = (...args) => {
      onImport(...args);

      resolve({
        instance,
        wrapper
      });
    };

    wrapper = mount(
      <TestEditor
        cache={ cache }
        getConfig={ getConfig }
        getPlugins={ getPlugins }
        id={ id }
        isNew={ isNew }
        layout={ layout }
        onAction={ onAction }
        onChanged={ onChanged }
        onContentUpdated={ onContentUpdated }
        onError={ onError }
        onImport={ waitForImport ? resolveOnImport : onImport }
        onLayoutChanged={ onLayoutChanged }
        onModal={ onModal }
        onWarning={ onWarning }
        xml={ xml }
      />
    );

    instance = wrapper.find(BpmnEditor).instance();

    if (!waitForImport) {
      resolve({
        instance,
        wrapper
      });
    }
  });
}

function getEvent(events, eventName) {
  return find(events, e => e.type === eventName);
}
