'use strict';

var angular = require('angular');

var $ = angular.element;

function isButton(element) {
  return !!$(element).parents('button').length;
}

module.exports = function() {

  return {
    restrict: 'A',
    scope: {},
    link: function(scope, element) {

      function closeDropDown() {
        element.removeClass('active');
      }

      element.click(function(e) {

        if (isButton(e.target)) {
          return;
        }

        if (element.is('.active')) {
          $(document.body).off('click', closeDropDown);
        } else {
          $(document.body).on('click', closeDropDown);
        }

        element.toggleClass('active');

        e.stopPropagation();
      });
    }
  };
};