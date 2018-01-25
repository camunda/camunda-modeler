'use strict';

var inherits = require('inherits');

var domClosest = require('min-dom/lib/closest');

var BaseComponent = require('base/component');

var isMac = require('util/is-mac'),
    ensureOpts = require('util/ensure-opts');


function ModalOverlay(options) {
  ensureOpts([ 'events', 'isActive', 'content', 'endpoints' ], options);

  BaseComponent.call(this, options);

  var events = options.events;

  if (!(this instanceof ModalOverlay)) {
    return new ModalOverlay(options);
  }

  this.closeOverlay = function(event, forceClose) {
    var target = event && event.target;

    if (!this._content || !forceClose && target && domClosest(target, '.overlay-container')) {
      return;
    }

    this._content = null;

    events.emit('dialog-overlay:toggle', false);
  };

  // endpoint configuration modal
  var endpoint = (options.endpoints || [])[0];

  this.updateEndpoint = function(e) {
    endpoint = e.target.value;
  };

  this.submitEndpointConfigForm = function(e) {
    e.preventDefault();
    events.emit('deploy:endpoint:update', [ endpoint ]);
    this.closeOverlay();
  };

  var ENDPOINT_CONFIG_OVERLAY = (
    <div className="endpoint-configuration">
      <h2>Deployment Endpoint Configuration</h2>
      <form className="endpoint-configuration-form" onSubmit={this.compose(this.submitEndpointConfigForm)}>
        <div className="form-row">
          <label
            htmlFor="endpoint-url">
            Endpoint URL
          </label>
          <input
            id='endpoint-url'
            type='text'
            value={endpoint}
            onChange={this.compose(this.updateEndpoint)}/>
          <button type="submit"> Save </button>
          <button
            type="button"
            className='hide-dialog'
            onClick={ this.compose(this.closeOverlay, true) }>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  // shortcuts modal
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
    shortcuts: SHORTCUTS_OVERLAY,
    endpointConfig: ENDPOINT_CONFIG_OVERLAY
  };

  this.getContent = function(content) {
    this._content = availableContent[content];

    if (!this._content) {
      return;
    }

    return this._content;
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
