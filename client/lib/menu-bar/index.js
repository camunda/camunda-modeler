var angular = require('angular');

var ngModule = module.exports = angular.module('app.menu-bar', []);

ngModule.directive('menuBar', require('./menuBar'));

ngModule.directive('dropdown', require('./dropdown'));
