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

import { EmptyState, Link } from '@camunda/design-system';

import { TriangleAlert } from '@camunda/design-system/icons';

import * as css from './ErrorTab.css';

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
          <EmptyState
            icon={ <TriangleAlert aria-hidden="true" /> }
            heading="Ooops, this should not have happened."
            description="This tab crashed due to an unexpected error."
            action={
              <Link href="https://github.com/camunda/camunda-modeler/issues/new?template=BUG_REPORT.yml">
                Report bug
              </Link>
            }
          />
        </div>
      </TabContainer>
    );
  }
}
