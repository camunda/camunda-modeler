'use strict';

var isInputActive = require('util/dom/is-input').active;

var debug = require('debug')('shortcuts');


function ShortcutsFix(app) {

  this.binded = false;

  this.bind = () => {
    debug('adding keyboard shortcuts bindings');
    if (!this.binded) {
      window.addEventListener('keydown', this.handler);
      this.binded = true;
      return debug('added');
    }
    debug('skipped');
  };

  this.unbind = () => {
    debug('removing keyboard shortcuts bindings');
    if (this.binded) {
      window.removeEventListener('keydown', this.handler);
      this.binded = false;
      return debug('removed');
    }
    debug('skipped');
  };

  this.handler = (e) => {
    triggerActionForCtrlKeyEvent(e, 'a', 'selectElements');
    triggerActionForCtrlKeyEvent(e, 'z', 'undo');
    triggerActionForCtrlKeyEvent(e, 'y', 'redo');
  };

  function triggerActionForCtrlKeyEvent(event, key, action) {
    if ( event.ctrlKey && ( String.fromCharCode(event.which).toLowerCase() === key && !isInputActive()) ) {
      debug('triggering "' + action + '" for Ctrl+' + key);
      event.preventDefault();
      app.triggerAction(action);
    }
  }
}


module.exports = ShortcutsFix;
