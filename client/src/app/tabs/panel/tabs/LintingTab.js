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
    label="Errors"
    layout={ layout }
    number={ linting.length }
    onLayoutChanged={ onLayoutChanged }
    priority={ 1 }>
    { linting.length
      ? null
      : (
        <div className={ classnames(css.LintingIssue, 'linting-issue') }>
          <div className="linting-issue__text">
            <span className="linting-issue__message">No errors.</span>
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
          onClick={ onClick(issue) } />;
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
    id,
    name,
    message
  } = issue;

  return <div className={ classnames(css.LintingIssue, 'linting-issue') }>
    <div className="linting-issue__icon">
      <ErrorIcon viewBox="2 2 20 20" />
    </div>
    <div className="linting-issue__text">
      Error : <span className="linting-issue__link" onClick={ onClick }>{ name || id }</span> - <span className="linting-issue__message">{ message }</span>
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