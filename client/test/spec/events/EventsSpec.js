import React from 'react';

import TestRenderer from 'react-test-renderer';

import {
  EventListener,
  EventsContext
} from '../../../src/app/events';

/* global sinon */


describe('events', function() {

  it('should add event listener', function() {
    var spy = sinon.spy();

    // when
    TestRenderer.create(<EventListener event="foo" handler={ spy } />);

    var eventBus = EventsContext.Consumer._currentValue;

    eventBus.fire('foo');

    // then
    expect(spy).to.have.been.called;
  });

  
  it('should remove event listener', function() {
    var spy = sinon.spy();

    var testRenderer = TestRenderer.create(<EventListener event="foo" handler={ spy } />);

    // when
    testRenderer.unmount();

    var eventBus = EventsContext.Consumer._currentValue;

    eventBus.fire('foo');

    // then
    expect(spy).to.not.have.been.called;
  });

});