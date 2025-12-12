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

import {
  Section,
} from '../../../shared/ui';

import { getMessageForReason } from '../shared/util';
import FormFeedback from '../../../shared/ui/form/FormFeedback';

export default function DeploymentConfigForm(props) {
  const {
    connectionCheckResult,
    onSubmit,
    renderDescription = null,
    renderHeader = null,
    renderSubmit = 'Submit',
    isSubmitting = false,
    handleChangeConnections,
    handleManageConnections
  } = props;

  return (
    <div>
      <Section>
        { renderHeader && (
          <Section.Header className="form-header">
            { renderHeader }
          </Section.Header>
        )}
        { renderDescription && (
          <Section.Body className="form-description">
            { renderDescription }
          </Section.Body>
        )}
        <Section.Body className="form-body">
          <Section.Actions>
            <div className="form-group">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={ isSubmitting }
                onClick={ () => onSubmit() }
              >
                { renderSubmit }
              </button>
              { connectionCheckResult?.success === false && (
                <FormFeedback
                  error={ <>
                    Could not establish connection: <br />
                    { getMessageForReason(connectionCheckResult?.reason) } <br />
                    <a href="#" onClick={ handleChangeConnections }>Change</a> or <a href="#" onClick={ handleManageConnections }>manage connections.</a>
                  </> }
                />
              )}
            </div>
          </Section.Actions>
        </Section.Body>
      </Section>
    </div>
  );
}
