'use strict';

var inherits = require('inherits');

var domClosest = require('min-dom/lib/closest');

var BaseComponent = require('base/component');

var isMac = require('util/is-mac'),
    ensureOpts = require('util/ensure-opts');


function ModalOverlay(options) {
  ensureOpts([ 'events', 'isActive', 'content', 'endpoints', 'authType', 'authUser', 'authPassword', 'authToken' ], options);

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
  var authType = (options.authType || 'none');
  var authUser = options.authUser;
  var authPassword = options.authPassword;
  var authToken = options.authToken;

  this.updateAuthUser = function(e) {
    authUser = e.target.value;
  };

  this.updateAuthPassword = function(e) {
    authPassword = e.target.value;
  };

  this.updateAuthToken = function(e) {
    authToken = e.target.value;
  };

  this.updateEndpoint = function(e) {
    endpoint = e.target.value;
  };

  this.updateAuthType = function(e) {
    authType = e.target.value;
    document.getElementById('token-auth').classList.add('hidden');
    document.getElementById('basic-user-auth').classList.add('hidden');
    document.getElementById('basic-pass-auth').classList.add('hidden');
    switch (authType) {
    case 'basic':
      document.getElementById('basic-user-auth').classList.remove('hidden');
      document.getElementById('basic-pass-auth').classList.remove('hidden');
      break;
    case 'token':
      document.getElementById('token-auth').classList.remove('hidden');
      break;
    }
  };

  this.getSelected = function(value) {
    return authType === value ? 'selected' : '';
  };

  this.getRowClass = function(value) {
    return authType === value ? 'form-row form-flex-row' : 'form-row form-flex-row hidden';
  };

  this.submitEndpointConfigForm = function(e) {
    e.preventDefault();
    events.emit('deploy:endpoint:update', [ endpoint ]);
    events.emit('deploy:authType:update', authType);
    events.emit('deploy:authUser:update', authUser);
    events.emit('deploy:authPassword:update', authPassword);
    events.emit('deploy:authToken:update', authToken);
    this.closeOverlay();
  };

  var ENDPOINT_CONFIG_OVERLAY = (
    <div className="endpoint-configuration">
      <h2>Deployment Endpoint Configuration</h2>
      <form className="endpoint-configuration-form" onSubmit={this.compose(this.submitEndpointConfigForm)}>
        <div className="form-row form-flex-row">
          <label
            htmlFor="endpoint-url">
            Endpoint URL
          </label>
          <input
            id='endpoint-url'
            type='text'
            value={endpoint}
            onChange={this.compose(this.updateEndpoint)}/>
        </div>
        <div className="form-row form-flex-row">
          <label
            htmlFor="auth-type">
            Auth Type
          </label>
          <select
            id='auth-type'
            onChange={this.compose(this.updateAuthType)}>
            <option value="none" selected={this.getSelected('none')}>No auth</option>
            <option value="basic" selected={this.getSelected('basic')}>Basic</option>
            <option value="token" selected={this.getSelected('token')}>Bearer token</option>
          </select>
        </div>
        <div className={this.getRowClass('basic')} id="basic-user-auth">
          <label
            htmlFor="auth-user-value">
            Username
          </label>
          <input
            id='auth-user-value'
            type='text'
            value={authUser}
            onChange={this.compose(this.updateAuthUser)}/>
        </div>
        <div className={this.getRowClass('basic')} id="basic-pass-auth">
          <label
            htmlFor="auth-password-value">
            Password
          </label>
          <input
            id='auth-password-value'
            type='password'
            value={authPassword}
            onChange={this.compose(this.updateAuthPassword)}/>
        </div>
        <div className={this.getRowClass('token')} id="token-auth">
          <label
            htmlFor="token-value">
            JWT Token
          </label>
          <input
            id='token-value'
            type='text'
            value={authToken}
            onChange={this.compose(this.updateAuthToken)}/>
        </div>
        <div className="form-row form-btn-row">
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

  /**
   * Deployment configuration
   */

  var deploymentName, tenantId;
  this.updateDeploymentName = function(e) {
    deploymentName = e.target.value;
  };
  this.updateTenantId = function(e) {
    tenantId = e.target.value;
  };

  this.submitDeploymentConfigForm = function(e) {
    e.preventDefault();
    events.emit('deploy:bpmn', {
      deploymentName: deploymentName,
      tenantId: tenantId
    }, (err) => {
      if (err) {
        console.error(err);
      }

      this.closeOverlay();
    });
  };

  var deploymentConfig = (
    <div className="deployment-configuration">
      <h2>Deployment Configuration</h2>
      <form className="deployment-configuration-form" onSubmit={this.compose(this.submitDeploymentConfigForm)}>
        <div className="form-row form-flex-row">
          <label htmlFor="deployment-name">Deployment Name</label>
          <input
            id="deployment-name"
            type="text"
            onChange={this.compose(this.updateDeploymentName)}
            required/>
        </div>
        <div className="form-row form-flex-row">
          <label htmlFor="tenant-id">Tenant Id</label>
          <input
            id="tenant-id"
            type="text"
            onChange={this.compose(this.updateTenantId)}/>
        </div>
        <div className="form-row form-btn-row">
          <button type="submit"> Deploy </button>
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

  var availableContent = {
    shortcuts: SHORTCUTS_OVERLAY,
    endpointConfig: ENDPOINT_CONFIG_OVERLAY,
    deploymentConfig: deploymentConfig
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
