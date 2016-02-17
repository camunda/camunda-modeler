'use strict';

var chai = require('chai');

global.expect = chai.expect;


// node fix

if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(prefix) {
    return this.indexOf(prefix) === 0;
  };
}