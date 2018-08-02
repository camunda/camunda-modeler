var inherits = require('inherits');

var BaseComponent = require('base/component'),
    ensureOpts = require('util/ensure-opts');

var INITIAL = 'initial',
    LOADING = 'loading',
    SUCCESS = 'success',
    ERROR = 'error';


function DeployDiagramOverlay(options) {

  ensureOpts([
    'events',
    'initializeState',
    'closeOverlay',
    'setState'
  ], options);

  BaseComponent.call(this, options);

  var events = options.events;

  this.initialState = {
    status: INITIAL
  };

  this.initializeState({
    self: this,
    key: DeployDiagramOverlay.name
  });

  this.submitDeploymentConfigForm = (e) => {
    e.preventDefault();

    var form = e.target;

    var deploymentName = form['deployment-name'].value;
    var tenantId = form['tenant-id'].value;

    this.setState({ status: LOADING });

    events.emit('deploy', {
      deploymentName,
      tenantId
    }, (err) => {
      if (err) {
        this.setState({
          status: ERROR,
          message: err.message,
          deploymentName,
          tenantId
        });
      } else {
        this.setState({
          status: SUCCESS,
          message: 'Deployment was done successfully.'
        });
      }

      setTimeout(() => {
        this.setState({
          status: INITIAL
        });
      }, 5000);

    });
  };


  this.render = () => {

    var isLoading = this.state.status === LOADING;

    var buttonStatus = isLoading
      ? <span className="icon-loading animate-spin"></span>
      : '';

    var status = '';

    if (this.state.status === SUCCESS) {
      status = <div className="status success">
        <strong>Success: </strong> { this.state.message }
      </div>;
    } else if (this.state.status === ERROR) {
      status = <div className="status error">
        <strong>Error: </strong> { this.state.message }
      </div>;
    }

    return (
      <div className="deployment-configuration">

        <h2>Deploy Diagram</h2>

        <p className="intro">
          Specify deployment details and deploy this diagram to Camunda.
        </p>

        { status }

        <form
          className="ca-form"
          onSubmit={ this.submitDeploymentConfigForm }>

          <div>
            <label htmlFor="deployment-name">Deployment Name</label>
          </div>

          <div>
            <input
              id="deployment-name"
              name="deployment-name"
              type="text"
              disabled={ isLoading }
              required
              autofocus />
          </div>

          <div>
            <label htmlFor="tenant-id">Tenant Id</label>
          </div>

          <div>
            <input
              id="tenant-id"
              name="tenant-id"
              type="text"
              disabled={ isLoading } />
          </div>

          <div></div>

          <div>
            <button
              type="submit"
              disabled={ isLoading }>
              Deploy { buttonStatus }
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
}

inherits(DeployDiagramOverlay, BaseComponent);

module.exports = DeployDiagramOverlay;