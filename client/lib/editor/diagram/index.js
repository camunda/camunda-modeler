var angular = require('angular');

var ngModule = module.exports = angular.module('app.editor.diagram', []);

ngModule.directive('diagram', require('./directive'));