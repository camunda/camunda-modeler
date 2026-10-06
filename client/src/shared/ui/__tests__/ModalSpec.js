/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';

import React from 'react';

import {
  render,
  fireEvent
} from '@testing-library/react';

import { Modal } from '..';


describe('<Modal>', function() {

  it('should render', function() {
    const { getByRole } = render(<Modal />);

    expect(getByRole('dialog')).to.exist;
  });


  it('should render children', function() {
    const { getByText } = render((
      <Modal>
        <Modal.Title><div>{ 'Foo' }</div></Modal.Title>
        <Modal.Body>
          <div>
            { 'Test' }
          </div>
        </Modal.Body>
      </Modal>
    ));

    expect(getByText('Foo')).to.exist;
    expect(getByText('Test')).to.exist;
  });


  describe('onClose parameter', function() {

    it('should render close icon if onClose existent', function() {

      const { getByRole } = render(<Modal onClose={ () => {} } />);

      expect(getByRole('button', { name: 'Close' })).to.exist;
    });


    it('should not render close icon if onClose not set', function() {

      const { queryByRole } = render(<Modal />);

      expect(queryByRole('button', { name: 'Close' })).to.not.exist;
    });
  });


  describe('onClose handling', function() {

    let onCloseSpy;

    beforeEach(function() {
      onCloseSpy = sinon.spy();
    });


    it('should NOT invoke passed onClose prop for background click', function() {

      // given
      const { getByRole } = render(<Modal onClose={ onCloseSpy } />);

      // when
      const modal = getByRole('dialog');
      fireEvent.click(modal);

      // then
      expect(onCloseSpy).to.not.be.called;
    });


    it('should NOT invoke passed onClose prop for click on modal container', function() {

      // given
      const { getByTestId } = render(<Modal onClose={ onCloseSpy }>
        <Modal.Body>
          <button data-testid="button" />
        </Modal.Body>
      </Modal>);

      // when
      const button = getByTestId('button');
      fireEvent.click(button);

      // then
      expect(onCloseSpy).to.not.be.called;
    });


    it('should invoke passed onClose prop on Escape', function() {

      // given
      const { getByRole } = render(<Modal onClose={ onCloseSpy } />);

      // when
      fireEvent.keyDown(getByRole('dialog'), { key: 'Escape' });

      // then
      expect(onCloseSpy).to.have.been.calledOnce;
    });


    it('should invoke passed onClose prop on close button click', function() {

      // given
      const { getByRole } = render(<Modal onClose={ onCloseSpy } />);

      // when
      fireEvent.click(getByRole('button', { name: 'Close' }));

      // then
      expect(onCloseSpy).to.have.been.calledOnce;
    });

  });


  describe('nested modals', function() {

    it('should close only the topmost modal on Escape', function() {

      // given
      const outerClose = sinon.spy();
      const innerClose = sinon.spy();

      const { rerender } = render(<Modal onClose={ outerClose } />);

      rerender(<>
        <Modal onClose={ outerClose } />
        <Modal onClose={ innerClose } />
      </>);

      // when
      fireEvent.keyDown(document, { key: 'Escape' });

      // then
      expect(innerClose).to.have.been.calledOnce;
      expect(outerClose).not.to.have.been.called;

      // when
      rerender(<Modal onClose={ outerClose } />);
      fireEvent.keyDown(document, { key: 'Escape' });

      // then
      expect(outerClose).to.have.been.calledOnce;
    });


    it('should keep focus in the topmost modal', function() {

      // given
      const { rerender, getByTestId } = render(<Modal>
        <input data-testid="outer" />
      </Modal>);

      rerender(<>
        <Modal>
          <input data-testid="outer" />
        </Modal>
        <Modal>
          <input data-testid="inner-1" />
          <input data-testid="inner-2" />
        </Modal>
      </>);

      const inner1 = getByTestId('inner-1');
      const inner2 = getByTestId('inner-2');

      inner1.focus();

      // when
      fireEvent.keyDown(document, { key: 'Tab' });
      inner2.focus();

      // then
      expect(document.activeElement).to.equal(inner2);
    });

  });


  describe('focus handling', function() {

    it('should correctly handle autofocus', function() {

      // given
      const { getByTestId } = render(<Modal>
        <Modal.Body>
          <input data-testid="input" autoFocus />
        </Modal.Body>
      </Modal>);

      const input = getByTestId('input');

      // then
      expect(document.activeElement).to.eql(input);
    });

  });


  it('should not submit an enclosing form', function() {

    // given
    const outerSubmit = sinon.spy();
    const innerSubmit = sinon.spy(event => event.preventDefault());

    const { getByRole } = render(<form onSubmit={ outerSubmit }>
      <Modal>
        <form onSubmit={ innerSubmit }>
          <button type="submit">Submit</button>
        </form>
      </Modal>
    </form>);

    // when
    fireEvent.submit(getByRole('button', { name: 'Submit' }).closest('form'));

    // then
    expect(innerSubmit).to.have.been.calledOnce;
    expect(outerSubmit).not.to.have.been.called;
  });


  describe('<Modal.Title>', function() {

    it('should render', function() {
      render(<Modal><Modal.Title /></Modal>);

      expect(document.querySelector('[data-slot="dialog-header"]')).to.exist;
    });


    it('should render with custom props', function() {

      // given
      const onClickSpy = sinon.spy();

      // when
      render(<Modal><Modal.Title className="foo" onClick={ onClickSpy } /></Modal>);

      const header = document.querySelector('[data-slot="dialog-header"]');
      fireEvent.click(header);

      // then
      expect(header.classList.contains('foo')).to.be.true;
      expect(onClickSpy).to.have.been.called;
    });

  });


  describe('<Modal.Body>', function() {

    it('should render', function() {
      const { container } = render(<Modal.Body />);

      expect(container.querySelector('[data-slot="dialog-body"]')).to.exist;
    });


    it('should render with custom props', function() {

      // given
      const onClickSpy = sinon.spy();

      // when
      const { container } = render(<Modal.Body className="foo" onClick={ onClickSpy } />);

      const body = container.querySelector('[data-slot="dialog-body"]');
      fireEvent.click(body);

      // then
      expect(body.classList.contains('foo')).to.be.true;
      expect(onClickSpy).to.have.been.called;
    });

  });


  describe('<Modal.Footer>', function() {

    it('should render', function() {
      const { container } = render(<Modal.Footer />);

      expect(container.querySelector('[data-slot="dialog-footer"]')).to.exist;
    });


    it('should render with custom props', function() {

      // given
      const onClickSpy = sinon.spy();

      // when
      const { container } = render(<Modal.Footer className="foo" onClick={ onClickSpy } />);

      const footer = container.querySelector('[data-slot="dialog-footer"]');
      fireEvent.click(footer);

      // then
      expect(footer.classList.contains('foo')).to.be.true;
      expect(onClickSpy).to.have.been.called;
    });

  });

});
