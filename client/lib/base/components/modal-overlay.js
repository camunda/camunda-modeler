'use strict';

var inherits = require('inherits');

var BaseComponent = require('base/component');

var isMac = require('util/is-mac'),
    ensureOpts = require('util/ensure-opts');


function hasClass(node, cls) {
  if (!node.classList) {
    return;
  }

  return node.classList.contains(cls);
}

function ModalOverlay(options) {
  var modifierKey = 'Control';

  if (isMac()) {
    modifierKey = 'Command';
  }

  var SHORTCUTS_OVERLAY = (
    <div className="keyboard-shortcuts">
      <h2>Keyboard Shortcuts</h2>
      <p>
        The following special shortcuts can be used on opened diagrams.
      </p>
      <table>
        <tbody>
          <tr>
            <td>Add Line Feed (in text box)</td>
            <td className="binding"><code>Shift + Enter</code></td>
          </tr>
          <tr>
            <td>Scrolling (Vertical)</td>
            <td className="binding">{ modifierKey } + Mouse Wheel</td>
          </tr>
          <tr>
            <td>Scrolling (Horizontal)</td>
            <td className="binding">{ modifierKey } + Shift + Mouse Wheel</td>
          </tr>
          <tr>
            <td>Add element to selection</td>
            <td className="binding">{ modifierKey } + Mouse Click</td>
          </tr>
          <tr>
            <td>Select multiple elements (Lasso Tool)</td>
            <td className="binding">{ modifierKey } + Mouse Drag</td>
          </tr>
        </tbody>
      </table>
      <p>
        Find additional shortcuts on individual items in the application menu.
      </p>
    </div>
  );

  var availableContent = {
    shortcuts: SHORTCUTS_OVERLAY
  };

  ensureOpts([ 'events', 'isActive', 'content' ], options);

  BaseComponent.call(this, options);

  var events = options.events;

  if (!(this instanceof ModalOverlay)) {
    return new ModalOverlay(options);
  }

  this.getContent = function(content) {
    this._content = availableContent[content];

    if (!this._content) {
      return;
    }

    return this._content;
  };

  this.closeOverlay = function(event) {
    var target = event.target;

    if (!this._content || !hasClass(target, 'dialog-overlay')) {
      return;
    }

    this._content = null;

    events.emit('dialog-overlay:toggle', false);
  };

  this.render = function() {

    var classes = 'dialog-overlay',
        content = this.getContent(options.content);

    if (options.isActive) {
      classes += ' active';
    }

    if (content) {
      classes += ' content';
    }

    var html = (
      <div className={ classes } onClick={ this.compose(this.closeOverlay) }>
        <div className="overlay-container">
          { content }
        </div>
      </div>
    );

    return html;
  };
}

inherits(ModalOverlay, BaseComponent);

module.exports = ModalOverlay;
