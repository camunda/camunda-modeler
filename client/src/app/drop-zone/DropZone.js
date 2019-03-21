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
  }

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
  }

  handleDrop = async (event) => {
    if (!this.state.draggingOver) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    this.setState({ draggingOver: false });

    this.props.onDrop(event.dataTransfer.files);
  }

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
 * @param {Object} item - Item to be dropped.
 *
 * @returns {boolean}
 */
export function isDropableItem(item) {
  const { kind, type } = item;

  if (kind !== 'file') {
    return false;
  }

  return /^(text\/.*|application\/([^+]*\+)?xml|application\/(cmmn|bpmn|dmn))?$/.test(type);
}