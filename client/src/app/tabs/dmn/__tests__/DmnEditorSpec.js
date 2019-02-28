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
  DmnEditor
} from '../DmnEditor';

import DmnModeler from 'test/mocks/dmn-js/Modeler';

import {
  getCanvasEntries,
  getCopyCutPasteEntries,
  getSelectionEntries,
  getToolEntries,
  getUndoRedoEntries
} from '../../getEditMenu';

import diagramXML from './diagram.dmn';

const { spy } = sinon;


describe('<DmnEditor>', function() {

  it('should render', async function() {
    const {
      instance
    } = await renderEditor(diagramXML);

    expect(instance).to.exist;
  });


  describe('caching behavior', function() {

    let createSpy;

    beforeEach(function() {
      createSpy = sinon.spy(DmnEditor, 'createCachedState');
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
          modeler: new DmnModeler()
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
    const {
      instance
    } = await renderEditor(diagramXML);

    const xml = await instance.getXML();

    expect(xml).to.exist;
    expect(xml).to.eql(diagramXML);
  });


  describe('#exportAs', function() {

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
        const modeler = new DmnModeler();

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


    it('saveXML.done', expectHandleChanged('saveXML.done'));


    it('attach', expectHandleChanged('attach'));


    it('view.selectionChanged', expectHandleChanged('view.selectionChanged'));


    it('view.directEditingChanged', expectHandleChanged('view.directEditingChanged'));


    it('propertiesPanel.focusin', expectHandleChanged('propertiesPanel.focusin'));


    it('propertiesPanel.focusout', expectHandleChanged('propertiesPanel.focusout'));

  });


  describe('#handleChanged', function() {

    it('should notify about changes', async function() {

      // given
      const changedSpy = (state) => {

        // then
        expect(state).to.include({
          dirty: true,
          editLabel: false,
          inputActive: false,
          redo: true,
          removeSelected: false,
          undo: true
        });
      };

      const cache = new Cache();

      cache.add('editor', {
        cached: {
          lastXML: diagramXML,
          modeler: new DmnModeler({
            commandStack: {
              canRedo: () => true,
              canUndo: () => true,
              _stackIdx: 1
            },
            selection: {
              get: () => []
            }
          }),
          stackIdx: {
            drd: 2
          }
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

      expect(state).to.have.property('dmn');
      expect(state).to.have.property('editable');
      expect(state).to.have.property('elementsSelected');
      expect(state).to.have.property('activeEditor');
      expect(state).to.have.property('inactiveInput');
    });


    it('should notify about plugin related changes in decisionTable view', async function() {
      // given
      const changedSpy = sinon.spy();

      const { instance } = await renderEditor(diagramXML, {
        id: 'editor',
        onChanged: changedSpy
      });

      const decisionTable = {
        element: { id: 'foo' },
        type: 'decisionTable'
      };

      instance.getModeler().open(decisionTable);

      changedSpy.resetHistory();

      // when
      instance.handleChanged();

      // then
      expect(changedSpy).to.be.calledOnce;

      const state = changedSpy.firstCall.args[0];

      expect(state).to.have.property('dmnRuleEditing');
      expect(state).to.have.property('dmnClauseEditing');

    });


    describe('edit menu', function() {

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


      it('should provide selection entries', async function() {

        // given
        const changedSpy = (state) => {

          const editMenuEntries = getSelectionEntries(state);

          // then
          expect(state.editMenu).to.deep.include(editMenuEntries);

        };

        const { instance } = await renderEditor(diagramXML, {
          onChanged: changedSpy
        });

        // when
        instance.handleChanged();
      });


      describe('drd', function() {

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


        it('should provide canvas entries', async function() {

          // given
          const changedSpy = (state) => {

            const editMenuEntries = getCanvasEntries(state);

            // then
            expect(state.editMenu).to.deep.include(editMenuEntries);

          };

          const { instance } = await renderEditor(diagramXML, {
            onChanged: changedSpy
          });

          // when
          instance.handleChanged();
        });
      });


      describe('decision table', function() {

        const includesEntryDeeply = (editMenu, label) => {
          return editMenu.filter(entries => {
            return entries.some(e => e.label === label);
          }).length > 0;
        };

        it('should provide rule entries', async function() {

          // given
          const changedSpy = sinon.spy();

          const { instance } = await renderEditor(diagramXML, {
            onChanged: changedSpy
          });

          changedSpy.resetHistory();

          // when
          const modeler = instance.getModeler();
          modeler.open({ type: 'decisionTable' });

          instance.handleChanged();

          // then
          expect(changedSpy).to.be.calledOnce;

          const state = changedSpy.firstCall.args[0];
          expect(includesEntryDeeply(state.editMenu, 'Add Rule')).to.be.true;
          expect(includesEntryDeeply(state.editMenu, 'Remove Clause')).to.be.true;

        });


        it('should provide clause entries', async function() {

          // given
          const changedSpy = sinon.spy();

          const { instance } = await renderEditor(diagramXML, {
            onChanged: changedSpy
          });

          changedSpy.resetHistory();

          // when
          const modeler = instance.getModeler();
          modeler.open({ type: 'decisionTable' });

          instance.handleChanged();

          // then
          expect(changedSpy).to.be.calledOnce;

          const state = changedSpy.firstCall.args[0];

          expect(includesEntryDeeply(state.editMenu, 'Add Clause')).to.be.true;
          expect(includesEntryDeeply(state.editMenu, 'Remove Clause')).to.be.true;

        });


        it('should provide select cell entries', async function() {

          // given
          const changedSpy = sinon.spy();

          const { instance } = await renderEditor(diagramXML, {
            onChanged: changedSpy
          });

          changedSpy.resetHistory();

          // when
          const modeler = instance.getModeler();

          modeler.open({ type: 'decisionTable' });
          instance.handleChanged();

          // then
          expect(changedSpy).to.be.calledOnce;

          const state = changedSpy.firstCall.args[0];

          expect(includesEntryDeeply(state.editMenu, 'Select Cell Above')).to.be.true;
          expect(includesEntryDeeply(state.editMenu, 'Select Cell Below')).to.be.true;
        });

      });

    });

  });


  describe('#viewsChanged', function() {

    let instance;

    const view1 = {
      element: { id: 'foo' },
      type: 'drd'
    };

    const view2 = {
      element: { id: 'bar' },
      type: 'decisionTable'
    };

    const views = [view1, view2];

    beforeEach(async function() {
      instance = (await renderEditor(diagramXML)).instance;
    });

    it('should save dirty state', async function() {

      // given
      const dirtySpy = spy(instance, 'isDirty');

      const modeler = await instance.getModeler();

      const commandStack = modeler.getActiveViewer().get('commandStack');

      const oldDirty = instance.getCached().dirty;

      commandStack.execute(2);

      // when
      instance.viewsChanged({
        activeView: view1,
        views
      });

      const {
        dirty
      } = instance.getCached();

      // then
      expect(dirtySpy).to.have.been.called;
      expect(dirty).to.be.true;
      expect(dirty).to.not.equal(oldDirty);
    });


    it('should reattach properties panel on view switch', async function() {

      // given
      const modeler = await instance.getModeler();

      const propertiesPanel = modeler.getActiveViewer().get('propertiesPanel');

      const propertiesAttachSpy = sinon.spy(propertiesPanel, 'attachTo');

      // when
      instance.viewsChanged({
        activeView: view1,
        views
      });

      // then
      expect(propertiesAttachSpy).to.be.called;
    });

    it('should NOT reattach properties panel when stay on view', async function() {

      // given
      const modeler = await instance.getModeler();

      instance.viewsChanged({
        activeView: view1,
        views
      });

      const propertiesPanel = modeler.getActiveViewer().get('propertiesPanel');

      const propertiesAttachSpy = sinon.spy(propertiesPanel, 'attachTo');

      // when
      instance.viewsChanged({
        activeView: view1,
        views
      });

      // then
      expect(propertiesAttachSpy).not.to.be.called;
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
      let layout = { };

      // then
      await renderEditor(diagramXML, {
        layout
      });

    });

  });


  describe('errors', function() {

    it('should handle XML export error', async function() {
      // given
      const errorSpy = spy();

      const {
        instance
      } = await renderEditor('export-error', {
        onError: errorSpy
      });

      // make sure editor is dirty
      const commandStack = instance.getModeler().getActiveViewer().get('commandStack');

      commandStack.execute(1);

      let err;

      // when
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

      const {
        instance
      } = await renderEditor('export-as-error', {
        onError: errorSpy
      });

      let err;

      // when
      try {
        await instance.exportAs('svg');
      } catch (e) {
        err = e;
      }

      // then
      expect(err).to.exist;
      expect(errorSpy).to.have.been.calledOnce;
    });

  });


  describe('import', function() {

    it('should import without errors and warnings', function(done) {

      // when
      renderEditor(diagramXML, {
        onImport
      });

      // then
      function onImport(error, warnings) {
        try {
          expect(error).to.not.exist;
          expect(warnings).to.have.length(0);

          done();
        } catch (error) {
          done(error);
        }
      }
    });


    it('should import with warnings', function(done) {
      // given
      const warningInducingFakeXML = 'import-warnings';

      // when
      renderEditor(warningInducingFakeXML, {
        onImport
      });

      // then
      function onImport(error, warnings) {
        try {
          expect(error).to.not.exist;
          expect(warnings).to.have.length(1);

          done();
        } catch (error) {
          done(error);
        }
      }
    });


    it('should import with error', function(done) {
      // given
      const errorInducingFakeXML = 'import-error';

      // when
      renderEditor(errorInducingFakeXML, {
        onImport
      });

      // then
      function onImport(error, warnings) {
        try {
          expect(error).to.exist;
          expect(warnings).to.have.length(0);

          done();
        } catch (error) {
          done(error);
        }
      }
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
      modeler.getActiveViewer().get('commandStack').execute(1);

      // then
      const dirty = instance.isDirty();

      expect(dirty).to.be.true;
    });


    it('should NOT be dirty after modeling -> undo', function() {

      // given
      const { modeler } = instance.getCached();

      modeler.getActiveViewer().get('commandStack').execute(1);

      // when
      modeler.getActiveViewer().get('commandStack').undo();

      // then
      const dirty = instance.isDirty();

      expect(dirty).to.be.false;
    });


    it('should NOT be dirty after save', async function() {

      // given
      const { modeler } = instance.getCached();

      // execute 1 command
      modeler.getActiveViewer().get('commandStack').execute(1);

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
          modeler: new DmnModeler({
            editorActions: editorActionsStub
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

const TestEditor = WithCachedState(DmnEditor);

async function renderEditor(xml, options = {}) {
  const {
    layout,
    onChanged,
    onError,
    onImport,
    onLayoutChanged,
    onModal,
    onSheetsChanged
  } = options;

  const wrapper = await mount(
    <TestEditor
      id={ options.id || 'editor' }
      xml={ xml }
      activeSheet={ options.activeSheet || { id: 'dmn' } }
      onChanged={ onChanged || noop }
      onError={ onError || noop }
      onImport={ onImport || noop }
      onLayoutChanged={ onLayoutChanged || noop }
      onModal={ onModal || noop }
      onSheetsChanged={ onSheetsChanged || noop }
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

  const instance = wrapper.find(DmnEditor).instance();

  return {
    instance,
    wrapper
  };
}