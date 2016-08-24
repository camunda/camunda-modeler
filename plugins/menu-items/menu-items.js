'use strict';

module.exports = function(electronApp, menuState) {
  return [{
    label: 'Only work in CMMN! 👹',
    accelerator: 'CommandOrControl+[',
    enabled: function() {
      return menuState.cmmn;
    },
    action: function() {
      var shell = require('electron').shell;
      shell.openExternal('https://docs.camunda.org/get-started/cmmn11/');
    }
  }, {
    label: 'Cool Stuff! 👾',
    accelerator: 'CommandOrControl+]',
    enabled: function() {
      return true;
    },
    action: function() {
      electronApp.emit('menu:action', 'create-cmmn-diagram');
    }
  }, {
    label: '💀💥 SELF DESTRUCTION! DO NOT PRESS ME! 💥💀',
    accelerator: 'CommandOrControl+!',
    enabled: function() {
      return true;
    },
    action: function() {
      process.exit(7);
    }
  }];
};

