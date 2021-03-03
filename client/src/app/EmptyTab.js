/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { PureComponent } from 'react';

import css from './EmptyTab.less';

import {
  Tab
} from './primitives';

import Flags, { DISABLE_DMN } from '../util/Flags';


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
        <div className="create-buttons">
          <p>Create a new file:</p>
          <button className="btn btn-secondary" onClick={ () => onAction('create-bpmn-diagram') }>BPMN diagram (Camunda Engine)</button>
          <button className="btn btn-secondary" onClick={ () => onAction('create-cloud-bpmn-diagram') }>BPMN diagram (Zeebe Engine)</button>
          {
            !Flags.get(DISABLE_DMN) && (
              <button className="btn btn-secondary" onClick={ () => onAction('create-dmn-diagram') }>DMN diagram (Camunda DMN Engine)</button>
            )
          }
        </div>
      </Tab>
    );
  }
}
