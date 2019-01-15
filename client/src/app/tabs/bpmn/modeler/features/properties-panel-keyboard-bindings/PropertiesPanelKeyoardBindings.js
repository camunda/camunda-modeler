import {
  isCmd as isCommandOrControl,
  isKey,
  isShift
} from 'diagram-js/lib/features/keyboard/KeyboardUtil';


export default class PropertiesPanelKeyboardBindings {
  constructor(commandStack, eventBus, propertiesPanel) {
    this._commandStack = commandStack;
    this._eventBus = eventBus;
    this._propertiesPanel = propertiesPanel;

    eventBus.on('propertiesPanel.attach', this._addEventListeners);

    eventBus.on('propertiesPanel.detach', this._removeEventListeners);
  }

  _addEventListeners = () => {
    const container = this._getContainer();

    container.addEventListener('focusin', this.handleFocusin);
    container.addEventListener('focusout', this.handleFocusout);
    container.addEventListener('keydown', this.handleKeydown);
  }

  _removeEventListeners = () => {
    const container = this._getContainer();

    container.removeEventListener('focusin', this.handleFocusin);
    container.removeEventListener('focusout', this.handleFocusout);
    container.removeEventListener('keydown', this.handleKeydown);
  }

  handleFocusin = () => {
    this._eventBus.fire('propertiesPanel.focusin');
  }

  handleFocusout = () => {
    this._eventBus.fire('propertiesPanel.focusout');
  }

  handleKeydown = event => {
    const commandStack = this._commandStack;

    if (isUndo(event)) {
      commandStack.canUndo() && commandStack.undo();

      event.preventDefault();
    }

    if (isRedo(event)) {
      commandStack.canRedo() && commandStack.redo();

      event.preventDefault();
    }
  }

  _getContainer() {
    return this._propertiesPanel._container;
  }
}

PropertiesPanelKeyboardBindings.$inject = [ 'commandStack', 'eventBus', 'propertiesPanel' ];

// helpers //////////

function isUndo(event) {
  return isCommandOrControl(event) && !isShift(event) && isKey(['z', 'Z'], event);
}

function isRedo(event) {
  return isCommandOrControl(event) && (isKey(['y', 'Y'], event) || (isKey(['z', 'Z'], event) && isShift(event)));
}