/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* global sinon */

import React from 'react';

import { mount } from 'enzyme';

import {
  Cache,
  WithCachedState
} from '../../../cached';

import {
  BpmnEditor
} from '../BpmnEditor';

import BpmnModeler from 'test/mocks/bpmn-js/Modeler';

import diagramXML from './diagram.bpmn';
import activitiXML from './activiti.bpmn';

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

      const moddleExtension = {
        name: 'bar',
        uri: 'http://bar',
        prefix: 'bar',
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
          case 'bpmn.modeler.moddleExtension':
            return [ moddleExtension ];
          }
        }
      });

      // then
      const { modeler } = instance.getCached();

      expect(modeler.options.additionalModules).to.include(additionalModule);

      expect(modeler.options.moddleExtensions).to.include({
        bar: moddleExtension
      });
    });


    it('should properly handle invalid moddle extensions', async function() {

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
        },
        onError: onErrorSpy
      };

      // then
      expect(() => BpmnEditor.createCachedState(props)).to.not.throw();
      expect(onErrorSpy).to.be.calledTwice;
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
    const { instance } = await renderEditor(diagramXML, {
      onImport
    });

    async function onImport() {

      // when
      const xml = await instance.getXML();

      // then
      expect(xml).to.exist;
      expect(xml).to.eql(diagramXML);
    }
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

  });


  describe('#handleChanged', function() {

    it('should notify about changes', async function() {

      // given
      const changedSpy = (state) => {

        // then
        expect(state).to.include({
          align: false,
          copy: false,
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
      };

      const cache = new Cache();

      cache.add('editor', {
        cached: {
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
        onChanged: changedSpy
      });

      // when
      instance.handleChanged();
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

      it('should provide und/redo entries', async function() {

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

    it('should replace namespace', function(done) {

      // given
      const onAction = action => {

        if (action === 'show-dialog') {
          return 'yes';
        }
      };

      const updatedSpy = contents => {

        // then
        expect(contents).to.exist;

        expect(contents.includes('xmlns:activiti="http://activiti.org/bpmn"')).to.be.false;
        expect(contents.includes('xmlns:camunda="http://camunda.org/schema/1.0/bpmn"')).to.be.true;

        expect(contents.includes('targetNamespace="http://activiti.org/bpmn"')).to.be.false;
        expect(contents.includes('targetNamespace="http://camunda.org/schema/1.0/bpmn"')).to.be.true;

        expect(contents.includes('activiti:assignee')).to.be.false;
        expect(contents.includes('camunda:assignee')).to.be.true;

        done();
      };

      // when
      renderEditor(activitiXML, {
        onAction,
        onContentUpdated: updatedSpy
      });
    });


    it('should NOT replace namespace', async function() {

      // given
      const onAction = action => {

        if (action === 'show-dialog') {
          return 'cancel';
        }
      };

      const updatedSpy = spy();

      // when
      await renderEditor(activitiXML, {
        onAction,
        onContentUpdated: updatedSpy
      });

      expect(updatedSpy).to.not.have.been.called;
    });

  });


  describe('layout', function() {

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

      const toggle = wrapper.find('.toggle');

      // when
      toggle.simulate('click');

      // then
      expect(layout.propertiesPanel.open).to.be.true;
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
        onError: errorSpy,
        onImport
      });

      // make sure editor is dirty
      const commandStack = instance.getModeler().get('commandStack');

      commandStack.execute(1);

      async function onImport() {

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
      }
    });


    it('should handle image export error', async function() {

      // given
      const errorSpy = spy();

      const { instance } = await renderEditor('export-as-error', {
        onError: errorSpy,
        onImport
      });

      async function onImport() {

        // when
        let err;

        try {
          await instance.exportAs('svg');
        } catch (e) {
          err = e;
        }

        // then
        expect(err).to.exist;
        expect(errorSpy).to.have.been.calledOnce;
      }
    });

  });


  describe('import', function() {

    it('should import without errors and warnings', async function() {

      // given
      const { instance } = await renderEditor(diagramXML, {
        onImport
      });

      function onImport(err, warnings) {

        // then
        const {
          lastXML
        } = instance.getCached();

        expect(lastXML).to.equal(diagramXML);

        expect(err).to.not.exist;

        expect(warnings).to.have.length(0);
      }
    });


    it('should import with warnings', async function() {

      // given
      const { instance } = await renderEditor('import-warnings', {
        onImport
      });

      function onImport(error, warnings) {

        // then
        const {
          lastXML
        } = instance.getCached();

        expect(lastXML).to.equal('import-warnings');

        expect(error).not.to.exist;

        expect(warnings).to.have.length(1);
        expect(warnings[0]).to.equal('warning');
      }
    });


    it('should import with error', async function() {

      // given
      const { instance } = await renderEditor('import-error', {
        onImport
      });

      function onImport(error, warnings) {

        // then
        const {
          lastXML
        } = instance.getCached();

        expect(lastXML).not.to.exist;

        expect(error).to.exist;
        expect(error.message).to.equal('error');

        expect(warnings).to.have.length(0);
      }
    });

  });


  describe('element templates', function() {

    it('should load templates when mounted', async function() {

      // given
      const onLoadConfigSpy = sinon.spy(),
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
        onLoadConfig: onLoadConfigSpy
      });

      // expect
      expect(onLoadConfigSpy).to.be.called;
      expect(onLoadConfigSpy).to.be.calledWith('bpmn.elementTemplates');
    });


    it('should not reload templates if it once succeeded', async function() {

      // given
      const onLoadConfigSpy = sinon.spy(),
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
        onLoadConfig: onLoadConfigSpy
      });

      instance.componentWillUnmount();
      await instance.componentDidMount();

      // expect
      expect(onLoadConfigSpy).to.be.calledOnce;
      expect(onLoadConfigSpy).to.be.calledWith('bpmn.elementTemplates');
      expect(elementTemplatesLoaderStub.setTemplates).to.be.calledOnce;
    });


    it('should retry loading templates on mount if they could not be loaded', async function() {

      // given
      const onLoadConfigStub = sinon.stub(),
            elementTemplatesLoaderStub = sinon.stub({ setTemplates() {} });

      onLoadConfigStub.onFirstCall()
        .rejects()
        .onSecondCall()
        .resolves();

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
        onLoadConfig: onLoadConfigStub
      });

      instance.componentWillUnmount();
      await instance.componentDidMount();

      // expect
      expect(onLoadConfigStub).to.be.calledTwice;
      expect(onLoadConfigStub).to.be.calledWith('bpmn.elementTemplates');
      expect(elementTemplatesLoaderStub.setTemplates).to.be.calledOnce;
    });


    it('should retry loading templates on mount if they could not be set', async function() {

      // given
      const onLoadConfigSpy = sinon.spy(),
            elementTemplatesLoaderStub = sinon.stub({ setTemplates() {} });

      elementTemplatesLoaderStub.setTemplates.onFirstCall()
        .throwsException()
        .onSecondCall()
        .returns();

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
        onLoadConfig: onLoadConfigSpy
      });

      instance.componentWillUnmount();
      await instance.componentDidMount();

      // expect
      expect(onLoadConfigSpy).to.be.calledTwice;
      expect(onLoadConfigSpy).to.be.calledWith('bpmn.elementTemplates');
      expect(elementTemplatesLoaderStub.setTemplates).to.be.calledTwice;
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
          width: 250
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

});


// helpers //////////

function noop() {}

const TestEditor = WithCachedState(BpmnEditor);

async function renderEditor(xml, options = {}) {
  const {
    id,
    layout,
    onAction,
    onChanged,
    onContentUpdated,
    onError,
    onImport,
    onLayoutChanged,
    onModal,
    onLoadConfig,
    getPlugins
  } = options;

  const wrapper = await mount(
    <TestEditor
      id={ id || 'editor' }
      xml={ xml }
      activeSheet={ options.activeSheet || { id: 'bpmn' } }
      onAction={ onAction || noop }
      onChanged={ onChanged || noop }
      onError={ onError || noop }
      onImport={ onImport || noop }
      onLayoutChanged={ onLayoutChanged || noop }
      onContentUpdated={ onContentUpdated || noop }
      onModal={ onModal || noop }
      onLoadConfig={ onLoadConfig || noop }
      getPlugins={ getPlugins || (() => []) }
      cache={ options.cache || new Cache() }
      layout={ layout || {
        minimap: {
          open: false
        },
        propertiesPanel: {
          open: true
        }
      } }
    />
  );

  const instance = wrapper.find(BpmnEditor).instance();

  return {
    instance,
    wrapper
  };
}