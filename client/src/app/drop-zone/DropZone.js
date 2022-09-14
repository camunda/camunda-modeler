/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';

import css from './DropZone.less';

const VSCODE_FILE_TYPE = 'codefiles';


export class DropZone extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      draggingOver: false
    };
  }

  handleDragOver = event => {
    if (!this.isDragAllowed(event)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';

    if (this.state.draggingOver) {
      return;
    }

    event.stopPropagation();

    this.setState({ draggingOver: true });
  };

  /**
   * @param {DragEvent} event
   */
  isDragAllowed(event) {
    const { dataTransfer } = event;

    return Array.from(dataTransfer.items).some(isDropableItem);
  }

  handleDragLeave = event => {
    event.preventDefault();
    event.stopPropagation();

    if (this.state.draggingOver && !event.relatedTarget) {
      this.setState({ draggingOver: false });
    }
  };

  handleDrop = async (event) => {
    if (!this.state.draggingOver) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    this.setState({ draggingOver: false });

    const filesToOpen = await Promise.all([
      handleDropFromFileSystem(event),
      handleDropFromVSCode(event)
    ]).then(result => result.flat());

    if (filesToOpen.length) {
      this.props.onDrop(filesToOpen);
    }
  };

  render() {
    return (
      <div
        className={ css.DropZone }
        onDragOver={ this.handleDragOver }
        onDragLeave={ this.handleDragLeave }
        onDrop={ this.handleDrop }
      >
        { this.state.draggingOver ? <DropOverlay /> : null }
        { this.props.children }
      </div>
    );
  }
}

DropZone.defaultProps = {
  onDrop: () => {}
};

function DropOverlay() {
  return (
    <div className={ css.DropOverlay }>
      <div className="box">
        <div>Drop diagrams here</div>
      </div>
    </div>
  );
}


/**
 * Checks for droppable items e.g. text/foo, text/plain, application/foo+xml,
 * application/bpmn, application/cmmn, application/dmn.
 *
 * @param {DataTransferItem} item - Item to be dropped.
 *
 * @returns {boolean}
 */
export function isDropableItem(item) {
  const { kind, type } = item;

  if (kind === 'string' && type === VSCODE_FILE_TYPE) {
    return true;
  }

  if (kind !== 'file') {
    return false;
  }

  return /^(text\/.*|application\/([^+]*\+)?xml|application\/(cmmn|bpmn|dmn|camunda-form))?$/.test(type);
}

/**
 * Retrieve file paths from file system drop event.
 *
 * @param {DragEvent} dropEvent
 */
function handleDropFromFileSystem(dropEvent) {
  const { files } = dropEvent.dataTransfer;

  return Array.from(files).map(file => file.path);
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
