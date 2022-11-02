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

import classnames from 'classnames';

import Panel from '../Panel';

import css from './LintingTab.less';

import ErrorIcon from '../../../../../resources/icons/Error.svg';
import SuccessIcon from '../../../../../resources/icons/Success.svg';
import WarningIcon from '../../../../../resources/icons/Warning.svg';

export default function LintingTab(props) {
  const {
    layout,
    linting,
    onAction,
    onLayoutChanged
  } = props;

  const onClick = (issue) => () => {
    onAction('showLintError', issue);
  };

  return <Panel.Tab
    id="linting"
    label="Problems"
    layout={ layout }
    number={ linting.length }
    onLayoutChanged={ onLayoutChanged }
    priority={ 1 }>
    { linting.length
      ? null
      : (
        <div className={ classnames(css.LintingIssue, 'linting-issue--empty') }>
          <div className="linting-issue__header">
            <SuccessIcon width="16" height="16" />
            <span className="linting-issue__label">No problems found.</span>
          </div>
        </div>
      )
    }
    {
      sortIssues(linting).map((issue => {
        const {
          id,
          message
        } = issue;

        return <LintingIssue
          key={ `${ id }-${ message }` }
          issue={ issue }
          onClick={ onClick(issue) }
        />;
      }))
    }
  </Panel.Tab>;
}

function LintingIssue(props) {
  const {
    issue,
    onClick
  } = props;

  const {
    category,
    id,
    name,
    message
  } = issue;

  return <div
    onClick={ onClick }
    className={ classnames(css.LintingIssue, 'linting-issue', {
      'linting-issue--error': category === 'error',
      'linting-issue--warning': category === 'warn'
    }) }>
    <div className="linting-issue__header">
      { category === 'error' ? <ErrorIcon width="16" height="16" /> : null }
      { category === 'warn' ? <WarningIcon width="16" height="16" /> : null }
      <span className="linting-issue__label">{ name || id }</span>
    </div>
    <div className="linting-issue__content">
      { message }
    </div>
  </div>;
}

function getName(issue) {
  const {
    id,
    name
  } = issue;

  if (name) {
    return name.toLowerCase();
  }

  return id.toLowerCase();
}

function sortIssues(issues) {
  return issues.sort((a, b) => {
    a = getName(a),
    b = getName(b);

    if (a === b) {
      return 0;
    } else if (a < b) {
      return -1;
    } else {
      return 1;
    }
  });
}
