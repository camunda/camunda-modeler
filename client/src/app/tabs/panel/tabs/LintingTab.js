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
    linting: reports,
    onAction,
    onLayoutChanged
  } = props;

  const onClick = (report) => () => {
    onAction('showLintError', report);
  };

  return <Panel.Tab
    id="linting"
    label="Problems"
    layout={ layout }
    number={ reports.length }
    onLayoutChanged={ onLayoutChanged }
    priority={ 1 }>
    { reports.length
      ? null
      : (
        <div className={ classnames(css.LintingTabItem, 'linting-tab-item--empty') }>
          <div className="linting-tab-item__header">
            <SuccessIcon width="16" height="16" />
            <span className="linting-tab-item__label">No problems found.</span>
          </div>
        </div>
      )
    }
    {
      sortReports(reports).map((report => {
        const {
          id,
          message
        } = report;

        return <LintingTabItem
          key={ `${ id }-${ message }` }
          report={ report }
          onClick={ onClick(report) }
        />;
      }))
    }
  </Panel.Tab>;
}

function LintingTabItem(props) {
  const {
    report,
    onClick
  } = props;

  const {
    category,
    id,
    name,
    message
  } = report;

  return <div
    onClick={ onClick }
    className={ classnames(css.LintingTabItem, 'linting-tab-item', {
      'linting-tab-item--error': category === 'error',
      'linting-tab-item--warning': category === 'warn'
    }) }>
    <div className="linting-tab-item__header">
      { category === 'error' ? <ErrorIcon width="16" height="16" /> : null }
      { category === 'warn' ? <WarningIcon width="16" height="16" /> : null }
      <span className="linting-tab-item__label">{ name || id }</span>
    </div>
    <div className="linting-tab-item__content">
      { message }
    </div>
  </div>;
}

function getReportName(report) {
  const {
    id,
    name
  } = report;

  if (name) {
    return name.toLowerCase();
  }

  return id.toLowerCase();
}

/**
 * Sort reports by:
 *
 * 1. category
 * 2. name or ID
 *
 * @param {Object[]} reports
 *
 * @returns {Object[]}
 */
function sortReports(reports) {
  return [ ...reports ].sort((a, b) => {
    if (a.category === b.category) {

      a = getReportName(a),
      b = getReportName(b);

      if (a === b) {
        return 0;
      } else if (a < b) {
        return -1;
      } else {
        return 1;
      }

    } else if (a.category === 'error') {
      return -1;
    } else if (b.category === 'error') {
      return 1;
    }
  });
}
