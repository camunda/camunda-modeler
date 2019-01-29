import {
  isCmd as isCommandOrControl,
  isKey,
  isShift
} from 'diagram-js/lib/features/keyboard/KeyboardUtil';

import {
  findSelectableAncestor
} from 'dmn-js-decision-table/lib/features/cell-selection/CellSelectionUtil';

export default class DecisionTableKeyboardBindings {
  constructor(decisionTable, commandStack, editorActions, eventBus) {
    this._decisionTable = decisionTable;
    this._commandStack = commandStack;
    this._editorActions = editorActions;
    this._eventBus = eventBus;

    eventBus.on('attach', this._addEventListeners);

    eventBus.on('detach', this._removeEventListeners);
  }

    _addEventListeners = () => {
      const container = this._getContainer();

      container.addEventListener('keydown', this.handleKeydown, true);
    }

    _removeEventListeners = () => {
      const container = this._getContainer();

      container.removeEventListener('keydown', this.handleKeydown);
    }

    handleKeydown = event => {
      const commandStack = this._commandStack;
      const editorActions = this._editorActions;

      if (isUndo(event)) {
        commandStack.canUndo() && commandStack.undo();

        event.preventDefault();
      }

      if (isRedo(event)) {
        commandStack.canRedo() && commandStack.redo();

        event.preventDefault();
      }

      if (isSelectCell(event)) {
        if (!this._hasSelectableAncestor(event.target)) {
          return;
        }

        const cmd = isShift(event) ? 'selectCellAbove' : 'selectCellBelow';

        editorActions.trigger(cmd);

        event.preventDefault();
        event.stopPropagation();

      }

    }

    _getContainer() {
      return this._decisionTable._container;
    }

    _hasSelectableAncestor(element) {
      return findSelectableAncestor(element);
    }
}

DecisionTableKeyboardBindings.$inject = [ 'decisionTable', 'commandStack', 'editorActions', 'eventBus' ];

// helpers //////////

function isUndo(event) {
  return isCommandOrControl(event) && !isShift(event) && isKey(['z', 'Z'], event);
}

function isRedo(event) {
  return isCommandOrControl(event) && (isKey(['y', 'Y'], event) || (isKey(['z', 'Z'], event) && isShift(event)));
}

function isSelectCell(event) {
  return !isCommandOrControl(event) && isKey(['Enter'], event);
}