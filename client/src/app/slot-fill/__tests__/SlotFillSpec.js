/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useState } from 'react';

import sinon from 'sinon';

import { act, render } from '@testing-library/react';

import { userEvent } from '@testing-library/user-event';

import {
  SlotFillRoot,
  Fill,
  Slot
} from '..';

import FillContext from '../FillContext';
import SlotContext from '../SlotContext';


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
      const { getByTestId } = render(
        <SlotFillRoot>
          <Fill slot="test">
            <div data-testid="test-fill">Test Fill</div>
          </Fill>
          <Slot name="test" />
        </SlotFillRoot>
      );

      expect(getByTestId('test-fill')).to.exist;
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

      const {
        rerender,
        getByTestId,
        queryByTestId
      } = render(<TestComponent shouldRenderFill={ true } />);

      // fill should be present initially
      expect(getByTestId('test-fill')).to.exist;

      // rerender without the fill
      rerender(<TestComponent shouldRenderFill={ false } />);

      // fill should be gone
      expect(queryByTestId('test-fill')).to.not.exist;
    });


    it('should update fill', async function() {
      const TestComponent = () => {
        const [ showBar, setShowBar ] = useState(true);

        return (
          <SlotFillRoot>
            <Fill slot="foo">
              <div>
                <button data-testid="foo">Foo</button>
                { showBar && <button data-testid="bar">Bar</button> }
                <button
                  onClick={ () => setShowBar(false) }
                  data-testid="toggle"
                >
                  Toggle
                </button>
              </div>
            </Fill>
            <Slot name="foo" />
          </SlotFillRoot>
        );
      };

      const {
        queryByTestId
      } = render(<TestComponent />);

      // assume
      expect(queryByTestId('foo')).to.exist;
      expect(queryByTestId('bar')).to.exist;

      // when
      await act(() => userEvent.click(queryByTestId('toggle')));

      // then
      expect(queryByTestId('foo')).to.exist;
      expect(queryByTestId('bar')).not.to.exist;
    });

  });


  describe('<Slot>', function() {

    it('should render fills', async function() {

      // when
      const { getByTestId } = render(
        <SlotFillRoot>
          <Fill slot="foo">
            <div data-testid="fill" />
          </Fill>
          <div data-testid="slot-parent">
            <Slot name="foo" />
          </div>
        </SlotFillRoot>
      );

      // then
      const fill = getByTestId('fill');
      const slot = getByTestId('slot-parent');

      expect(slot.contains(fill)).to.be.true;
    });


    it('should render fills in custom Component', function() {

      // given
      const CustomComponent = sinon.spy(() => null);

      // when
      render(
        <SlotFillRoot>
          <Fill slot="foo" customProp="foo">
            <div data-testid="fill" />
          </Fill>
          <div data-testid="slot-parent">
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
            <div data-testid="fill" id={ id } />
          </Fill>
        ));

        // when
        const { getByTestId, getAllByTestId } = render(
          <SlotFillRoot>
            { unorderedFills }
            <div data-testid="slot-parent">
              <Slot name="foo" />
            </div>
          </SlotFillRoot>
        );

        // then
        const fills = getAllByTestId('fill');
        const slot = getByTestId('slot-parent');

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
        const {
          getAllByTestId,
          getByTestId
        } = render(
          <SlotFillRoot>
            <Fill slot="foo" group="1_a" priority={ -1 }>
              <div data-testid="fill" id="low_priority" />
            </Fill>
            <Fill slot="foo" group="1_a">
              <div data-testid="fill" id="no_priority" />
            </Fill>
            <Fill slot="foo" group="1_a" priority={ 100 }>
              <div data-testid="fill" id="high_priority" />
            </Fill>
            <div data-testid="slot-parent">
              <Slot name="foo" />
            </div>
          </SlotFillRoot>
        );

        // then
        const fills = getAllByTestId('fill');
        const slot = getByTestId('slot-parent');

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
        const {
          getByTestId,
          getAllByTestId
        } = render(
          <SlotFillRoot>
            <Fill slot="foo" name="foo-fill">
              <div data-testid="fill" id="foo" />
            </Fill>
            <Fill slot="foo" name="bar-fill" replaces="foo-fill">
              <div data-testid="fill" id="bar" />
            </Fill>
            <div data-testid="slot-parent">
              <Slot name="foo" />
            </div>
          </SlotFillRoot>
        );

        // then
        const fills = getAllByTestId('fill');
        const slot = getByTestId('slot-parent');

        expect(fills.length).to.eql(1);
        expect(fills.map(fill => fill.id)).to.eql([ 'bar' ]);
        expect(fills.every(fill => slot.contains(fill))).to.be.true;
      });


      it('should not replace', function() {

        // when
        const {
          getByTestId,
          getAllByTestId
        } = render(
          <SlotFillRoot>
            <Fill slot="foo" name="bar-fill" replaces="foo-fill">
              <div data-testid="fill" id="bar" />
            </Fill>
            <div data-testid="slot-parent">
              <Slot name="foo" />
            </div>
          </SlotFillRoot>
        );

        // then
        const fills = getAllByTestId('fill');
        const slot = getByTestId('slot-parent');

        expect(fills.length).to.eql(1);
        expect(fills.map(fill => fill.id)).to.eql([ 'bar' ]);
        expect(fills.every(fill => slot.contains(fill))).to.be.true;
      });


      it('should replace replacement', function() {

        // when
        const {
          getByTestId,
          getAllByTestId
        } = render(
          <SlotFillRoot>
            <Fill slot="foo" name="foo-fill">
              <div data-testid="fill" id="foo" />
            </Fill>
            <Fill slot="foo" name="bar-fill" replaces="foo-fill">
              <div data-testid="fill" id="bar" />
            </Fill>
            <Fill slot="foo" name="baz-fill" replaces="bar-fill">
              <div data-testid="fill" id="baz" />
            </Fill>
            <div data-testid="slot-parent">
              <Slot name="foo" />
            </div>
          </SlotFillRoot>
        );

        // then
        const fills = getAllByTestId('fill');
        const slot = getByTestId('slot-parent');

        expect(fills.length).to.eql(1);
        expect(fills.map(fill => fill.id)).to.eql([ 'baz' ]);
        expect(fills.every(fill => slot.contains(fill))).to.be.true;
      });


      it('should not replace replacement', function() {

        // when
        const {
          getByTestId,
          getAllByTestId
        } = render(
          <SlotFillRoot>
            <Fill slot="foo" name="foo-fill">
              <div data-testid="fill" id="foo" />
            </Fill>
            <Fill slot="foo" name="bar-fill" replaces="foo-fill">
              <div data-testid="fill" id="bar" />
            </Fill>
            <Fill slot="foo" name="baz-fill" replaces="foo-fill">
              <div data-testid="fill" id="baz" />
            </Fill>
            <div data-testid="slot-parent">
              <Slot name="foo" />
            </div>
          </SlotFillRoot>
        );

        // then
        const fills = getAllByTestId('fill');
        const slot = getByTestId('slot-parent');

        expect(fills.length).to.eql(2);
        expect(fills.map(fill => fill.id)).to.eql([ 'bar', 'baz' ]);
        expect(fills.every(fill => slot.contains(fill))).to.be.true;
      });

    });

  });

});
