var inherits = require('inherits');

var BaseComponent = require('base/component'),
    ensureOpts = require('util/ensure-opts');


function ConfigureEndpointOverlay(options) {

  ensureOpts([
    'events',
    'endpoints',
    'closeOverlay'
  ], options);

  BaseComponent.call(this, options);

  var events = options.events;

  var endpoint = (options.endpoints || [])[0];

  this.updateEndpoint = (e) => {
    endpoint = e.target.value;
  };

  this.submitEndpointConfigForm = (e) => {
    e.preventDefault();

    events.emit('deploy:endpoint:update', [ endpoint ]);

    this.closeOverlay();
  };


  this.render = () => {

    return (
      <div className="endpoint-configuration">

        <h2>Configure Endpoint</h2>

        <p className="intro">
          Configure the Camunda REST API endpoint used to deploy diagrams.
        </p>

        <form
          className="ca-form"
          onSubmit={ this.submitEndpointConfigForm }>

          <div>
            <label htmlFor="endpoint-url">
              Endpoint URL
            </label>
          </div>

          <div>
            <input
              id="endpoint-url"
              type="text"
              value={ endpoint }
              onChange={ this.compose(this.updateEndpoint) }
              required />

            <div className="hint">
              This should point to the <code>/deployment/create</code> endpoint
              inside your Camunda REST API.
            </div>
          </div>

          <div></div>

          <div>
            <button type="submit">
              Save
            </button>

            <button
              type="button"
              className="hide-dialog"
              onClick={ this.closeOverlay }>
              Cancel
            </button>
          </div>

        </form>

      </div>
    );
  };
}

inherits(ConfigureEndpointOverlay, BaseComponent);

module.exports = ConfigureEndpointOverlay;