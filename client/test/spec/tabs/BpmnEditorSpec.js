import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { shallow } from 'enzyme';

import {
  default as BpmnEditorWithCachedState,
  BpmnEditor
} from '../../../src/app/tabs/BpmnEditor';

import { SlotFillRoot } from '../../../src/app/slot-fill';

import Modeler from '../../mocks/bpmn-js/Modeler';

/* global sinon */

import {
  findRenderedComponentWithType
} from 'react-dom/test-utils';

import TestContainer from 'mocha-test-container-support';

import diagramXML from '../diagram.bpmn';

import { insertCSS } from '../../helper';

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


describe('BpmnEditor', function() {

  var container;
  var createCachedSpy;


  beforeEach(function() {

    createCachedSpy = sinon.spy(BpmnEditor, 'createCachedState');

    container = TestContainer.get(this);
  });

  afterEach(function() {
    createCachedSpy.restore();
  });


  it('should render', function() {
    var cachedState = {
      modeler: new Modeler()
    };

    // we have to render the actual component without HoCs
    // so we can access the instance afterwards
    var wrapper = shallow(<BpmnEditor
      id="foo"
      xml={ diagramXML }
      cachedState={ cachedState }
      setCachedState={ function() {} } />);

    var instance = wrapper.instance();

    expect(instance).to.exist;
  });


  it('should create modeler if no cached modeler', function() {

    var slotFillRoot = ReactDOM.render(
      <SlotFillRoot>
        <BpmnEditorWithCachedState id="foo" xml={ diagramXML } />
      </SlotFillRoot>,
      container
    );

    var bpmnEditor = findRenderedComponentWithType(slotFillRoot, BpmnEditor);

    const {
      modeler
    } = bpmnEditor.getCached();

    expect(createCachedSpy).to.have.been.calledOnce;
    expect(modeler).to.exist;
  });


  it('should use existing modeler if cached modeler', function() {

    var slotFillRoot = ReactDOM.render(
      <SlotFillRoot>
        <RenderChildren>
          <BpmnEditorWithCachedState id="foo" xml={ diagramXML } />
        </RenderChildren>
      </SlotFillRoot>,
      container
    );

    var renderChildren = findRenderedComponentWithType(slotFillRoot, RenderChildren);
    var bpmnEditor = findRenderedComponentWithType(slotFillRoot, BpmnEditor);

    const {
      modeler
    } = bpmnEditor.getCached();

    expect(modeler).to.exist;

    console.log('%cset renderChildren = false', 'background: yellow; padding: 2px 4px');

    renderChildren.setState({
      renderChildren: false
    });

    setTimeout(function() {
      console.log('%cset renderChildren = true', 'background: yellow; padding: 2px 4px');

      renderChildren.setState({
        renderChildren: true
      });

      setTimeout(function() {
        console.log('%cexpecting', 'background: yellow; padding: 2px 4px');

        expect(createCachedSpy).to.have.been.calledOnce;

        console.log('success');
      }, 0);

    }, 0);

  });


  it('#getXML', function() {
    var slotFillRoot = ReactDOM.render(
      <SlotFillRoot>
        <BpmnEditorWithCachedState id="foo" xml={ diagramXML } />
      </SlotFillRoot>,
      container
    );

    var bpmnEditor = findRenderedComponentWithType(slotFillRoot, BpmnEditor);

    const {
      modeler
    } = bpmnEditor.getCached();

    modeler.on('import.done', function() {

      bpmnEditor.getXML(function(xml) {

        expect(xml).to.exist;
        expect(xml).to.eql(diagramXML);
      });

    });

  });

});