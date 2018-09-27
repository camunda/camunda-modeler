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

const { spy } = sinon;


describe('<BpmnEditor>', function() {

  it('should render', function() {
    const {
      bpmnEditor
    } = renderBpmnEditor(diagramXML);

    expect(bpmnEditor).to.exist;
  });


  describe('caching behavior', function() {

    let createSpy;

    beforeEach(function() {
      createSpy = sinon.spy(BpmnEditor, 'createCachedState');
    });

    afterEach(function() {
      createSpy.restore();
    });


    it('should create modeler if not cached', function() {

      // when
      const {
        bpmnEditor
      } = renderBpmnEditor(diagramXML);

      // then
      const {
        modeler
      } = bpmnEditor.getCached();

      expect(modeler).to.exist;
      expect(createSpy).to.have.been.calledOnce;
    });


    it('should use cached modeler', function() {

      // given
      const cache = new Cache();

      cache.add('editor', {
        cached: {
          modeler: new BpmnModeler()
        },
        __destroy: () => {}
      });

      // when
      renderBpmnEditor(diagramXML, {
        id: 'editor',
        cache
      });

      // then
      expect(createSpy).not.to.have.been.called;
    });

  });


  it('#getXML', async function() {
    const {
      bpmnEditor
    } = renderBpmnEditor(diagramXML);

    const xml = await bpmnEditor.getXML();

    expect(xml).to.exist;
    expect(xml).to.eql(diagramXML);
  });


  describe('#exportAs', function() {

    let bpmnEditor;

    beforeEach(function() {
      bpmnEditor = renderBpmnEditor(diagramXML).bpmnEditor;
    });


    it('svg', async function() {
      const contents = await bpmnEditor.exportAs('svg');

      expect(contents).to.exist;
      expect(contents).to.equal('<svg />');
    });


    it('png', async function() {
      const contents = await bpmnEditor.exportAs('png');

      expect(contents).to.exist;
      expect(contents).to.contain('data:image/png');
    });


    it('jpeg', async function() {
      const contents = await bpmnEditor.exportAs('jpeg');

      expect(contents).to.exist;
      expect(contents).to.contain('data:image/jpeg');
    });

  });


  describe('layout', function() {

    it('should open properties panel', function() {

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
      } = renderBpmnEditor(diagramXML, {
        layout,
        onLayoutChanged
      });

      const toggle = wrapper.find('.toggle');

      // when
      toggle.simulate('click');

      // then
      expect(layout.propertiesPanel.open).to.be.true;
    });


    it('should close properties panel', function() {

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
      } = renderBpmnEditor(diagramXML, {
        layout,
        onLayoutChanged
      });

      const toggle = wrapper.find('.toggle');

      // when
      toggle.simulate('click');

      // then
      expect(layout.propertiesPanel.open).to.be.false;
    });


    it('should handle missing layout', function() {

      // given
      let layout = { };

      // then
      renderBpmnEditor(diagramXML, {
        layout
      });

    });

  });


  describe('errors', function() {

    // TODO
    it('should handle template error');


    it('should handle import error', function() {

      // given
      const errorSpy = spy();

      // when
      renderBpmnEditor('import-error', {
        onError: errorSpy
      });

      // then
      expect(errorSpy).to.have.been.called;
    });


    it('should handle XML export', async function() {
      // given
      const errorSpy = spy();

      const {
        bpmnEditor
      } = renderBpmnEditor('export-error', {
        onError: errorSpy
      });

      let err;

      // when
      try {
        await bpmnEditor.getXML();
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
        bpmnEditor
      } = renderBpmnEditor('export-as-error', {
        onError: errorSpy
      });

      let err;

      // when
      try {
        await bpmnEditor.exportAs('svg');
      } catch (e) {
        err = e;
      }

      // then
      expect(err).to.exist;
      expect(errorSpy).to.have.been.calledOnce;
    });

  });

});


// helpers //////////////////////////////

function noop() {}

const TestEditor = WithCachedState(BpmnEditor);

function renderBpmnEditor(xml, options = {}) {
  const {
    layout,
    onError,
    onLayoutChanged
  } = options;

  const slotFillRoot = mount(
    <SlotFillRoot>
      <TestEditor
        id={ options.id || 'editor' }
        xml={ xml }
        onLayoutChanged={ onLayoutChanged || noop }
        onError={ onError || noop }
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

  return {
    bpmnEditor: wrapper.instance(),
    wrapper
  };
}