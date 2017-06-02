'use strict';

var inherits = require('inherits');

var ensureOpts = require('util/ensure-opts');

var dropdown = require('util/dom/dropdown');

var BaseComponent = require('base/component');


function MultiButton(options) {

  if (!(this instanceof MultiButton)) {
    return new MultiButton(options);
  }

  ensureOpts([ 'choices' ], options);

  BaseComponent.call(this, options);

  this.render = function() {

    var primaryChoice = getPrimaryAction(this.disabled, this.choices),
        disabled = this.disabled ? 'disabled' : '',
        dropdownWidget;

    if (!this.disabled) {
      dropdownWidget = (
        <div className="dropdown-container">
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
        </div>
      );
    }

    var html =
      <button className={ 'multi-button ' + disabled } onMousedown={ dropdown('multi-button') }>
        <span className="primary"
              title={ primaryChoice.label || '' }>
          <span className={ primaryChoice.icon }></span>
        </span>

        { dropdownWidget }
      </button>;

    return html;
  };
}

inherits(MultiButton, BaseComponent);

module.exports = MultiButton;


function getPrimaryAction(isDisabled, choices) {
  var primaryChoices;

  if (isDisabled) {
    return {
      label: choices[0].label,
      icon: choices[0].icon,
      action: function() {}
    };
  }

  primaryChoices = choices.filter(function(c) {
    return c.primary;
  });

  if (primaryChoices.length !== 1) {
    throw new Error('must define exactly one primary=true choice');
  }

  return primaryChoices[0];
}
