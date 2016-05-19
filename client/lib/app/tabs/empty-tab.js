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
        <p className="buttons-create">
          <span>Create a </span>
          <button onClick={ this.app.compose('triggerAction', 'create-bpmn-diagram') }>BPMN diagram</button>
          <span> or </span>
          <button onClick={ this.app.compose('triggerAction', 'create-dmn-diagram') }>DMN table</button>
          <span> or </span>
          <button onClick={ this.app.compose('triggerAction', 'create-cmmn-diagram') }>CMMN diagram</button>
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
