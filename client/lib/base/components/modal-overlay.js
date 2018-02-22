'use strict';

var inherits = require('inherits');

var domClosest = require('min-dom/lib/closest');

var BaseComponent = require('base/component'),
    DeploymentConfig = require('./overlays/deployment-config-overlay'),
    Shortcuts = require('./overlays/shortcuts-overlay'),
    EndpointConfig = require('./overlays/endpoint-config-overlay');

var ensureOpts = require('util/ensure-opts');


function ModalOverlay(options) {
  ensureOpts([ 'events', 'isActive', 'content', 'endpoints', 'initializeState' ], options);

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

  /**
   * Shortcuts
   */
  var SHORTCUTS_OVERLAY = <Shortcuts />;


  /**
   * Endpoint configuration
   */
  var ENDPOINT_CONFIG_OVERLAY = <EndpointConfig
    closeOverlay={this.compose(this.closeOverlay, true)}
    events={this.events}
    endpoints={options.endpoints}/>;


  /**
   * Deployment configuration
   */

  var DEPLOYMENT_CONFIG_OVERLAY = <DeploymentConfig
    closeOverlay={this.compose(this.closeOverlay, true)}
    events={this.events}
    initializeState={this.initializeState}
    setState={this.setState}
  />;

  var availableContent = {
    shortcuts: SHORTCUTS_OVERLAY,
    endpointConfig: ENDPOINT_CONFIG_OVERLAY,
    deploymentConfig: DEPLOYMENT_CONFIG_OVERLAY
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
