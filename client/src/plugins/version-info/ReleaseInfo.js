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
      <ul>
        <li>
          <b>Support for Camunda Cloud 1.3</b><br />
          With this release, we added support for Camunda Cloud 1.3.<br />
          You can now assign a User Task to a specific assignee or to a group of candidates.
          Both fields can be configured in the assignment section of the properties panel using a static value or an expression.
          Learn more about this feature in the <a href="https://docs.camunda.io/docs/reference/bpmn-processes/user-tasks/user-tasks/#assignments">Camunda Cloud docs.</a>
        </li>
        <li>
          <b>Keep IDs when copy and pasting elements between diagrams</b><br />
          When you now copy BPMN elements between different diagrams, they will keep their original ID unless it is already used in the target diagram.
        </li>
      </ul>

    </div>
  );
}
