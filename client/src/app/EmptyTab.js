import React, { PureComponent } from 'react';

import Slot from './slot-fill/Slot';

import css from './EmptyTab.less';

import {
  Tab
} from './primitives';


export default class EmptyTab extends PureComponent {

  componentDidMount() {
    this.props.onShown();
  }

  triggerAction() {}

  render() {

    const {
      onAction
    } = this.props;

    return (
      <Tab className={ css.EmptyTab }>
        <p className="create-buttons">
          <span>Create a </span>
          <button className="create-bpmn" onClick={ () => onAction('create-bpmn-diagram') }>BPMN diagram</button>
          <span> or </span>
          <button onClick={ () => onAction('create-dmn-diagram') }>DMN diagram</button>
          <span> or </span>
          <button onClick={ () => onAction('create-cmmn-diagram') }>CMMN diagram</button>
        </p>

        <Slot name="empty-tab-buttons" />
      </Tab>
    );
  }
}