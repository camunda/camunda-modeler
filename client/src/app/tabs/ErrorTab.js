/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { PureComponent } from 'react';

import css from './ErrorTab.less';

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
