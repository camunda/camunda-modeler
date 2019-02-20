/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* global sinon */

import { Cache } from '..';

const spy = sinon.spy;


describe('Cache', function() {

  let cache;

  beforeEach(function() {
    cache = new Cache();
  });


  it('#get', function() {

    // given
    cache.add('foo', 'foo');

    // when
    const result = cache.get('foo');

    // then
    expect(result).to.equal('foo');
  });


  it('#add', function() {

    // when
    cache.add('foo', 'foo');

    // then
    expect(cache.get('foo')).to.equal('foo');
  });


  it('#destroy', function() {

    // given
    const destroySpy = spy();

    cache.add('foo', {
      foo: 'foo',
      __destroy: destroySpy
    });

    // when
    cache.destroy('foo');

    // then
    expect(cache.get('foo')).not.to.exist;

    expect(destroySpy).to.have.been.called;
  });

});