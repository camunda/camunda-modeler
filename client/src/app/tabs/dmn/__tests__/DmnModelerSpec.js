/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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