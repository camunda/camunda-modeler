/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import DmnModeler from '../modeler';


describe('DmnModeler', function() {

  it('should bootstrap', function() {

    // when
    const modeler = new DmnModeler();

    // when
    expect(modeler).to.exist;
  });


  it('#getStackIdx', function() {

    // when
    const modeler = new DmnModeler();

    // when
    expect(modeler.getStackIdx()).to.equal(-1);
  });

});