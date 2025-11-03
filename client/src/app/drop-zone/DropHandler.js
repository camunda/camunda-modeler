/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const VSCODE_FILE_TYPE = 'codefiles';


export class DropHandler {
  static STATES = {
    DRAGGING: 'dragging',
    NOT_DRAGGING: 'not-dragging'
  };

  constructor(onDrop, getFilePath) {
    this._onDrop = onDrop;
    this._getFilePath = getFilePath;
  }

  /**
   * @param {DragEvent} event
   */
  handleDragOver(event) {
    if (!this.isDragAllowed(event)) {
      return DropHandler.STATES.NOT_DRAGGING;
    }

    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';

    return DropHandler.STATES.DRAGGING;
  }

  handleDragLeave(event) {
    if (!this.isDragAllowed(event)) {
      return DropHandler.STATES.NOT_DRAGGING;
    }

    event.preventDefault();
    event.stopPropagation();

    return event.relatedTarget ? DropHandler.STATES.DRAGGING : DropHandler.STATES.NOT_DRAGGING;
  }

  async handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    const filesToOpen = await Promise.all([
      handleDropFromFileSystem(event, this._getFilePath),
      handleDropFromVSCode(event)
    ]).then(result => result.flat());

    if (filesToOpen.length) {
      this._onDrop(filesToOpen);
    }

    return DropHandler.STATES.NOT_DRAGGING;
  }

  /**
   * @param {DragEvent} event
   */
  isDragAllowed(event) {
    const { dataTransfer } = event;

    return Array.from(dataTransfer.items).some(isDroppableItem);
  }
}

/**
 * Checks for droppable items e.g. text/foo, text/plain, application/foo+xml,
 * application/bpmn, application/dmn.
 *
 * @param {DataTransferItem} item - Item to be dropped.
 *
 * @returns {boolean}
 */
export function isDroppableItem(item) {
  const { kind, type } = item;

  if (kind === 'string' && type === VSCODE_FILE_TYPE) {
    return true;
  }

  if (kind !== 'file') {
    return false;
  }

  return /^(text\/.*|application\/([^+]*\+)?xml|application\/(bpmn|dmn|camunda-form))?$/.test(type);
}

/**
 * Retrieve file paths from file system drop event.
 *
 * @param {DragEvent} dropEvent
 */
function handleDropFromFileSystem(dropEvent, getFilePath) {
  const { files } = dropEvent.dataTransfer;
  const paths = Array.from(files).map(file => getFilePath(file));

  return Promise.all(paths);
}

/**
 * Retrieve file paths from VS Code drop event.
 *
 * @param {DragEvent} dropEvent
 */
async function handleDropFromVSCode(dropEvent) {
  const { items } = dropEvent.dataTransfer;

  const vscodeFilesItem = Array.from(items).find(item => item.type === VSCODE_FILE_TYPE);

  if (!vscodeFilesItem) {
    return [];
  }

  try {
    const filePaths = await new Promise(resolve => {
      vscodeFilesItem.getAsString(itemContent => {
        resolve(JSON.parse(itemContent));
      });
    });

    return filePaths;
  } catch (error) {
    return [];
  }
}
