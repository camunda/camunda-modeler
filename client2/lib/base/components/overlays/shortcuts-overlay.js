var inherits = require('inherits');

var BaseComponent = require('base/component'),
    isMac = require('util/is-mac');



var ShortcutsOverlay = function(options) {

  BaseComponent.call(this, options);

  var modifierKey = 'Control';

  if (isMac()) {
    modifierKey = 'Command';
  }

  this.render = function() {
    return (
      <div className="keyboard-shortcuts">
        <h2>Keyboard Shortcuts</h2>
        <p>
          The following special shortcuts can be used on opened diagrams.
        </p>
        <table>
          <tbody>
            <tr>
              <td>Add Line Feed (in text box)</td>
              <td className="binding"><code>Shift + Enter</code></td>
            </tr>
            <tr>
              <td>Scrolling (Vertical)</td>
              <td className="binding">{ modifierKey } + Mouse Wheel</td>
            </tr>
            <tr>
              <td>Scrolling (Horizontal)</td>
              <td className="binding">{ modifierKey } + Shift + Mouse Wheel</td>
            </tr>
            <tr>
              <td>Add element to selection</td>
              <td className="binding">{ modifierKey } + Mouse Click</td>
            </tr>
            <tr>
              <td>Select multiple elements (Lasso Tool)</td>
              <td className="binding">{ modifierKey } + Mouse Drag</td>
            </tr>
          </tbody>
        </table>
        <p>
          Find additional shortcuts on individual items in the application menu.
        </p>
      </div>
    );
  };

};

inherits(ShortcutsOverlay, BaseComponent);

module.exports = ShortcutsOverlay;