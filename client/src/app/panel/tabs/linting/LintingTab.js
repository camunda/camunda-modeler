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

import { isNil } from 'min-dash';

import Panel from '../../Panel';

import LintingStatusBarItem from './LintingStatusBarItem';

import css from './LintingTab.less';

import ErrorIcon from '../../../../../resources/icons/Error.svg';
import LaunchIcon from '../../../../../resources/icons/Launch.svg';
import SuccessIcon from '../../../../../resources/icons/Success.svg';
import WarningIcon from '../../../../../resources/icons/Warning.svg';

export default function LintingTab(props) {
  const {
    layout = {},
    linting: reports,
    onAction,
    onLayoutChanged
  } = props;

  const onClick = (report) => () => {
    onAction('showLintError', report);
  };

  const onToggle = () => {
    const { panel = {} } = layout;

    if (!panel.open || panel.tab !== 'linting') {
      onAction('open-panel', { tab: 'linting' });
    } else if (panel.tab === 'linting') {
      onAction('close-panel');
    }
  };

  return <>
    <Panel.Tab
      id="linting"
      label="Problems"
      layout={ layout }
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
    </Panel.Tab>
    <LintingStatusBarItem
      layout={ layout }
      linting={ reports }
      onToggle={ onToggle } />
  </>;
}

function LintingTabItem(props) {
  const {
    report,
    onClick
  } = props;

  const {
    category,
    documentation = {},
    id,
    name,
    message,
    rule
  } = report;

  if (isRuleError(report)) {
    return <div
      className={ classnames(css.LintingTabItem, 'linting-tab-item', 'linting-tab-item--rule-error') }>
      <div className="linting-tab-item__header">
        <ErrorIcon width="16" height="16" />
        <span className="linting-tab-item__label">Rule error</span>
      </div>
      <div className="linting-tab-item__content">
        { `Rule <${ rule }> errored with the following message: ${ message }` }
      </div>
    </div>;
  }

  const { url: documentationUrl = null } = documentation;

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
      {
        !isNil(documentationUrl) && <>
          <a className="linting-tab-item__link" href={ documentationUrl } target="_blank" rel="noopener noreferrer" onClick={ stopPropagation }>
            <LaunchIcon width="12" height="12" viewBox="0 0 12 12" />
          </a>
        </>
      }
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
 * 1. rule success or error
 * 2. category
 * 3. name or ID
 *
 * @param {Object[]} reports
 *
 * @returns {Object[]}
 */
function sortReports(reports) {
  return [ ...reports ].sort((a, b) => {
    if (isRuleError(a)) {
      return 1;
    } else if (isRuleError(b)) {
      return -1;
    }

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

function isRuleError(report) {
  return report.category === 'rule-error';
}

function stopPropagation(event) {
  event.stopPropagation();
}
