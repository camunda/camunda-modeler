'use strict';

var inherits = require('inherits');

var ensureOpts = require('util/ensure-opts');

var dropdown = require('util/dom/dropdown');

var Separator = require('./separator');

var BaseComponent = require('base/component');


function MultiButton(options) {

  if (!(this instanceof MultiButton)) {
    return new MultiButton(options);
  }

  ensureOpts([ 'choices' ], options);

  BaseComponent.call(this, options);

  this.render = function() {

    var primaryChoice = getPrimaryAction(this.choices);

    var html =
      <button className="multi-button" onMousedown={ dropdown() }>
        <span className="primary"
              title={ primaryChoice.label || '' }
              onClick={ primaryChoice.action }>
          <span className={ primaryChoice.icon }></span>
        </span>

        <Separator />

        <span className="caret"></span>

        <ul className="dropdown">
          {
            this.choices.map(c => {
              return <li className="entry" onMouseup={ c.action } ref={ c.id }>
                { c.label }
              </li>;
            })
          }
        </ul>
      </button>;

    return html;
  };
}

inherits(MultiButton, BaseComponent);

module.exports = MultiButton;


function getPrimaryAction(choices) {
  var primaryChoices = choices.filter(function(c) {
    return c.primary;
  });

  if (primaryChoices.length !== 1) {
    throw new Error('must define exactly one primary=true choice');
  }

  return primaryChoices[0];
}