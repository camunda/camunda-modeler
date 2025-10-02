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

import TestContainer from 'mocha-test-container-support';

import {
  fireEvent,
  render
} from '@testing-library/react';

import { Overlay } from '..';


describe('<Overlay>', function() {

  let anchor;

  beforeEach(function() {
    anchor = document.createElement('button');
    anchor.textContent = 'Anchor';

    const testContainer = TestContainer.get(this);

    testContainer.appendChild(anchor);
  });

  it('should render', function() {
    render(<Overlay anchor={ anchor } />);
  });


  it('should render children', async function() {
    const { findByTestId } = render((
      <Overlay anchor={ anchor }>
        <Overlay.Title><div data-testid="title">Foo</div></Overlay.Title>
        <Overlay.Body>
          <div data-testid="body">
            Test
          </div>
        </Overlay.Body>
      </Overlay>
    ));

    expect(await findByTestId('title')).to.exist;
    expect(await findByTestId('body')).to.exist;
  });


  describe('DOM props', function() {

    it('should allow to pass custom class', function() {

      // when
      render(<Overlay anchor={ anchor } className="custom" />);

      // then
      expect(document.querySelector('.custom'), 'Class is not set').to.exist;
    });


    it('should allow to pass custom id', function() {

      // when
      render(<Overlay anchor={ anchor } data-testid="custom" id="custom" />);

      // then
      expect(document.querySelector('#custom'), 'Id is not set').to.exist;
    });


    it('should NOT set id if not provided', function() {

      // when
      render(<Overlay anchor={ anchor } />);

      // then
      const overlay = document.body.querySelector('[role="dialog"]');
      expect(overlay.id).to.eql('');
    });
  });


  [
    'maxHeight',
    'maxWidth',
    'minHeight',
    'minWidth'
  ].forEach(function(property) {

    const cssProperty = `--overlay-${camelCaseToDash(property)}`;

    function createOverlay(props = {}) {
      const {
        maxHeight,
        maxWidth,
        minHeight,
        minWidth
      } = props;

      return render(
        <Overlay
          className="test"
          anchor={ anchor }
          maxHeight={ maxHeight }
          maxWidth={ maxWidth }
          minHeight={ minHeight }
          minWidth={ minWidth }
        />);
    }

    describe(`props#${property}`, function() {

      it(`should specify string (${property}="100vh")`, async function() {

        // when
        createOverlay({ [property]: '100vh' });

        // then
        const overlay = document.body.querySelector('[role="dialog"]');
        const computedStyle = window.getComputedStyle(overlay);
        expect(computedStyle.getPropertyValue(cssProperty)).to.equal('100vh');
      });


      it(`should specify (pixel) number (${property}=100)`, async function() {

        // when
        createOverlay({ [property]: 100 });

        // then
        const overlay = document.body.querySelector('[role="dialog"]');
        const computedStyle = window.getComputedStyle(overlay);
        expect(computedStyle.getPropertyValue(cssProperty)).to.equal('100px');

      });

    });

  });


  describe('props#offset', function() {

    it('should use provided offset { left }', function() {

      // given
      const offset = {
        left: 100
      };

      // when
      render(<Overlay anchor={ anchor } offset={ offset } />);

      // then
      const overlay = document.body.querySelector('[role="dialog"]');

      expect(boundingRect(overlay).left).to.be.closeTo(boundingRect(anchor).left + offset.left, 5);
    });


    it('should use provided offset { right }', function() {

      // given
      const offset = {
        right: 10
      };

      // when
      render(
        <Overlay anchor={ anchor } offset={ offset }>
          Content
        </Overlay>
      );

      // then
      const overlay = document.body.querySelector('[role="dialog"]');
      const overlayRect = boundingRect(overlay);
      const anchorRect = boundingRect(anchor);

      expect(overlayRect.right).to.be.closeTo(anchorRect.right + offset.right, 5);
    });

  });


  describe('onClose handling', function() {

    let onCloseSpy;

    beforeEach(function() {
      onCloseSpy = sinon.spy();
    });


    it('should call onClose for background click', function() {

      // given
      render(<Overlay anchor={ anchor } onClose={ onCloseSpy } />);

      // when
      TestContainer.get(this).dispatchEvent(new MouseEvent('mousedown'));

      // then
      expect(onCloseSpy).to.have.been.called;
    });


    it('should NOT call onClose for click inside the overlay', async function() {

      // given
      const { findByTestId } = render(<Overlay anchor={ anchor } onClose={ onCloseSpy }>
        <Overlay.Body>
          <button data-testid="button">Click me</button>
        </Overlay.Body>
      </Overlay>);

      // when
      fireEvent.click(await findByTestId('button'));

      // then
      expect(onCloseSpy).to.not.be.called;
    });


    it('should NOT call onClose for clicking the anchor', function() {

      // given
      render(<Overlay anchor={ anchor } onClose={ onCloseSpy }>
        <Overlay.Body>
          <button id="button">Click me</button>
        </Overlay.Body>
      </Overlay>);

      // when
      anchor.dispatchEvent(new MouseEvent('mousedown'));

      // then
      expect(onCloseSpy).to.not.be.called;
    });

  });


  describe('focus handling', function() {

    it('should correctly handle autofocus', async function() {

      // given
      const { findByTestId } = render(<Overlay anchor={ anchor }>
        <Overlay.Body>
          <input data-testid="input" autoFocus />
        </Overlay.Body>
      </Overlay>);

      const input = await findByTestId('input');

      // then
      expect(document.activeElement).to.eql(input);

    });

  });


  describe('<Overlay.Title>', function() {

    it('should render', function() {
      render(<Overlay.Title />);
    });


    it('should render with custom props', async function() {

      // given
      const onClickSpy = sinon.spy();

      // when
      const { findByTestId } = render(<Overlay.Title className="foo" data-testid="title" onClick={ onClickSpy } />);

      fireEvent.click(await findByTestId('title'));

      // then
      expect(document.body.querySelector('.foo')).to.exist;
      expect(onClickSpy).to.have.been.called;
    });

  });


  describe('<Overlay.Body>', function() {

    it('should render', function() {
      render(<Overlay.Body />);
    });


    it('should render with custom props', async function() {

      // given
      const onClickSpy = sinon.spy();

      // when
      const { findByTestId } = render(<Overlay.Body className="foo" data-testid="body" onClick={ onClickSpy } />);

      fireEvent.click(await findByTestId('body'));

      // then
      expect(document.body.querySelector('.foo')).to.exist;
      expect(onClickSpy).to.have.been.called;
    });

  });


  describe('<Overlay.Footer>', function() {

    it('should render', function() {
      render(<Overlay.Footer />);
    });


    it('should render with custom props', async function() {

      // given
      const onClickSpy = sinon.spy();

      // when
      const { findByTestId } = render(<Overlay.Footer className="foo" data-testid="footer" onClick={ onClickSpy } />);

      fireEvent.click(await findByTestId('footer'));

      // then
      expect(document.body.querySelector('.foo')).to.exist;
      expect(onClickSpy).to.have.been.called;
    });

  });

});


// helper ///////////////////

function boundingRect(domNode) {
  return domNode.getBoundingClientRect();
}

function camelCaseToDash(str) {
  return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
}
