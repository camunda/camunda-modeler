import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { shallow } from 'enzyme';

import {
  default as BpmnEditorWithCachedState,
  BpmnEditor
} from '../BpmnEditor';

import { SlotFillRoot } from 'src/app/slot-fill';

import Modeler from 'test/mocks/bpmn-js/Modeler';

/* global sinon */

import {
  findRenderedComponentWithType
} from 'react-dom/test-utils';

import TestContainer from 'mocha-test-container-support';

import diagramXML from './diagram.bpmn';

import { insertCSS } from 'test/helper';

insertCSS('test.css', '.test-content-container { position: relative; }');

class RenderChildren extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      renderChildren: true
    };
  }

  render() {
    return this.state.renderChildren && this.props.children;
  }
}


describe('<BpmnEditor>', function() {

  let container, createCachedSpy;


  beforeEach(function() {

    createCachedSpy = sinon.spy(BpmnEditor, 'createCachedState');

    container = TestContainer.get(this);
  });

  afterEach(function() {
    createCachedSpy.restore();
  });


  it('should render', function() {
    const cachedState = {
      modeler: new Modeler()
    };

    // we have to render the actual component without HoCs
    // so we can access the instance afterwards (only instance of root can be accessed)
    const wrapper = shallow(<BpmnEditor
      id="foo"
      xml={ diagramXML }
      cachedState={ cachedState }
      setCachedState={ function() {} } />);

    const instance = wrapper.instance();

    expect(instance).to.exist;
  });


  it('should create modeler if no cached modeler', function() {

    const slotFillRoot = ReactDOM.render(
      <SlotFillRoot>
        <BpmnEditorWithCachedState id="foo" xml={ diagramXML } />
      </SlotFillRoot>,
      container
    );

    const bpmnEditor = findRenderedComponentWithType(slotFillRoot, BpmnEditor);

    const {
      modeler
    } = bpmnEditor.getCached();

    expect(createCachedSpy).to.have.been.calledOnce;
    expect(modeler).to.exist;
  });


  it('should use existing modeler if cached modeler', function() {

    const slotFillRoot = ReactDOM.render(
      <SlotFillRoot>
        <RenderChildren>
          <BpmnEditorWithCachedState id="foo" xml={ diagramXML } />
        </RenderChildren>
      </SlotFillRoot>,
      container
    );

    const renderChildren = findRenderedComponentWithType(slotFillRoot, RenderChildren);
    const bpmnEditor = findRenderedComponentWithType(slotFillRoot, BpmnEditor);

    const {
      modeler
    } = bpmnEditor.getCached();

    expect(modeler).to.exist;

    renderChildren.setState({
      renderChildren: false
    });

    setTimeout(function() {
      renderChildren.setState({
        renderChildren: true
      });

      setTimeout(function() {
        expect(createCachedSpy).to.have.been.calledOnce;
      }, 0);

    }, 0);

  });


  it('#getXML', async function() {
    const bpmnEditor = renderBpmnEditor(diagramXML, container);

    const xml = await bpmnEditor.getXML();

    expect(xml).to.exist;
    expect(xml).to.eql(diagramXML);
  });

  describe.only('#exportAs', function() {

    let bpmnEditor;

    beforeEach(function() {
      bpmnEditor = renderBpmnEditor(diagramXML, container);
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


});

function renderBpmnEditor(xml, container) {
  const slotFillRoot = ReactDOM.render(
    <SlotFillRoot>
      <BpmnEditorWithCachedState id="foo" xml={ diagramXML } />
    </SlotFillRoot>,
    container
  );

  return findRenderedComponentWithType(slotFillRoot, BpmnEditor);
}