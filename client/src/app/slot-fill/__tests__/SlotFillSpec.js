import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import {
  SlotFillRoot,
  Fill,
  Slot
} from '..';

import FillContext from '../FillContext';
import SlotContext from '../SlotContext';

import TestContainer from 'mocha-test-container-support';

import {
  findRenderedComponentWithType,
  findRenderedDOMComponentWithClass
} from 'react-dom/test-utils';

import {
  query as domQuery
} from 'min-dom';

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

class RenderButtons extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      renderButton: true
    };
  }

  render() {
    return (
      <React.Fragment>
        <button id="foo">Foo</button>
        {
          this.state.renderButton && <button id="bar">Bar</button>
        }
      </React.Fragment>
    );
  }
}


describe('slot-fill', function() {

  var container;

  beforeEach(function() {
    container = TestContainer.get(this);
  });


  describe('<SlotFillRoot>', function() {

    it('should have access to fill context', function() {
      ReactDOM.render(
        <SlotFillRoot>
          <FillContext.Consumer>
            {
              fillContext => {
                expect(fillContext).to.exist;
                expect(fillContext.addFill).to.exist;
                expect(fillContext.removeFill).to.exist;
              }
            }
          </FillContext.Consumer>
        </SlotFillRoot>,
        container
      );
    });


    it('should have access to slot context', function() {
      ReactDOM.render(
        <SlotFillRoot>
          <SlotContext.Consumer>
            {
              slotContext => {
                expect(slotContext).to.exist;
                expect(slotContext.fills).to.exist;
              }
            }
          </SlotContext.Consumer>
        </SlotFillRoot>,
        container
      );
    });

  });


  describe('<Fill>', function() {

    it('should register fill', function() {
      var slotFillRoot = ReactDOM.render(
        <SlotFillRoot>
          <Fill />
        </SlotFillRoot>,
        container
      );

      expect(slotFillRoot.state.fills).to.have.lengthOf(1);
    });


    it('should unregister fill', function() {
      var slotFillRoot = ReactDOM.render(
        <SlotFillRoot>
          <RenderChildren>
            <Fill />
          </RenderChildren>
        </SlotFillRoot>,
        container
      );

      var renderChildren = findRenderedComponentWithType(slotFillRoot, RenderChildren);

      // SlotFillRoot will be last one to update
      // (RenderChildren -> SlotFillRoot)
      slotFillRoot.componentDidUpdate = function() {

        // then
        expect(slotFillRoot.state.fills).to.have.lengthOf(0);
      };

      // when
      renderChildren.setState({ renderChildren: false });
    });


    it('should update fill', function() {
      var slotFillRoot = ReactDOM.render(
        <SlotFillRoot>
          <Fill name="foo">
            <RenderButtons />
          </Fill>
          <Slot name="foo" />
        </SlotFillRoot>,
        container
      );

      expect(domQuery('#foo', container)).to.exist;
      expect(domQuery('#bar', container)).to.exist;

      var renderButtons = findRenderedComponentWithType(slotFillRoot, RenderButtons);

      // RenderButtons will be last one to update
      // (RenderButtons -> SlotFillRoot -> RenderButtons)
      renderButtons.componentDidUpdate = function() {

        // then
        expect(domQuery('#foo', container)).to.exist;
        expect(domQuery('#bar', container)).not.to.exist;
      };

      // when
      renderButtons.setState({ renderButton: false });
    });

  });


  describe('<Slot>', function() {

    it('should render fills', function() {

      // when
      var slotFillRoot = ReactDOM.render(
        <SlotFillRoot>
          <Fill name="foo">
            <div className="fill" />
          </Fill>
          <div className="slot">
            <Slot name="foo" />
          </div>
        </SlotFillRoot>,
        container
      );

      // then
      var fill = findRenderedDOMComponentWithClass(slotFillRoot, 'fill'),
          slot = findRenderedDOMComponentWithClass(slotFillRoot, 'slot');

      expect(slot.contains(fill)).to.be.true;
    });

  });

});