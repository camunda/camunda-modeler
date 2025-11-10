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

import { render, fireEvent } from '@testing-library/react';

import Notification from '../Notification';


describe('<Notification>', function() {

  it('should render', function() {
    render(<Notification />);
  });


  describe('duration', function() {

    let clock;

    before(function() {
      clock = sinon.useFakeTimers();
    });

    after(function() {
      clock.restore();
    });


    it('should close automatically when <duration> is set', function() {

      // given
      const closeSpy = sinon.spy();

      render(<Notification duration={ 1000 } close={ closeSpy } />);

      // when
      clock.tick(1000);

      // then
      expect(closeSpy).to.have.been.calledOnce;
    });


    it('should handle <duration> changes', function() {

      // given
      const closeSpy = sinon.spy();

      const { rerender } = render(<Notification duration={ 1000 } close={ closeSpy } />);

      // when
      rerender(<Notification duration={ 2000 } close={ closeSpy } />);

      clock.tick(1000);

      // then
      expect(closeSpy).to.have.not.been.called;

      // when
      clock.tick(1000);

      // then
      expect(closeSpy).to.have.been.calledOnce;
    });


    it('should NOT close automatically when <duration> is NOT set', function() {

      // given
      const closeSpy = sinon.spy();

      render(<Notification close={ closeSpy } />);

      // when
      clock.tick(10000);

      // then
      expect(closeSpy).to.have.not.been.called;
    });


    it('should close on action button click', function() {

      // given
      const content = <button onClick={ ()=>{} }>iu</button>;

      const closeSpy = sinon.spy();

      const { getByRole } = render(<Notification close={ closeSpy } content={ content } />);
      const button = getByRole('button');

      // when
      fireEvent.click(button);

      // then
      expect(closeSpy).to.have.been.calledOnce;
    });
  });


  describe('error boundary', function() {

    it.skip('should close notification if it throws', function() {

      // given
      const Content = () => {
        throw new Error('Test error');
      };

      const closeSpy = sinon.spy();

      // when
      render(<Notification close={ closeSpy } content={ <Content /> } />);

      // then
      expect(closeSpy).to.have.been.calledOnce;
    });

  });

});
