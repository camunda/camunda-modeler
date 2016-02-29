'use strict';

var debug = require('debug')('shortcuts');


function modifierPressed(evt) {
  return evt.ctrlKey || evt.metaKey;
}

function ShortcutsFix(app) {

  this.bind = () => {
    debug('adding keyboard shortcuts bindings');

    window.addEventListener('keydown', this.handler);
  };

  this.unbind = () => {
    debug('removing keyboard shortcuts bindings');

    window.removeEventListener('keydown', this.handler);
  };

  this.handler = (event) => {
    var tool;

    debug('===> here', event);

    /**
     * Tools (keybinding)
     *
     * Lasso (L)
     * Space (S)
     * Hand (H)
     * Direct Editing (E)
     *
     * This is necessary for the time being, because in Mac OS X the A - Z
     * accelerators (keybindings) are being swallen by the renderer process
     */
    if (!modifierPressed(event)) {

      switch (event.keyCode) {
      case 76:
        tool = 'lassoTool';
        break;
      case 83:
        tool = 'spaceTool';
        break;
      case 72:
        tool = 'handTool';
        break;
      case 69:
        tool = 'directEditing';
        break;
      default:
        // do nothing
      }

      if (tool) {
        event.preventDefault();

        app.triggerAction(tool);
      }
    }
  };

}

module.exports = ShortcutsFix;
