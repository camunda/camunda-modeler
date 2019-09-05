/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

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
  findRenderedDOMComponentWithClass,
  scryRenderedDOMComponentsWithClass as findComponentsWithClass
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
          <Fill slot="foo">
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
          <Fill slot="foo">
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


    describe('ordering', function() {

      it('should display fills ordered alphabetically by group', function() {

        // given
        var unorderedFills = [ '1_a', '2_b', '3_a', 'foo', '2_a' ].map(id => (
          <Fill slot="foo" group={ id } key={ id }>
            <div className="fill" id={ id } />
          </Fill>
        ));

        // when
        var slotFillRoot = ReactDOM.render(
          <SlotFillRoot>
            { unorderedFills }
            <div className="slot">
              <Slot name="foo" />
            </div>
          </SlotFillRoot>,
          container
        );

        // then
        var fills = findComponentsWithClass(slotFillRoot, 'fill'),
            slot = findRenderedDOMComponentWithClass(slotFillRoot, 'slot');

        expect(fills.every(fill => slot.contains(fill))).to.be.true;
        expect(fills.map(fill => fill.id)).to.eql([
          '1_a',
          '2_a',
          '2_b',
          '3_a',
          'foo'
        ]);

      });


      it('should display fills ordered by priority inside same group', function() {

        // when
        var slotFillRoot = ReactDOM.render(
          <SlotFillRoot>
            <Fill slot="foo" group="1_a" priority={ -1 }>
              <div className="fill" id="low_priority" />
            </Fill>
            <Fill slot="foo" group="1_a">
              <div className="fill" id="no_priority" />
            </Fill>
            <Fill slot="foo" group="1_a" priority={ 100 }>
              <div className="fill" id="high_priority" />
            </Fill>
            <div className="slot">
              <Slot name="foo" />
            </div>
          </SlotFillRoot>,
          container
        );

        // then
        var fills = findComponentsWithClass(slotFillRoot, 'fill'),
            slot = findRenderedDOMComponentWithClass(slotFillRoot, 'slot');

        expect(fills.every(fill => slot.contains(fill))).to.be.true;
        expect(fills.map(fill => fill.id)).to.eql([
          'high_priority',
          'no_priority',
          'low_priority'
        ]);

      });

    });

  });

});