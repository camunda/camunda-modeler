'use strict';

var inherits = require('inherits');

var ensureOpts = require('util/ensure-opts');

var BaseComponent = require('base/component');


function Button(options) {

  if (!(this instanceof Button)) {
    return new Button(options);
  }

  ensureOpts([ 'action' ], options);

  BaseComponent.call(this, options);


  this.render = function() {

    return (
      <button
        className={ this.disabled ? 'disabled' : '' }
        title={ this.label || '' }
        ref={ this.id }
        onClick={ this.action }>
        { this.icon ? <span className={ this.icon }></span> : null }
      </button>
    );
  };
}

inherits(Button, BaseComponent);

module.exports = Button;