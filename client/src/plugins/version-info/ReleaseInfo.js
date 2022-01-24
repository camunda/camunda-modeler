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
import css from './ReleaseInfo.less';

/**
 * Release info notice which is displayed once user clicks the version number on the status bar.
 *
 * Custom-styled HTML tags which you can use in the notice include:
 *
 *   * `h1-4`
 *   * `a`
 *   * `p`
 *   * `ul`
 *   * `ol`
 *
 * Notice that the text content of the `<a href>` is used as a label for usage tracking.
 * Therefore, it's essential to use [clear link wording](https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML/Creating_hyperlinks#use_clear_link_wording).
 *
 * @example
 *
 * ```jsx
 * <div className={ css.ReleaseInfo }>
 *   <h1>New Form Inputs</h1>
 *   <p>This release adds support for the following input fields:</p>
 *   <ul>
 *     <li>Number</li>
 *     <li>Password</li>
 *   </ul>
 *   <p>To learn more, read <a href="...">Camunda Forms documentation</a></p>
 * </div>
 * ```
 */
export function ReleaseInfo(props) {
  return (
    <div className={ css.ReleaseInfo }>
      <ul className="dashed">
        <li>
          <h4>Support for Camunda Cloud 1.4</h4>
          With this release, we added support for Camunda Cloud 1.4.<br />
          You can now evaluate DMN decision in a Business Rules Task.
          Specify called decision by ID and assign the result to a variable via the properties panel.
          Learn more about this feature in the <a href="https://docs.camunda.io/docs/components/modeler/bpmn/business-rule-tasks/business-rule-tasks/">Camunda Cloud docs on Business Rule Task.</a>
        </li>
        <li>
          <h4>New properties panel</h4>
          The properties panel has been completely redesigned.
          Tabs have been replaced with sections which can be opened and closed individually.
          A granular breakdown with clear titles allows to identify relevant topics at a glance.
        </li>
        <li>
          <h4>Global information panel</h4>
          On the bottom of the window, you will find a new panel which displays information about the current process.
          Currently, it allows to identify elements unsupported by the selected engine version.
        </li>
        <li>Plus, various smaller bug fixes and usability improvements.</li>
      </ul>
    </div>
  );
}
