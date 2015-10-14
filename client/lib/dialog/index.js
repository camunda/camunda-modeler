'use strict';

var map = require('lodash/collection/map'),
    assign = require('lodash/object/assign');

var confirmTemplate = require('./confirm.html');

var angular = require('angular');

var ngModule = module.exports = angular.module('app.dialog', [
  require('ng-simple-dialog')
]);

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

      ngSimpleDialog({
        template: confirmTemplate,
        scope: scope
      }).open().on('close', done);
    }
  };

}]);
