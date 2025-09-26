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
  fireEvent,
  render
} from '@testing-library/react';

import { Modal } from '..';


describe('<Modal>', function() {

  it('should render', function() {
    render(<Modal />);
  });


  it('should render children', async function() {

    // when
    const { findByTestId } = render((
      <Modal>
        <Modal.Title><div data-testid="title">Foo</div></Modal.Title>
        <Modal.Body>
          <div data-testid="body">
            Test
          </div>
        </Modal.Body>
      </Modal>
    ));

    // then
    expect(await findByTestId('title')).to.exist;
    expect(await findByTestId('body')).to.exist;
  });


  describe('onClose parameter', function() {

    it('should render close icon if onClose existent', function() {

      // when
      render(<Modal onClose={ () => {} } />);

      // then
      expect(document.body.querySelectorAll('.close')).to.have.lengthOf(1);
    });


    it('should not render close icon if onClose not set', function() {

      // when
      render(<Modal />);

      // then
      expect(document.body.querySelectorAll('.close')).to.have.lengthOf(0);
    });
  });


  describe('onClose handling', function() {

    let onCloseSpy;

    beforeEach(function() {
      onCloseSpy = sinon.spy();
    });


    it('should NOT invoke passed onClose prop for background click', function() {

      // given
      const { container } = render(<Modal onClose={ onCloseSpy } />);

      // when
      fireEvent.click(container);

      // then
      expect(onCloseSpy).to.not.be.called;
    });


    it('should NOT invoke passed onClose prop for click on modal container', async function() {

      // given
      const { findByTestId } = render(<Modal onClose={ onCloseSpy }>
        <Modal.Body>
          <button data-testid="button">test</button>
        </Modal.Body>
      </Modal>);

      // when
      fireEvent.click(await findByTestId('button'));

      // then
      expect(onCloseSpy).to.not.be.called;
    });

  });


  describe('focus handling', function() {

    it('should correctly handle autofocus', async function() {

      // given
      const { findByTestId } = render(<Modal>
        <Modal.Body>
          <input data-testid="input" autoFocus />
        </Modal.Body>
      </Modal>);

      const input = await findByTestId('input');

      // then
      expect(document.activeElement).to.eql(input);

    });

  });


  describe('<Modal.Title>', function() {

    it('should render', function() {
      render(<Modal.Title />);
    });


    it('should render with custom props', function() {

      // given
      const onClickSpy = sinon.spy();

      // when
      const { container } = render(<Modal.Title className="foo" onClick={ onClickSpy } />);
      fireEvent.click(container.firstChild);

      // then
      expect(onClickSpy).to.have.been.called;
      expect(container.firstChild.classList.contains('foo')).to.be.true;
    });

  });


  describe('<Modal.Body>', function() {

    it('should render', function() {
      render(<Modal.Body />);
    });


    it('should render with custom props', function() {

      // given
      const onClickSpy = sinon.spy();

      // when
      const { container } = render(<Modal.Body className="foo" onClick={ onClickSpy } />);

      fireEvent.click(container.firstChild);

      // then
      expect(container.firstChild.classList.contains('foo')).to.be.true;
      expect(onClickSpy).to.have.been.called;
    });

  });


  describe('<Modal.Footer>', function() {

    it('should render', function() {
      render(<Modal.Footer />);
    });


    it('should render with custom props', function() {

      // given
      const onClickSpy = sinon.spy();

      // when
      const { container } = render(<Modal.Footer className="foo" onClick={ onClickSpy } />);

      fireEvent.click(container.firstChild);

      // then
      expect(container.firstChild.classList.contains('foo')).to.be.true;
      expect(onClickSpy).to.have.been.called;
    });

  });

});
