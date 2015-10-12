'use strict';

var map = require('lodash/collection/map'),
    assign = require('lodash/object/assign');

var angular = require('angular');


var ngModule = module.exports = angular.module('app.dialog', [
  require('ng-simple-dialog')
]);

// var confirmTemplate = fs.readFile('./confirm.html', { encoding: 'utf8' });


ngModule.factory('dialog', [ 'ngSimpleDialog', function(ngSimpleDialog) {

  return {
    confirm: function(message, choices, done) {

      var buttons = map(choices, function(val, key) {
        return assign({}, val, { key: key });
      });

      var scope = {
        message: message,
        buttons: buttons
      };

      var dialog = ngSimpleDialog({
        template: './confirm.html',
        scope: scope
      }).open().on('close', done);
    }
  };

}]);
