// expose jquery to window
window.jQuery = require('jquery');

var angular = require('angular');

var ngModule = module.exports = angular.module('app', [
  require('./dialog').name,
  require('./editor').name
]);
