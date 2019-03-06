/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const path = require('path');

const Flags = require('../flags');


describe('flags', function() {

  it('should instantiate', function() {

    // when
    const flags = new Flags({
      paths: [
        absPath('flags/1'),
        absPath('flags/2')
      ],
      overrides: {
        TWO: 'overridden'
      }
    });


    // then
    expect(flags.getAll()).to.eql({
      ONE: true,
      TWO: 'overridden'
    });

  });

});


function absPath(file) {
  return path.resolve(__dirname, file);
}