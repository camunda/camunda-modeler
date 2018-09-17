/* global sinon */

import React from 'react';

import { mount } from 'enzyme';

import {
  default as BpmnEditorWithCachedState,
  BpmnEditor
} from '../BpmnEditor';

import { SlotFillRoot } from 'src/app/slot-fill';

import diagramXML from './diagram.bpmn';

import { insertCSS } from 'test/helper';

insertCSS('test.css', '.test-content-container { position: relative; }');


describe('<BpmnEditor>', function() {

  let createCachedSpy;


  beforeEach(function() {
    createCachedSpy = sinon.spy(BpmnEditor, 'createCachedState');
  });

  afterEach(function() {
    createCachedSpy.restore();
  });


  it('should render', function() {
    const {
      bpmnEditor
    } = renderBpmnEditor(diagramXML);

    expect(bpmnEditor).to.exist;
  });


  // TODO(philippfromme): spy is not called if test isn't executed exclusively
  it.skip('should create modeler if no cached modeler', function() {

    const {
      bpmnEditor
    } = renderBpmnEditor(diagramXML);

    const {
      modeler
    } = bpmnEditor.getCached();

    expect(createCachedSpy).to.have.been.calledOnce;
    expect(modeler).to.exist;
  });


  it('should use existing modeler if cached modeler');


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
      const {
        bpmnEditor,
        wrapper
      } = renderBpmnEditor(diagramXML, {
        layout: {
          propertiesPanel: {
            open: false
          }
        }
      });

      const toggle = wrapper.find('.toggle');

      // when
      toggle.simulate('click');

      // then
      expect(bpmnEditor.state.layout.propertiesPanel.open).to.be.true;
    });


    it('should close properties panel', function() {

      // given
      const {
        bpmnEditor,
        wrapper
      } = renderBpmnEditor(diagramXML);

      const toggle = wrapper.find('.toggle');

      // when
      toggle.simulate('click');

      // then
      expect(bpmnEditor.state.layout.propertiesPanel.open).to.be.false;
    });


    it('should handle missing layout', function() {

      // when
      const {
        bpmnEditor
      } = renderBpmnEditor(diagramXML, {
        layout: {}
      });

      // then
      expect(bpmnEditor.state.layout).to.eql({
        minimap: {
          open: false
        },
        propertiesPanel: {
          open: true
        }
      });
    });


    it('it should apply received layout', function() {

      // when
      const {
        bpmnEditor
      } = renderBpmnEditor(diagramXML, {
        layout: {
          minimap: {
            open: true
          },
          propertiesPanel: {
            open: false
          }
        }
      });

      // then
      expect(bpmnEditor.state.layout).to.eql({
        minimap: {
          open: true
        },
        propertiesPanel: {
          open: false
        }
      });
    });

  });


  describe('errors', function() {

    // TODO
    it('should handle template error');


    // TODO(philippfromme): why does import not return error?
    it.skip('should handle import error', function() {

      // given
      const onErrorSpy = sinon.spy();

      const errorXML = 'foo';

      // when
      renderBpmnEditor(errorXML, {
        onError: onErrorSpy
      });

      // then
      expect(onErrorSpy).to.have.been.called;
    });

    it('should handle export error', function() {
      // TODO(philippfromme): how to make #getXML throw?
    });


    it('should handle export error', function() {
      // TODO(philippfromme): how to make #exportAs throw?
    });

  });

});

function noop() {}

function renderBpmnEditor(xml, options = {}) {
  const {
    layout,
    onError,
    onLayoutChanged
  } = options;

  const slotFillRoot = mount(
    <SlotFillRoot>
      <BpmnEditorWithCachedState
        id="foo"
        xml={ xml }
        onLayoutChanged={ onLayoutChanged || noop }
        onError={ onError || noop }
        layout={ layout || {
          minimap: {
            open: false
          },
          propertiesPanel: {
            open: true
          }
        } } />
    </SlotFillRoot>
  );

  const wrapper = slotFillRoot.find(BpmnEditor);

  return {
    bpmnEditor: wrapper.instance(),
    wrapper
  };
}