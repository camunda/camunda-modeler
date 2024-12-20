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

import { Fill } from '../../../slot-fill';

import LintingStatusBarItem from './LintingStatusBarItem';

import * as css from './LintingTab.less';

import ErrorIcon from '../../../../../resources/icons/Error.svg';
import LaunchIcon from '../../../../../resources/icons/Launch.svg';
import SuccessIcon from '../../../../../resources/icons/Success.svg';
import WarningIcon from '../../../../../resources/icons/Warning.svg';
import InfoIcon from '../../../../../resources/icons/InformationCircle.svg';

export default function LintingTab(props) {
  const {
    layout = {},
    linting: reports,
    onAction
  } = props;

  const onClick = (report) => () => {
    if (!window.getSelection().toString().length) {
      onAction('showLintError', report);
    }
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
    <Fill slot="bottom-panel"
      id="linting"
      label="Problems"
      layout={ layout }
      priority={ 10 }>
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
        sortReports(reports).map(((report, index) => {
          return <LintingTabItem
            key={ index }
            report={ report }
            onClick={ onClick(report) }
          />;
        }))
      }
    </Fill>
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
    meta,
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

  const documentationUrl = meta?.documentation?.url;
  const reportName = getReportName(report);

  return <div
    onClick={ onClick }
    className={ classnames(css.LintingTabItem, 'linting-tab-item', {
      'linting-tab-item--error': category === 'error',
      'linting-tab-item--warning': category === 'warn',
      'linting-tab-item--info': category === 'info'
    }) }>
    <button className="linting-tab-item__header" onClick={ onClick }>
      { category === 'error' ? <ErrorIcon width="16" height="16" /> : null }
      { category === 'warn' ? <WarningIcon width="16" height="16" /> : null }
      { category === 'info' ? <InfoIcon width="16" height="16" /> : null }
      <span className="linting-tab-item__label">{ reportName }</span>
    </button>
    <div className="linting-tab-item__content">
      { message }
      {
        !isNil(documentationUrl) && <>
          <a
            className="linting-tab-item__link"
            href={ documentationUrl }
            target="_blank" rel="noopener noreferrer"
            onClick={ stopPropagation }
            title="Go to documentation">
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
    name,
  } = report;

  return name || id || '';
}

/**
 * Sort reports by:
 *
 * 1. rule success or error
 * 2. category
 *   2.1 error
 *   2.2 warning
 *   2.3 info
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
      a = getReportName(a).toLowerCase(),
      b = getReportName(b).toLowerCase();

      if (a === b) {
        return 0;
      } else if (a < b) {
        return -1;
      } else {
        return 1;
      }

    } else if (a.category === 'error') {
      return -1;
    } else if (a.category === 'warning') {
      return -1;
    } else if (b.category === 'error') {
      return 1;
    } else if (b.category === 'warning') {
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
