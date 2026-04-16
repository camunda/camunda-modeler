/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { schema } from '../useBuiltInSettings';


describe('useBuiltInSettings', function() {

  it('should use latest stable versions', function() {

    // then
    expect(schema.properties['app.defaultC8Version'].default).to.equal('8.9.0');
    expect(schema.properties['app.defaultC7Version'].default).to.equal('7.24.0');
  });

  it('should include alpha version in C8 engine options', function() {

    // when
    const [ firstOption ] = schema.properties['app.defaultC8Version'].options;

    // then
    expect(firstOption).to.eql({
      label: '8.10 (alpha)',
      value: '8.10.0'
    });
  });

});
