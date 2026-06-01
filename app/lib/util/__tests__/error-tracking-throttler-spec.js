/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const { createThrottler } = require('../error-tracking-throttler');


describe('util - error-tracking-throttler', function() {

  describe('#createThrottler', function() {

    it('should pass through a single event', function() {

      // given
      const throttle = createThrottler();
      const event = makeEvent('TypeError', 'foo');

      // when
      const result = throttle(event);

      // then
      expect(result).to.equal(event);
    });


    it('should cap the same signature at 5 events per session', function() {

      // given
      const throttle = createThrottler();
      const make = () => makeEvent('TypeError', 'foo');

      // when
      const results = [ 1, 2, 3, 4, 5, 6, 7 ].map(() => throttle(make()));

      // then
      expect(results.slice(0, 5)).to.not.include(null);
      expect(results.slice(5)).to.deep.equal([ null, null ]);
    });


    it('should track distinct signatures independently', function() {

      // given
      const throttle = createThrottler();
      [ 1, 2, 3, 4, 5 ].forEach(() => throttle(makeEvent('TypeError', 'foo')));

      // when
      const result = throttle(makeEvent('TypeError', 'bar'));

      // then
      expect(result).to.not.be.null;
    });


    it('should cap React render-loop signatures at 1 event per session', function() {

      // given
      const throttle = createThrottler();
      const make = () => makeEvent('Error', 'Maximum update depth exceeded. This can happen when...');

      // when
      const first = throttle(make());
      const second = throttle(make());

      // then
      expect(first).to.not.be.null;
      expect(second).to.be.null;
    });


    it('should fall back to event.message when no exception values present', function() {

      // given
      const throttle = createThrottler();
      const make = () => ({ message: 'Maximum update depth exceeded' });

      // when
      const first = throttle(make());
      const second = throttle(make());

      // then
      expect(first).to.not.be.null;
      expect(second).to.be.null;
    });
  });
});


function makeEvent(type, value) {
  return {
    exception: {
      values: [ { type, value } ]
    }
  };
}
