'use strict';

var inherits = require('inherits');

var assign = require('lodash/object/assign');

var Tab = require('base/components/tab');

var ensureOpts = require('util/ensure-opts');


function EmptyTab(options) {

  if (!(this instanceof EmptyTab)) {
    return new EmptyTab(options);
  }

  options = assign({ empty: true }, options);

  ensureOpts([
    'app',
    'events'
  ], options);

  this.render = function() {

    var html =
      <div className="empty-tab">
        <h1>No open diagram</h1>
        <p>
          <button onClick={ this.app.compose('triggerAction', 'create-bpmn-diagram') }>create BPMN diagram</button>
          <span> or </span>
          <button onClick={ this.app.compose('triggerAction', 'create-dmn-diagram') }>create DMN table</button>
        </p>
        <p>
          <button onClick={ this.app.compose('triggerAction', 'open-diagram') }>open from file system</button>
        </p>
      </div>;

    return html;
  };

  Tab.call(this, options);

  this.on('focus', () => {
    this.events.emit('tools:state-changed', this, {});
  });
}

inherits(EmptyTab, Tab);

module.exports = EmptyTab;
