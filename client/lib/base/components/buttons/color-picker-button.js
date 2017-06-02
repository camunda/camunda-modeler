'use strict';

var inherits = require('inherits');

var ensureOpts = require('util/ensure-opts');

var dropdown = require('util/dom/dropdown');

var BaseComponent = require('base/component');

function ColorPickerButton(options) {

  if (!(this instanceof ColorPickerButton)) {
    return new ColorPickerButton(options);
  }

  ensureOpts([ 'colors', 'label' ], options);

  BaseComponent.call(this, options);

  this.render = function() {

    var disabled = this.disabled ? 'disabled' : '',
        dropdownWidget;

    if (!disabled) {
      dropdownWidget = (
        <div className="dropdown-container">
          <ul className="dropdown">
            {
              this.colors.map(c => {
                return <li
                  className="entry"
                  onMouseup={ this.action.bind(null, { fill: c.fill, stroke: c.stroke }) }
                  style={ { backgroundColor: c.fill || 'white', borderColor: c.stroke || 'black' } }>
                </li>;
              })
            }
          </ul>
        </div>
      );
    }

    var html =
      <button className={ 'color-picker-button ' + disabled }
          title={ this.label }
          ref={ this.id }
          onMousedown={ dropdown('color-picker-button') }>
        { this.icon ? <span className={ this.icon }></span> : null }
        <span className="caret"></span>
        { dropdownWidget }
      </button>;

    return html;
  };
}

inherits(ColorPickerButton, BaseComponent);

module.exports = ColorPickerButton;
