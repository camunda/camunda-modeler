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
    expect(schema.properties['app.defaultC8Version'].default).to.equal('8.7.0');
    expect(schema.properties['app.defaultC7Version'].default).to.equal('7.23.0');
  });

});
