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

import * as css from './ErrorTab.less';

import {
  TabContainer
} from '../primitives';


export default class ErrorTab extends PureComponent {

  triggerAction(action) {
    if (action === 'save') {
      return this.props.xml;
    }
  }

  render() {
    return (
      <TabContainer className="content tab">
        <div className={ css.ErrorTab }>
          <h1>
            Ooops, this should not have happened.
          </h1>
          <p>
            This tab crashed due to an unexpected error.
          </p>
          <p>
            <a href="https://github.com/camunda/camunda-modeler/issues/new?template=BUG_REPORT.md">
              Report bug
            </a>
          </p>
        </div>
      </TabContainer>
    );
  }
}
