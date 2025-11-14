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

import {
  render,
  fireEvent
} from '@testing-library/react';

import { Overlay } from '..';


describe('<Overlay>', function() {

  it('should render', function() {
    const { overlay } = renderOverlay();

    expect(overlay).to.exist;
  });


  it('should render children', function() {
    const { getByText } = renderOverlay({
      children: <>
        <Overlay.Title><div>{ 'Foo' }</div></Overlay.Title>
        <Overlay.Body>
          <div>
            { 'Test' }
          </div>
        </Overlay.Body>
      </>
    });

    expect(getByText('Foo')).to.exist;
    expect(getByText('Test')).to.exist;
  });


  describe('required props', function() {

    // No way to expect component to throw during render without the test failing (@jarekdanielak)
    it.skip('should require anchor', function() {

      // given
      const consoleErrorStub = sinon.stub(console, 'error');

      // then
      expect(() => {

        // when
        render(<Overlay />);
      }).to.throw().with.property('message').that.includes('Overlay must receive an `anchor` prop.');

      // cleanup
      consoleErrorStub.restore();
    });
  });


  describe('DOM props', function() {

    it('should allow to pass custom class', function() {

      // when
      const { overlay } = renderOverlay({ className: 'custom' });

      // then
      expect(overlay.classList.contains('custom')).to.be.true;
    });


    it('should allow to pass custom id', function() {

      // when
      const { overlay } = renderOverlay({ id: 'custom' });

      // then
      expect(overlay.id).to.equal('custom');
    });


    it('should NOT set id if not provided', function() {

      // when
      const { overlay } = renderOverlay();

      // then
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

    describe(`props#${property}`, function() {

      it(`should specify string (${property}="100vh")`, function() {

        // when
        const { overlay } = renderOverlay({
          className: 'test',
          [property]: '100vh'
        });

        // then
        expectStyle(overlay, {
          [cssProperty]: '100vh'
        });

      });


      it(`should specify (pixel) number (${property}=100)`, function() {

        // when
        const { overlay } = renderOverlay({
          className: 'test',
          [property]: 100
        });

        // then
        expectStyle(overlay, {
          [cssProperty]: '100px'
        });

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
      const { overlay, anchor } = renderOverlay({ offset });

      // then
      expect(boundingRect(overlay).left).to.be.closeTo(boundingRect(anchor).left + offset.left, 5);
    });


    it('should use provided offset { right }', function() {

      // given
      const offset = {
        right: 10
      };

      // when
      const { overlay, anchor } = renderOverlay({ offset, children: 'Content' });

      // then
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
      renderOverlay({ onClose: onCloseSpy });

      // when
      document.dispatchEvent(new MouseEvent('mousedown'));

      // then
      expect(onCloseSpy).to.have.been.called;
    });


    it('should NOT call onClose for click inside the overlay', function() {

      // given
      const { getByRole } = renderOverlay({
        onClose: onCloseSpy,
        children: <Overlay.Body>
          <button id="button" />
        </Overlay.Body>
      });

      // when
      const button = getByRole('button');
      fireEvent.click(button);

      // then
      expect(onCloseSpy).to.not.be.called;
    });


    it('should NOT call onClose for clicking the anchor', function() {

      // given
      const { anchor } = renderOverlay({
        onClose: onCloseSpy,
        children: <Overlay.Body>
          <button id="button" />
        </Overlay.Body>
      });

      // when
      anchor.dispatchEvent(new MouseEvent('mousedown'));

      // then
      expect(onCloseSpy).to.not.be.called;
    });

  });


  describe('focus handling', function() {


    it('should correctly handle autofocus', function() {

      // given
      const { getByTestId } = renderOverlay({
        children: <Overlay.Body>
          <input data-testid="input" autoFocus />
        </Overlay.Body>
      });

      const input = getByTestId('input');

      // then
      expect(document.activeElement).to.eql(input);

    });

  });


  describe('<Overlay.Title>', function() {

    it('should render', function() {
      const { container } = render(<Overlay.Title />);

      expect(container.querySelector('.overlay__title')).to.exist;
    });


    it('should render with custom props', function() {

      // given
      const onClickSpy = sinon.spy();

      // when
      const { container } = render(<Overlay.Title className="foo" onClick={ onClickSpy } />);

      const title = container.querySelector('.foo');
      fireEvent.click(title);

      // then
      expect(title.classList.contains('foo')).to.be.true;
      expect(onClickSpy).to.have.been.called;
    });

  });


  describe('<Overlay.Body>', function() {

    it('should render', function() {
      const { container } = render(<Overlay.Body />);

      expect(container.querySelector('.overlay__body')).to.exist;
    });


    it('should render with custom props', function() {

      // given
      const onClickSpy = sinon.spy();

      // when
      const { container } = render(<Overlay.Body className="foo" onClick={ onClickSpy } />);

      const body = container.querySelector('.foo');
      fireEvent.click(body);

      // then
      expect(body.classList.contains('foo')).to.be.true;
      expect(onClickSpy).to.have.been.called;
    });

  });


  describe('<Overlay.Footer>', function() {

    it('should render', function() {
      const { container } = render(<Overlay.Footer />);

      expect(container.querySelector('.overlay__footer')).to.exist;
    });


    it('should render with custom props', function() {

      // given
      const onClickSpy = sinon.spy();

      // when
      const { container } = render(<Overlay.Footer className="foo" onClick={ onClickSpy } />);

      const footer = container.querySelector('.foo');
      fireEvent.click(footer);

      // then
      expect(footer.classList.contains('foo')).to.be.true;
      expect(onClickSpy).to.have.been.called;
    });

  });

});


// helper ///////////////////

function renderOverlay({ children, ...props } = {}) {

  const anchor = document.createElement('button');
  anchor.setAttribute('data-testid', 'anchor');

  const rendered = render(<Overlay anchor={ anchor } { ...props }>{ children }</Overlay>);

  const overlay = rendered.getByRole('dialog');

  return {
    anchor,
    overlay,
    ...rendered
  };
}

function boundingRect(domNode) {
  return domNode.getBoundingClientRect();
}

function expectStyle(overlay, expectedStyle) {
  Object.entries(expectedStyle).forEach(([ key, value ]) => {
    if (key.startsWith('--')) {
      expect(overlay.style.getPropertyValue(key)).to.equal(value);
    } else {
      expect(overlay.style[key]).to.equal(value);
    }
  });
}

function camelCaseToDash(str) {
  return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
}
