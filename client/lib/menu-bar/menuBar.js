'use strict';

var menuBarTemplate = require('./menuBar.html');

module.exports = function() {

  return {
    scope: {
      editor: '='
    },
    replace: true,
    template: menuBarTemplate
  };
};