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

import { SlotFillRoot } from 'src/app/slot-fill';

import diagramXML from './diagram.bpmn';
import activitiXML from './activiti.bpmn';

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


  describe('#handleChanged', function() {

    it('should notify about changes', async function() {

      // given
      const changedSpy = (state) => {

        // then
        expect(state).to.include({
          align: false,
          copy: false,
          distribute: false,
          editLabel: false,
          find: true,
          globalConnectTool: true,
          handTool: true,
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
          modeler: new BpmnModeler({
            clipboard: {
              isEmpty: () => true
            },
            commandStack: {
              canRedo: () => true,
              canUndo: () => true
            },
            selection: {
              get: () => []
            }
          })
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
          modeler
        } = instance.getCached();

        expect(modeler.lastXML).to.equal(diagramXML);

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
          modeler
        } = instance.getCached();

        expect(modeler.lastXML).to.equal('import-warnings');

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
          modeler
        } = instance.getCached();

        expect(modeler.lastXML).not.to.exist;

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
            elementTemplatesLoader: elementTemplatesLoaderMock
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
            elementTemplatesLoader: elementTemplatesLoaderStub
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
            elementTemplatesLoader: elementTemplatesLoaderStub
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
            elementTemplatesLoader: elementTemplatesLoaderStub
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
    onLoadConfig
  } = options;

  const slotFillRoot = await mount(
    <SlotFillRoot>
      <TestEditor
        id={ id || 'editor' }
        xml={ xml }
        onAction={ onAction || noop }
        onChanged={ onChanged || noop }
        onError={ onError || noop }
        onImport={ onImport || noop }
        onLayoutChanged={ onLayoutChanged || noop }
        onContentUpdated={ onContentUpdated || noop }
        onModal={ onModal || noop }
        onLoadConfig={ onLoadConfig || noop }
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
    </SlotFillRoot>
  );

  const wrapper = slotFillRoot.find(BpmnEditor);

  const instance = wrapper.instance();

  return {
    instance,
    wrapper
  };
}