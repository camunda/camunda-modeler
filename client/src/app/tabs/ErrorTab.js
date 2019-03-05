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
            Unexpected Error
          </h1>
          <p>
            An unexpected error occurred in this tab. Please click the link below to report
            an issue on GitHub. You can also save the latest known state of the tab.
          </p>
          <p>
            <a href="https://github.com/camunda/camunda-modeler/issues/new/choose">
              Report an issue.
            </a>
          </p>
        </div>
      </TabContainer>
    );
  }
}
