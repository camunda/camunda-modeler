var inherits = require('inherits');

var BaseComponent = require('base/component'),
    ensureOpts = require('util/ensure-opts');

var INITIAL = 'initial',
    LOADING = 'loading',
    SUCCESS = 'success',
    ERROR = 'error';


var DeploymentConfig = function(options) {

  ensureOpts([ 'events', 'initializeState', 'closeOverlay', 'setState'], options);

  BaseComponent.call(this, options);

  var events = options.events;

  this.initialState = {
    status: INITIAL
  };

  this.initializeState({ self: this, key: DeploymentConfig.name });

  this.deploymentName = this.state.deploymentName;

  this.tenantId = this.state.tenantId;

  this.updateDeploymentName = function(e) {
    this.deploymentName = e.target.value;
  };

  this.updateTenantId = function(e) {
    this.tenantId = e.target.value;
  };

  this.submitDeploymentConfigForm = function(e) {
    e.preventDefault();

    this.setState({ status: LOADING });

    events.emit('deploy', {
      deploymentName: this.deploymentName,
      tenantId: this.tenantId
    }, (err) => {
      if (err) {
        this.setState({
          status: ERROR,
          message: err.message,
          deploymentName: this.deploymentName,
          tenantId: this.tenantId
        });
      } else {
        this.setState({
          status: SUCCESS,
          message: 'Deployment was done successfully.'
        });
      }

    });
  };


  this.render = () => {

    var isLoading = this.state.status === LOADING;

    var buttonStatus = isLoading
      ? <span className="icon-loading animate-spin"></span>
      : '';

    var status = '';

    if (this.state.status === SUCCESS) {
      status =  <div className="status success">
        <strong>Success: </strong> { this.state.message }
      </div>;
    } else if (this.state.status === ERROR) {
      status = <div className="status error">
        <strong>Error: </strong> { this.state.message }
      </div>;
    }

    return (
      <div className="deployment-configuration">

        <h2>Deployment Configuration</h2>

        { status }

        <form
          className="deployment-configuration-form"
          onSubmit={ this.submitDeploymentConfigForm.bind(this) }>

          <div className="form-row form-flex-row">
            <label htmlFor="deployment-name">Deployment Name</label>
            <input
              id="deployment-name"
              type="text"
              onChange={ this.updateDeploymentName.bind(this) }
              disabled={ isLoading }
              required/>
          </div>

          <div className="form-row form-flex-row">
            <label htmlFor="tenant-id">Tenant Id</label>
            <input
              id="tenant-id"
              type="text"
              onChange={ this.updateTenantId.bind(this) }
              disabled={ isLoading } />
          </div>

          <div className="form-row form-btn-row">
            <button
              type="submit"
              disabled={ isLoading }>
              { buttonStatus } Deploy
            </button>
            <button
              type="button"
              className='hide-dialog'
              onClick={ this.closeOverlay }
              disabled={ isLoading }>
              Cancel
            </button>
          </div>

        </form>
      </div>
    );
  };
};

inherits(DeploymentConfig, BaseComponent);

module.exports = DeploymentConfig;