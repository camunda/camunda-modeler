'use strict';

var isInput = require('util/dom/is-input').isInput;

var domClosest = require('min-dom/lib/closest');

var debug = require('debug')('shortcuts');


function ShortcutsFix(app, isMac) {

  this.bound = false;

  this.bind = () => {
    debug('adding keyboard shortcuts bindings');

    if (!this.bound) {
      window.addEventListener('keydown', this.handler);

      this.bound = true;

      return debug('added');
    }

    debug('skipped');
  };

  this.unbind = () => {
    debug('removing keyboard shortcuts bindings');

    if (this.bound) {
      window.removeEventListener('keydown', this.handler);

      this.bound = false;

      return debug('removed');
    }

    debug('skipped');
  };

  this.handler = (e) => {

    var activeElement = document.activeElement;

    // todo(ricardo): DMN HACK: we need to trigger preventDefault;
    if (isDmnInput(activeElement) && event.key === 'Enter' &&
        app.activeTab.activeEditor.getActiveEditorName() !== 'literal-expression') {

      e.preventDefault();

      if (event.ctrlKey || event.metaKey) {

        app.triggerAction('insertNewLine');
      } else if (event.shiftKey) {

        app.triggerAction('selectPreviousRow');
      } else {

        app.triggerAction('selectNextRow');
      }
    }

    // END OF HACK;
    if (isMac) {
      return;
    }

    if (event.ctrlKey) {

      if (!isInput(activeElement)) {
        triggerKeyAction(e, 'a', 'selectElements');

        triggerKeyAction(e, 'c', 'copy');
        triggerKeyAction(e, 'v', 'paste');
      }

      if (!isInput(activeElement) || isPropertiesInput(activeElement)) {
        triggerKeyAction(e, 'z', 'undo');
        triggerKeyAction(e, 'y', 'redo');
      }
    }
  };

  function triggerKeyAction(event, key, action) {

    var pressedKey = String.fromCharCode(event.which).toLowerCase();

    if (pressedKey === key) {
      debug('triggering "' + action + '" for Ctrl+' + key);

      event.preventDefault();

      app.triggerAction(action);
    }
  }
}


module.exports = ShortcutsFix;


///////// helpers ///////////////////////////////////////

function isPropertiesInput(el) {
  return el && domClosest(el, '.properties');
}

function isDmnInput(el) {
  return el && domClosest(el, '.dmn-table');
}
