'use strict';

var debug = require('debug')('shortcuts');

function Shortcuts(app, window) {

  this.window = window;

  this.bind = () => {
    debug('adding keyboard shortcuts bindings');
    this.window.addEventListener('keydown', this.handler);
    return this;
  };

  this.unbind = () => {
    debug('removing keyboard shortcuts bindings');
    this.window.removeEventListener('keydown', this.handler);
    return this;
  };

  this.handler = (event) => {
    debug('===> here', event);

    function isMac() {
      return window.navigator.platform === 'MacIntel';
    }

    function modifierPressed(evt) {
      return event.ctrlKey || event.metaKey;
    }

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
    if (isMac() && !modifierPressed(event)) {
      var tool;
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

module.exports = Shortcuts;