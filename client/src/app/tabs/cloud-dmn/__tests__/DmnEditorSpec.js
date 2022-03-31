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
  find,
  isArray
} from 'min-dash';

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
  getAlignDistributeEntries,
  getCopyCutPasteEntries,
  getSelectionEntries,
  getToolEntries,
  getUndoRedoEntries
} from '../../getEditMenu';

import diagramXML from './diagram.dmn';

import diagram11XML from './diagram11.dmn';

import engineProfileXML from '../../__tests__/EngineProfile.cloud.dmn';
import noEngineProfileXML from '../../__tests__/EngineProfile.vanilla.dmn';
import unknownEngineProfileXML from '../../__tests__/EngineProfile.unknown.dmn';
import missingPatchEngineProfileXML from '../../__tests__/EngineProfile.missing-patch.cloud.dmn';
import patchEngineProfileXML from '../../__tests__/EngineProfile.patch.cloud.dmn';
import namespaceEngineProfileXML from '../../__tests__/EngineProfile.namespace.dmn';

import {
  DEFAULT_LAYOUT
} from '../../dmn/OverviewContainer';

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


  describe('plugins', function() {

    it('should accept <drd> plugins', async function() {

      // given
      const additionalModule = {
        __init__: [ 'foo' ],
        foo: [ 'type', noop ]
      };

      // when
      const {
        instance
      } = await renderEditor(diagramXML, {
        getPlugins(type) {
          switch (type) {
          case 'dmn.modeler.drd.additionalModules':
            return [ additionalModule ];
          }

          return [];
        }
      });

      // then
      const { modeler } = instance.getCached();

      expect(modeler.modules.drd.additionalModules).to.include(additionalModule);
    });


    it('should accept <decisionTable> plugins', async function() {

      // given
      const additionalModule = {
        __init__: [ 'foo' ],
        foo: [ 'type', noop ]
      };

      // when
      const {
        instance
      } = await renderEditor(diagramXML, {
        getPlugins(type) {
          switch (type) {
          case 'dmn.modeler.decisionTable.additionalModules':
            return [ additionalModule ];
          }

          return [];
        }
      });

      // then
      const { modeler } = instance.getCached();

      expect(modeler.modules.decisionTable.additionalModules).to.include(additionalModule);
    });


    it('should accept <literalExpression> plugins', async function() {

      // given
      const additionalModule = {
        __init__: [ 'foo' ],
        foo: [ 'type', noop ]
      };

      // when
      const {
        instance
      } = await renderEditor(diagramXML, {
        getPlugins(type) {
          switch (type) {
          case 'dmn.modeler.literalExpression.additionalModules':
            return [ additionalModule ];
          }

          return [];
        }
      });

      // then
      const { modeler } = instance.getCached();

      expect(modeler.modules.literalExpression.additionalModules).to.include(additionalModule);
    });


    it('should accept <moddleExtension> plugins', async function() {

      // given
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
          case 'dmn.modeler.moddleExtension':
            return [ moddleExtension ];
          }

          return [];
        }
      });

      // then
      const { modeler } = instance.getCached();

      expect(modeler.modules.moddleExtensions).to.include({
        bar: moddleExtension
      });
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
          case 'dmn.modeler.moddleExtension':
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
      expect(() => DmnEditor.createCachedState(props)).to.not.throw();
      expect(onErrorSpy).to.be.calledOnce;
    });


    it('should accept general & platform plugins', async function() {

      // given
      const additionalModule = {
        __init__: [ 'foo' ],
        foo: [ 'type', noop ]
      };

      const platformAdditionalModule = {
        __init__: [ 'foo' ],
        foo: [ 'type', noop ]
      };

      const cloudAdditionalModule = {
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

      const platformModdleExtension = {
        name: 'platformbar',
        uri: 'http://platformbar',
        prefix: 'platformbar',
        xml: {
          tagAlias: 'lowerCase'
        },
        types: []
      };

      const cloudModdleExtension = {
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
          case 'dmn.modeler.literalExpression.additionalModules':
            return [ additionalModule ];
          case 'dmn.platform.modeler.literalExpression.additionalModules':
            return [ platformAdditionalModule ];
          case 'dmn.cloud.modeler.literalExpression.additionalModules':
            return [ cloudAdditionalModule ];
          case 'dmn.modeler.moddleExtension':
            return [ moddleExtension ];
          case 'dmn.platform.modeler.moddleExtension':
            return [ platformModdleExtension ];
          case 'dmn.cloud.modeler.moddleExtension':
            return [ cloudModdleExtension ];
          }

          return [];
        }
      });

      // then
      const { modeler } = instance.getCached();

      expect(modeler.modules.literalExpression.additionalModules).to.include(additionalModule);
      expect(modeler.modules.literalExpression.additionalModules).to.not.include(platformAdditionalModule);
      expect(modeler.modules.literalExpression.additionalModules).to.include(cloudAdditionalModule);


      expect(modeler.modules.moddleExtensions).to.include({
        bar: moddleExtension
      });
      expect(modeler.modules.moddleExtensions).to.not.include({
        platformbar: platformModdleExtension
      });
      expect(modeler.modules.moddleExtensions).to.include({
        cloudbar: cloudModdleExtension
      });
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
      const onChangedSpy = spy((state) => {

        // then
        expect(state).to.include({
          defaultCopyCutPaste: false,
          defaultUndoRedo: false,
          dirty: true,
          editLabel: false,
          inputActive: false,
          redo: true,
          removeSelected: false,
          undo: true
        });
      });

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
      expect(onChangedSpy).to.have.been.called;
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


      it('should provide platform = cloud', async function() {

        // given
        const changedSpy = (state) => {

          // then
          expect(state).to.have.property('platform', 'cloud');
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


        it('should provide align/distribute entries', async function() {

          // given
          const changedSpy = (state) => {

            const alignDistributeEntries = getAlignDistributeEntries(state);

            // then
            expect(state.editMenu).to.deep.include(alignDistributeEntries);
          };

          const { instance } = await renderEditor(diagramXML, {
            onChanged: changedSpy
          });

          // when
          instance.handleChanged();
        });

      });


      describe('decision table', function() {

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

          expect(hasMenuEntry(state.editMenu, 'Select Cell Above')).to.be.true;
          expect(hasMenuEntry(state.editMenu, 'Select Cell Below')).to.be.true;
        });


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

      });


      describe('literal expression', function() {

        it('Remove shortcut should always have role: delete', async function() {

          // given
          const changedSpy = sinon.spy();

          const { instance } = await renderEditor(diagramXML, {
            onChanged: changedSpy
          });

          changedSpy.resetHistory();

          // when
          const modeler = instance.getModeler();

          modeler.open({ type: 'literalExpression' });
          instance.handleChanged();

          // then
          expect(changedSpy).to.be.calledOnce;

          const state = changedSpy.firstCall.args[0];

          expect(hasMenuEntry(state.editMenu, 'Remove Selected')).to.be.true;
          expect(getMenuEntry(state.editMenu, 'Remove Selected').role).to.equal('delete');
        });

      });

    });


    describe('window menu', function() {

      it('should provide toggle/reset overview entries for decision table', async function() {

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

        expect(hasMenuEntry(state.windowMenu, 'Toggle Overview')).to.be.true;
        expect(hasMenuEntry(state.windowMenu, 'Reset Overview')).to.be.true;
      });


      it('should provide toggle/reset overview entries for literal expression', async function() {

        // given
        const changedSpy = sinon.spy();

        const { instance } = await renderEditor(diagramXML, {
          onChanged: changedSpy
        });

        changedSpy.resetHistory();

        // when
        const modeler = instance.getModeler();

        modeler.open({ type: 'literalExpression' });
        instance.handleChanged();

        // then
        expect(changedSpy).to.be.calledOnce;

        const state = changedSpy.firstCall.args[0];

        expect(hasMenuEntry(state.windowMenu, 'Toggle Overview')).to.be.true;
        expect(hasMenuEntry(state.windowMenu, 'Reset Overview')).to.be.true;
      });


      it('should NOT provide toggle/reset overview entries for DRD', async function() {

        // given
        const changedSpy = sinon.spy();

        const { instance } = await renderEditor(diagramXML, {
          onChanged: changedSpy
        });

        changedSpy.resetHistory();

        // when
        const modeler = instance.getModeler();

        modeler.open({ type: 'drd' });
        instance.handleChanged();

        // then
        expect(changedSpy).to.be.calledOnce;

        const state = changedSpy.firstCall.args[0];

        expect(hasMenuEntry(state.windowMenu, 'Toggle Overview')).to.be.false;
        expect(hasMenuEntry(state.windowMenu, 'Reset Overview')).to.be.false;
      });
    });
  });


  describe('#viewsChanged', function() {

    let instance;

    const decisionTableView = {
      element: { id: 'decisionTable' },
      type: 'decisionTable'
    };

    const drdView = {
      element: { id: 'drd' },
      type: 'drd'
    };

    const views = [
      drdView,
      decisionTableView
    ];

    beforeEach(async function() {
      ({ instance } = await renderEditor(diagramXML));
    });


    it('should save dirty state', function() {

      // given
      const dirtySpy = spy(instance, 'isDirty');

      const modeler = instance.getModeler();

      const commandStack = modeler.getActiveViewer().get('commandStack');

      const oldDirty = instance.getCached().dirty;

      commandStack.execute(2);

      // when
      instance.viewsChanged({
        activeView: drdView,
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


    it('should reattach properties panel on view switch', function() {

      // given
      const modeler = instance.getModeler();

      const propertiesPanel = modeler.getActiveViewer().get('propertiesPanel');

      const propertiesAttachSpy = sinon.spy(propertiesPanel, 'attachTo');

      // when
      instance.viewsChanged({
        activeView: drdView,
        views
      });

      // then
      expect(propertiesAttachSpy).to.be.called;
    });


    it('should NOT reattach properties panel when stay on view', function() {

      // given
      const modeler = instance.getModeler();

      instance.viewsChanged({
        activeView: drdView,
        views
      });

      const propertiesPanel = modeler.getActiveViewer().get('propertiesPanel');

      const propertiesAttachSpy = sinon.spy(propertiesPanel, 'attachTo');

      // when
      instance.viewsChanged({
        activeView: drdView,
        views
      });

      // then
      expect(propertiesAttachSpy).not.to.be.called;
    });


    it('should reattach overview when switching from DRD to decision table', async function() {

      // given
      instance.viewsChanged({
        activeView: drdView,
        views
      });

      const modeler = instance.getModeler();

      sinon.stub(modeler, 'getActiveView').callsFake(() => decisionTableView);

      const overviewAttachSpy = sinon.spy(modeler, 'attachOverviewTo');

      // when
      instance.viewsChanged({
        activeView: decisionTableView,
        views
      });

      // then
      expect(overviewAttachSpy).to.have.been.called;
    });


    it('should detach overview when switching to DRD', async function() {

      // given
      instance.viewsChanged({
        activeView: decisionTableView,
        views
      });

      const modeler = instance.getModeler();

      sinon.stub(modeler, 'getActiveView').callsFake(() => drdView);

      const overviewDetachSpy = sinon.spy(modeler, 'detachOverview');

      // when
      instance.viewsChanged({
        activeView: drdView,
        views
      });

      // then
      expect(overviewDetachSpy).to.have.been.called;
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
          modeler: new DmnModeler({
            editorActions
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

    it('should open overview', async function() {

      // given
      let layout = {
        dmnOverview: {
          open: false
        }
      };

      function onLayoutChanged(newLayout) {
        layout = newLayout;
      }

      const {
        instance,
        wrapper
      } = await renderEditor(diagramXML, {
        layout,
        onLayoutChanged
      });

      const modeler = instance.getModeler();

      modeler.open({ type: 'decisionTable' });

      instance.handleChanged();

      wrapper.update();

      const toggle = wrapper.find('#button-toggle-overview');

      // when
      toggle.simulate('click');

      // then
      expect(layout.dmnOverview.open).to.be.true;
    });


    it('should close overview', async function() {

      // given
      let layout = {
        dmnOverview: {
          open: true
        }
      };

      function onLayoutChanged(newLayout) {
        layout = newLayout;
      }

      const {
        instance,
        wrapper
      } = await renderEditor(diagramXML, {
        layout,
        onLayoutChanged
      });

      const modeler = instance.getModeler();

      modeler.open({ type: 'decisionTable' });

      instance.handleChanged();

      wrapper.update();

      const toggle = wrapper.find('#button-toggle-overview');

      // when
      toggle.simulate('click');

      // then
      expect(layout.dmnOverview.open).to.be.false;
    });


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

      wrapper.update();

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


    it('should handle image export error (SVG export not supported)', async function() {

      // given
      const errorSpy = spy();

      const { instance } = await renderEditor('export-as-error', {
        onError: errorSpy
      });

      instance.getModeler().getActiveViewer().saveSVG = false;

      // when
      let err;

      try {
        await instance.exportAs('svg');
      } catch (e) {
        err = e;
      }

      // then
      expect(err).to.exist;
      expect(err.message).to.equal('SVG export not supported in current view');
      expect(errorSpy).to.have.been.calledOnce;
    });

  });


  describe('sheet change', function() {

    it('should switch active view on sheet change', async function() {

      // given
      const element = 'mock_element';
      const { wrapper, instance } = await renderEditor(diagramXML);
      const openSpy = sinon.spy(instance, 'open');

      // when
      wrapper.setProps({ activeSheet: { id: 'DecisionTable', element } });

      // expect
      expect(openSpy).to.be.calledOnceWith(element);
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
      const isImportNeededSpy = sinon.spy(DmnEditor.prototype, 'isImportNeeded');

      const cache = new Cache();

      cache.add('editor', {
        cached: {
          lastXML: diagramXML,
          modeler: new DmnModeler()
        }
      });

      await renderEditor(diagramXML, {
        cache,
        waitForImport: false
      });

      // then
      // DmnEditor#componentDidMount is async
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
        activeSheet: defaultActiveSheet,
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


    it('should NOT be dirty after export', async function() {

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


    it('should be dirty after export error', async function() {

      // given
      const { instance } = await renderEditor('export-error');

      const { modeler } = instance.getCached();

      // execute 1 command
      modeler.getActiveViewer().get('commandStack').execute(1);

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


  describe('overview actions', function() {

    it('should toggle overview', async function() {

      // given
      const onLayoutChangedSpy = sinon.spy();
      const {
        instance
      } = await renderEditor(diagramXML, {
        layout: {
          dmnOverview: {
            open: false,
          }
        },
        onLayoutChanged: onLayoutChangedSpy
      });

      // when
      instance.triggerAction('toggleOverview');

      // then
      expect(onLayoutChangedSpy).to.be.calledOnceWith({
        dmnOverview: {
          open: true,
        }
      });
    });


    it('should reset overview', async function() {

      // given
      const onLayoutChangedSpy = sinon.spy();
      const {
        instance
      } = await renderEditor(diagramXML, {
        onLayoutChanged: onLayoutChangedSpy
      });

      // when
      instance.triggerAction('resetOverview');

      // then
      expect(onLayoutChangedSpy).to.be.calledOnceWith({
        dmnOverview: DEFAULT_LAYOUT
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
      const modelerConfigureEvent = getEvent(emittedEvents, 'dmn.modeler.configure');

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
      const { modeler } = instance.getCached();

      const modelerCreatedEvent = getEvent(emittedEvents, 'dmn.modeler.created');

      const {
        payload
      } = modelerCreatedEvent;

      expect(modelerCreatedEvent).to.exist;
      expect(payload.modeler).to.eql(modeler);
    });

  });


  describe('#handleMigration', function() {

    it('should migrate to DMN 1.3', async function() {

      // given
      const onActionSpy = spy((action) => {
        if (action === 'show-dialog') {
          return { button: 'yes' };
        }
      });

      const onContentUpdatedSpy = sinon.spy();

      const cache = new Cache();

      cache.add('editor', {
        cached: {
          modeler: new DmnModeler()
        },
        __destroy: () => {}
      });

      // when
      await renderEditor(diagram11XML, {
        id: 'editor',
        cache,
        onAction: onActionSpy,
        onContentUpdated: onContentUpdatedSpy
      });

      // then
      expect(onActionSpy).to.have.been.calledOnce;
      expect(onActionSpy.firstCall.args[ 0 ]).to.eql('show-dialog');

      expect(onContentUpdatedSpy).to.have.been.calledOnce;
      expect(onContentUpdatedSpy).to.have.been.calledOnceWith(sinon.match('dmndi:DMNDI'));
    });


    it('shoud NOT migrate to DMN 1.3', async function() {

      // given
      const onActionSpy = spy((action) => {
        if (action === 'show-dialog') {
          return { button: 'cancel' };
        }
      });

      const onContentUpdatedSpy = sinon.spy();

      const cache = new Cache();

      cache.add('editor', {
        cached: {
          modeler: new DmnModeler()
        },
        __destroy: () => {}
      });

      // when
      await renderEditor(diagram11XML, {
        id: 'editor',
        cache,
        onAction: onActionSpy,
        onContentUpdated: onContentUpdatedSpy
      });

      // then
      expect(onActionSpy).to.have.been.calledTwice;
      expect(onActionSpy.firstCall.args[ 0 ]).to.eql('show-dialog');
      expect(onActionSpy.secondCall.args[ 0 ]).to.eql('close-tab');

      expect(onContentUpdatedSpy).not.to.have.been.called;
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
      executionPlatform: 'Camunda Cloud',
      executionPlatformVersion: undefined
    }));


    it('should show engine profile (with namespace)', expectEngineProfile(namespaceEngineProfileXML, {
      executionPlatform: 'Camunda Cloud',
      executionPlatformVersion: undefined
    }));


    it('should show engine profile (Camunda Cloud 8.0.0)', expectEngineProfile(engineProfileXML, {
      executionPlatform: 'Camunda Cloud',
      executionPlatformVersion: '8.0.0'
    }));


    it('should show engine profile (Camunda Cloud 8.0)', expectEngineProfile(missingPatchEngineProfileXML, {
      executionPlatform: 'Camunda Cloud',
      executionPlatformVersion: '8.0.0'
    }));


    it('should show engine profile (Camunda Cloud 8.0.1)', expectEngineProfile(patchEngineProfileXML, {
      executionPlatform: 'Camunda Cloud',
      executionPlatformVersion: '8.0.1'
    }));


    it('should reject unknown engine profile', async function() {

      // given
      const onImportSpy = spy();

      // when
      const { instance } = await renderEditor(unknownEngineProfileXML, { onImport: onImportSpy });

      // then
      expect(onImportSpy).to.have.been.calledOnce;
      expect(onImportSpy).to.have.been.calledWith(sinon.match({ message: 'An unknown execution platform (Camunda Unknown 7.15.0) was detected.' }), []);

      expect(instance.getCached().engineProfile).to.be.null;
    });

  });

});


// helpers //////////

function noop() {}

const TestEditor = WithCachedState(DmnEditor);

const defaultActiveSheet = { id: 'dmn' };

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
    activeSheet = defaultActiveSheet,
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
    onSheetsChanged = noop,
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

    const resolveOnAction = (action, ...args) => {
      if (action === 'close-tab') {
        resolve({
          instance,
          wrapper
        });
      }

      return onAction(action, ...args);
    };

    wrapper = mount(
      <TestEditor
        activeSheet={ activeSheet }
        cache={ cache }
        getConfig={ getConfig }
        getPlugins={ getPlugins }
        id={ id }
        isNew={ isNew }
        layout={ layout }
        onAction={ waitForImport ? resolveOnAction : onAction }
        onChanged={ onChanged }
        onContentUpdated={ onContentUpdated }
        onError={ onError }
        onImport={ waitForImport ? resolveOnImport : onImport }
        onLayoutChanged={ onLayoutChanged }
        onModal={ onModal }
        onSheetsChanged={ onSheetsChanged }
        onWarning={ onWarning }
        xml={ xml }
      />
    );

    instance = wrapper.find(DmnEditor).instance();

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

function getMenuEntry(editMenu, label) {
  for (let i = 0; i < editMenu.length; i++) {
    const entry = editMenu[i];

    if (isArray(entry)) {
      const res = getMenuEntry(entry, label);
      if (res) {
        return res;
      }
    } else {
      if (entry.label === label) {
        return entry;
      }
    }
  }

  return false;
}

function hasMenuEntry(editMenu, label) {
  return !!editMenu.find(entry => {
    if (isArray(entry)) {
      return hasMenuEntry(entry, label);
    } else {
      return entry.label === label;
    }
  });
}
