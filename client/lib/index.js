// expose jquery to window
'use strict';

window.jQuery = require('jquery');

var angular = require('angular');

module.exports = angular.module('app', [
  require('./editor').name
]);