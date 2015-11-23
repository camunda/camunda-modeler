// expose jquery to window
'use strict';

window.jQuery = require('jquery');

var angular = require('angular');

var ngModule = module.exports = angular.module('app', [
  require('./editor').name,
  require('./menu-bar').name
]);


// emit an event to show the backend
// we are ready to receive events

var browser = require('./util/browser');

ngModule.run(function() {
  setTimeout(function() {
    browser.send('editor.ready');
  }, 100);
});