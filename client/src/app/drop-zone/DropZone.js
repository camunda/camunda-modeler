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

import * as css from './DropZone.less';
import { DropHandler } from './DropHandler';

export { isDroppableItem } from './DropHandler';

export class DropZone extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      draggingOver: false
    };
    this.dropHandler = new DropHandler(props.onDrop, props.getFilePath);
  }

  handleDragOver = event => {
    const state = this.dropHandler.handleDragOver(event);

    this.setState({ draggingOver: state });
  };

  handleDragLeave = event => {
    const state = this.dropHandler.handleDragLeave(event);

    this.setState({ draggingOver: state });
  };

  handleDrop = async (event) => {
    const state = this.dropHandler.handleDrop(event);

    this.setState({ draggingOver: state });
  };

  render() {
    return (
      <div
        className={ css.DropZone }
        onDragOver={ this.handleDragOver }
        onDragLeave={ this.handleDragLeave }
        onDrop={ this.handleDrop }
      >
        { this.state.draggingOver === DropHandler.STATES.DRAGGING ? <DropOverlay /> : null }
        { this.props.children }
      </div>
    );
  }
}

DropZone.defaultProps = {
  onDrop: () => {},
  getFilePath: () => {}
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
