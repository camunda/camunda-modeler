// expose jquery to window
'use strict';

window.jQuery = require('jquery');

var angular = require('angular');

var browser = require('./util/browser');

var ngModule = module.exports = angular.module('app', [
  require('./editor').name
]);

/**
 * We need to bootstrap angular manually in order to correctly
 * initialized the menus with right menus enabled/disabled
 */
browser.on('editor-bootstrap', function() {
  angular.bootstrap(document, ['app']);
});
