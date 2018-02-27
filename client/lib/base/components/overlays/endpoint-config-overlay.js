var inherits = require('inherits');

var BaseComponent = require('base/component'),
    ensureOpts = require('util/ensure-opts');


var EndpointConfig = function(options) {

  ensureOpts([ 'events', 'endpoints', 'closeOverlay'], options);

  BaseComponent.call(this, options);

  var events = options.events;

  var endpoint = (options.endpoints || [])[0];

  this.updateEndpoint = function(e) {
    endpoint = e.target.value;
  };

  this.submitEndpointConfigForm = function(e) {
    e.preventDefault();

    events.emit('deploy:endpoint:update', [ endpoint ]);

    this.closeOverlay();
  };



  this.render = () => {

    return (
      <div className="endpoint-configuration">

        <h2>Deployment Endpoint Configuration</h2>

        <form
          className="endpoint-configuration-form"
          onSubmit={ this.submitEndpointConfigForm.bind(this) }>

          <div className="form-row form-flex-row">
            <label htmlFor="endpoint-url">
              Endpoint URL
            </label>
            <input
              id='endpoint-url'
              type='text'
              value={ endpoint }
              onChange={ this.compose(this.updateEndpoint.bind(this)) } />
          </div>

          <div className="form-row form-btn-row">
            <button type="submit">
              Save
            </button>
            <button
              type="button"
              className='hide-dialog'
              onClick={ this.closeOverlay }>
              Cancel
            </button>
          </div>

        </form>

      </div>
    );
  };
};

inherits(EndpointConfig, BaseComponent);

module.exports = EndpointConfig;