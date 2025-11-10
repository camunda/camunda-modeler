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

      const { getByLabelText } = render(<Modal onClose={ () => {} } />);

      expect(getByLabelText('Close')).to.exist;
    });


    it('should not render close icon if onClose not set', function() {

      const { queryByLabelText } = render(<Modal />);

      expect(queryByLabelText('Close')).to.not.exist;
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


  describe('<Modal.Title>', function() {

    it('should render', function() {
      const { container } = render(<Modal.Title />);

      expect(container.querySelector('.modal-header')).to.exist;
    });


    it('should render with custom props', function() {

      // given
      const onClickSpy = sinon.spy();

      // when
      const { container } = render(<Modal.Title className="foo" onClick={ onClickSpy } />);

      const header = container.querySelector('.modal-header');
      fireEvent.click(header);

      // then
      expect(header.classList.contains('foo')).to.be.true;
      expect(onClickSpy).to.have.been.called;
    });

  });


  describe('<Modal.Body>', function() {

    it('should render', function() {
      const { container } = render(<Modal.Body />);

      expect(container.querySelector('.modal-body')).to.exist;
    });


    it('should render with custom props', function() {

      // given
      const onClickSpy = sinon.spy();

      // when
      const { container } = render(<Modal.Body className="foo" onClick={ onClickSpy } />);

      const body = container.querySelector('.modal-body');
      fireEvent.click(body);

      // then
      expect(body.classList.contains('foo')).to.be.true;
      expect(onClickSpy).to.have.been.called;
    });

  });


  describe('<Modal.Footer>', function() {

    it('should render', function() {
      const { container } = render(<Modal.Footer />);

      expect(container.querySelector('.modal-footer')).to.exist;
    });


    it('should render with custom props', function() {

      // given
      const onClickSpy = sinon.spy();

      // when
      const { container } = render(<Modal.Footer className="foo" onClick={ onClickSpy } />);

      const footer = container.querySelector('.modal-footer');
      fireEvent.click(footer);

      // then
      expect(footer.classList.contains('foo')).to.be.true;
      expect(onClickSpy).to.have.been.called;
    });

  });

});
