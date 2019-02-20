/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var chai = require('chai');
var sinonChai = require('sinon-chai');

chai.use(sinonChai);

global.expect = chai.expect;

// node fix

if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(prefix) {
    return this.indexOf(prefix) === 0;
  };
}
