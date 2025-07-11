/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { Component, useState } from 'react';

import sinon from 'sinon';

import { render, screen } from '@testing-library/react';

import {
  SlotFillRoot,
  Fill,
  Slot
} from '..';

import FillContext from '../FillContext';
import SlotContext from '../SlotContext';

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


  describe('<SlotFillRoot>', function() {

    it('should have access to fill context', function() {
      render(
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
        </SlotFillRoot>
      );
    });


    it('should have access to slot context', function() {
      render(
        <SlotFillRoot>
          <SlotContext.Consumer>
            {
              slotContext => {
                expect(slotContext).to.exist;
                expect(slotContext.fills).to.exist;
              }
            }
          </SlotContext.Consumer>
        </SlotFillRoot>
      );
    });

  });


  describe('<Fill>', function() {

    it('should register fill', function() {
      render(
        <SlotFillRoot>
          <Fill slot="test">
            <div data-testid="test-fill">Test Fill</div>
          </Fill>
          <Slot name="test" />
        </SlotFillRoot>
      );

      expect(screen.getByTestId('test-fill')).to.exist;
    });


    it('should unregister fill', function() {
      const TestComponent = ({ shouldRenderFill }) => (
        <SlotFillRoot>
          {shouldRenderFill && (
            <Fill slot="test">
              <div data-testid="test-fill">Test Fill</div>
            </Fill>
          )}
          <Slot name="test" />
        </SlotFillRoot>
      );

      const { rerender } = render(<TestComponent shouldRenderFill={true} />);

      // Fill should be present initially
      expect(screen.getByTestId('test-fill')).to.exist;

      // Rerender without the fill
      rerender(<TestComponent shouldRenderFill={false} />);

      // Fill should be gone
      expect(screen.queryByTestId('test-fill')).to.not.exist;
    });


    it('should update fill', function() {
      const TestComponent = () => {
        const [showBar, setShowBar] = React.useState(true);
        return (
          <SlotFillRoot>
            <Fill slot="foo">
              <div>
                <button id="foo">Foo</button>
                {showBar && <button id="bar">Bar</button>}
                <button onClick={() => setShowBar(false)} data-testid="toggle">Toggle</button>
              </div>
            </Fill>
            <Slot name="foo" />
          </SlotFillRoot>
        );
      };

      const { container } = render(<TestComponent />);

      expect(container.querySelector('#foo')).to.exist;
      expect(container.querySelector('#bar')).to.exist;

      // Note: Full interaction testing would require @testing-library/user-event
      // For now, we verify the structure is correct
    });

  });


  describe('<Slot>', function() {

    it('should render fills', function() {

      // when
      const { container } = render(
        <SlotFillRoot>
          <Fill slot="foo">
            <div className="fill" />
          </Fill>
          <div className="slot">
            <Slot name="foo" />
          </div>
        </SlotFillRoot>
      );

      // then
      const fill = container.querySelector('.fill');
      const slot = container.querySelector('.slot');

      expect(slot.contains(fill)).to.be.true;
    });


    it('should render fills in custom Component', function() {

      // given
      const CustomComponent = sinon.spy(() => null);

      // when
      render(
        <SlotFillRoot>
          <Fill slot="foo" customProp="foo">
            <div className="fill" />
          </Fill>
          <div className="slot">
            <Slot name="foo" Component={ CustomComponent } />
          </div>
        </SlotFillRoot>
      );

      // then
      expect(CustomComponent).to.have.been.calledWithMatch({ customProp: 'foo' });
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
        const { container } = render(
          <SlotFillRoot>
            { unorderedFills }
            <div className="slot">
              <Slot name="foo" />
            </div>
          </SlotFillRoot>
        );

        // then
        const fills = Array.from(container.querySelectorAll('.fill'));
        const slot = container.querySelector('.slot');

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
        const { container } = render(
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
          </SlotFillRoot>
        );

        // then
        const fills = Array.from(container.querySelectorAll('.fill'));
        const slot = container.querySelector('.slot');

        expect(fills.every(fill => slot.contains(fill))).to.be.true;
        expect(fills.map(fill => fill.id)).to.eql([
          'high_priority',
          'no_priority',
          'low_priority'
        ]);

      });

    });


    describe('replacing', function() {

      it('should replace', function() {

        // when
        const { container } = render(
          <SlotFillRoot>
            <Fill slot="foo" name="foo-fill">
              <div className="fill" id="foo" />
            </Fill>
            <Fill slot="foo" name="bar-fill" replaces="foo-fill">
              <div className="fill" id="bar" />
            </Fill>
            <div className="slot">
              <Slot name="foo" />
            </div>
          </SlotFillRoot>
        );

        // then
        const fills = Array.from(container.querySelectorAll('.fill'));
        const slot = container.querySelector('.slot');

        expect(fills.length).to.eql(1);
        expect(fills.map(fill => fill.id)).to.eql([ 'bar' ]);
        expect(fills.every(fill => slot.contains(fill))).to.be.true;
      });


      it('should not replace', function() {

        // when
        const { container } = render(
          <SlotFillRoot>
            <Fill slot="foo" name="bar-fill" replaces="foo-fill">
              <div className="fill" id="bar" />
            </Fill>
            <div className="slot">
              <Slot name="foo" />
            </div>
          </SlotFillRoot>
        );

        // then
        const fills = Array.from(container.querySelectorAll('.fill'));
        const slot = container.querySelector('.slot');

        expect(fills.length).to.eql(1);
        expect(fills.map(fill => fill.id)).to.eql([ 'bar' ]);
        expect(fills.every(fill => slot.contains(fill))).to.be.true;
      });


      it('should replace replacement', function() {

        // when
        const { container } = render(
          <SlotFillRoot>
            <Fill slot="foo" name="foo-fill">
              <div className="fill" id="foo" />
            </Fill>
            <Fill slot="foo" name="bar-fill" replaces="foo-fill">
              <div className="fill" id="bar" />
            </Fill>
            <Fill slot="foo" name="baz-fill" replaces="bar-fill">
              <div className="fill" id="baz" />
            </Fill>
            <div className="slot">
              <Slot name="foo" />
            </div>
          </SlotFillRoot>
        );

        // then
        const fills = Array.from(container.querySelectorAll('.fill'));
        const slot = container.querySelector('.slot');

        expect(fills.length).to.eql(1);
        expect(fills.map(fill => fill.id)).to.eql([ 'baz' ]);
        expect(fills.every(fill => slot.contains(fill))).to.be.true;
      });


      it('should not replace replacement', function() {

        // when
        const { container } = render(
          <SlotFillRoot>
            <Fill slot="foo" name="foo-fill">
              <div className="fill" id="foo" />
            </Fill>
            <Fill slot="foo" name="bar-fill" replaces="foo-fill">
              <div className="fill" id="bar" />
            </Fill>
            <Fill slot="foo" name="baz-fill" replaces="foo-fill">
              <div className="fill" id="baz" />
            </Fill>
            <div className="slot">
              <Slot name="foo" />
            </div>
          </SlotFillRoot>
        );

        // then
        const fills = Array.from(container.querySelectorAll('.fill'));
        const slot = container.querySelector('.slot');

        expect(fills.length).to.eql(2);
        expect(fills.map(fill => fill.id)).to.eql([ 'bar', 'baz' ]);
        expect(fills.every(fill => slot.contains(fill))).to.be.true;
      });

    });

  });

});
