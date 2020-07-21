'use strict';

module.exports = function(electronApp, menuState) {
  return [{
    label: 'Toggle Linting',
    accelerator: 'CommandOrControl+L',
    enabled: function() {

      // only enabled for BPMN diagrams
      return menuState.bpmn;
    },
    action: function() {
      electronApp.emit('menu:action', 'toggleLinting');
    }
  }]
};
