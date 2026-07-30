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

import { render } from '@testing-library/react';

import PluginParent from '../PluginParent';


describe('<PluginParent>', function() {

  it('should render', function() {
    render(<PluginParent />);
  });


  it('should cancel subscriptions when unmounted', function() {

    // given
    const cancelSubscriptionsSpy = sinon.spy();
    const { unmount } = render(
      <PluginParent cancelSubscriptions={ cancelSubscriptionsSpy } />
    );

    // when
    unmount();

    // then
    expect(cancelSubscriptionsSpy).to.have.been.calledOnce;
  });


  describe('as error boundary', function() {

    function ErrorComponent() {
      throw new Error('error');
    }


    it('should work as an error boundary', function() {

      // when
      const { container } = render(
        <PluginParent>
          <ErrorComponent />
        </PluginParent>
      );

      // then
      expect(container).to.exist;
    });


    it('should correctly report the error', function() {

      // given
      const onErrorSpy = sinon.spy();

      // when
      const { container } = render(
        <PluginParent onError={ onErrorSpy }>
          <ErrorComponent />
        </PluginParent>
      );

      // then
      expect(container).to.exist;
      expect(onErrorSpy).to.have.been.calledOnce;
    });


    it('should cancel subscriptions on error', function() {

      // given
      const cancelSubscriptionsSpy = sinon.spy();

      // when
      const { container } = render(
        <PluginParent cancelSubscriptions={ cancelSubscriptionsSpy }>
          <ErrorComponent />
        </PluginParent>
      );

      // then
      expect(container).to.exist;
      expect(cancelSubscriptionsSpy).to.have.been.calledOnce;
    });

  });

});
