/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import History from '../History';


describe('History', function() {

  it('should get', function() {

    // given
    const history = new History([ 1, 2, 3 ], 2);

    // assume
    expectState(history, [ 1, 2, 3 ], 2);

    // when
    const element = history.get();

    // then
    expect(element).to.eql(3);
  });


  describe('push', function() {

    it('should add element', function() {

      // given
      const history = new History();

      // assume
      expectState(history, [], -1);

      // when
      history.push(1);
      history.push(2);
      history.push(3);

      // then
      expectState(history, [ 1, 2, 3 ], 2);
    });


    it('should remove newer history', function() {

      // given
      const history = new History([ 1, 2, 3 ], 1);

      // assume
      expectState(history, [ 1, 2, 3 ], 1);

      // when
      history.push('A');

      // then
      expectState(history, [ 1, 2, 'A' ], 2);
    });

  });


  describe('purge', function() {

    it('should remove element', function() {

      // given
      const history = new History([ 1, 2, 1, 1, 3, 1 ], 5);

      // when
      history.purge(1);

      // then
      expectState(history, [ 2, 3 ], 1);
    });


    it('should remove last element', function() {

      // given
      const history = new History([ 1, 1, 1, 1 ], 2);

      // when
      history.purge(1);

      // then
      expectState(history, [], -1);
    });

  });


  describe('navigate', function() {

    it('should move backwards', function() {

      // given
      const history = new History([ 1, 2, 3 ], 2);

      // when
      const next = history.navigate(-1);

      // then
      expect(next).to.eql(2);

      expectState(history, [ 1, 2, 3 ], 1);
    });


    it('should move backwards with fallback', function() {

      const history = new History([ 1, 2, 3 ], 0);

      // when
      const next = history.navigate(-1, () => 'A');

      // then
      expect(next).to.eql('A');

      expectState(history, [ 'A', 1, 2, 3 ], 0);
    });


    it('should move forwards', function() {

      // given
      const history = new History([ 1, 2, 3 ], 1);

      // when
      history.navigate(1);

      // then
      expectState(history, [ 1, 2, 3 ], 2);
    });


    it('should move forwards with fallback', function() {

      // given
      const history = new History([ 1, 2, 3 ], 2);

      // when
      history.navigate(1, () => 'A');

      // then
      expectState(history, [ 1, 2, 3, 'A' ], 3);
    });

  });


  it('should replace all', function() {

    // given
    const history = new History([ 1, 2, 2 ], 2);

    // when
    history.replace(2, 'A');

    // then
    expectState(history, [ 1, 'A', 'A' ], 2);
  });

});


// helpers //////////////////////////////////////////////

function expectState(history, elements, idx) {
  expect(history.elements).to.eql(elements);
  expect(history.idx).to.eql(idx);
}
