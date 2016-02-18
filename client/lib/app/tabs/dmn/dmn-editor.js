'use strict';

var inherits = require('inherits');

var DiagramEditor = require('../../editor/diagram-editor');

var DmnJS = require('dmn-js/lib/Modeler');

var isUnsaved = require('util/file/is-unsaved');


/**
 * A BPMN 2.0 diagram editing component.
 *
 * @param {Object} options
 */
function DmnEditor(options) {

  DiagramEditor.call(this, options);

  /**
   * Update state, keeping current this.
   */
  this.updateState = () => {

    var tab = this.tab,
        modeler = this.getModeler(),
        file = this.file,
        lastStackIndex = this.lastStackIndex;

    // no tab to report to, see ya later
    if (!tab) {
      return;
    }

    // no diagram to harvest, good day maam!
    if (!modeler.table) {
      return;
    }

    var commandStack = modeler.get('commandStack');

    // TODO: complete state update here...
    tab.updateState({
      undo: commandStack.canUndo(),
      redo: commandStack.canRedo(),
      dirty: commandStack._stackIdx !== lastStackIndex || isUnsaved(file)
    });
  };
}

inherits(DmnEditor, DiagramEditor);

module.exports = DmnEditor;


DmnEditor.prototype.getStackIndex = function() {
  var modeler = this.getModeler();

  return modeler.table ? modeler.get('commandStack')._stackIdx : -1;
};

DmnEditor.prototype.triggerAction = function(action, options) {

  var modeler = this.getModeler();

  if (action === 'undo') {
    modeler.get('commandStack').undo();
  }

  if (action === 'redo') {
    modeler.get('commandStack').redo();
  }
};

DmnEditor.prototype.getModeler = function() {

  if (!this.modeler) {

    // lazily instantiate and cache
    this.modeler = this.createModeler(this.$el);

    // hook up with modeler change events
    this.modeler.on([
      'commandStack.changed',
      'selection.changed',
      'import.success',
      'import.error'
    ], this.updateState);
  }

  return this.modeler;
};

DmnEditor.prototype.createModeler = function($el) {
  return new DmnJS({ container: $el });
};

DmnEditor.prototype.render = function() {

  return (
    <div className="dmn-editor" key={ this.id }>
      <div className="diagram-container"
           tabIndex="0"
           onAppend={ this.compose('mountEditor') }
           onRemove={ this.compose('unmountEditor') }>
      </div>
    </div>
  );
};
