'use strict';

var angular = require('angular');

var $ = angular.element;

function isButton(element) {
  return !!$(element).parents('button').length;
}

module.exports = function() {
  return {
    restrict: 'A',
    link: function(scope, element) {

      // NOTE: THIS IS FOR ADDING THE ACTIVE STATE ONLZ
      element.on("mouseenter", "li", function() {
        console.log("mouse enter", this);
        $(this).addClass("active");
      });

      element.on("mouseleave", "li", function() {
        console.log("mouse leave", this);
        $(this).removeClass("active");
      });
      // END NOTE

      element.on("mouseup", "li", function(event) {
        console.log("data-action", action);

        var action = $(this).attr("data-action");

        scope.$eval(action, { event: event });

        close();
      });

      function open() {
        $(document.body).on('mouseup', checkClose);
        element.addClass("active");
      }

      function close() {
        element.removeClass('active');
        $(document.body).off("mouseup", checkClose);
      }

      function checkClose(event) {
        var target = $(event.target);

        var insideDropDown = $(target).is("[dropdown]") || $(target).parents("[dropdown]").length;

        if (insideDropDown) {
          return;
        }

        close();
      }

      element.on("mousedown", function(e) {
        if (isButton(e.target)) {
          return;
        }

        if (!element.is('.active')) {
          open();
        } else if (!$(e.target).is("li")) {
          close();
        }
      });
    }
  };
};
