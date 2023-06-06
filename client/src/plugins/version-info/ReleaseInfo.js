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
          <h4>New features in forms</h4>
          Form elements can now be resized on the grid.
          Input fields can be configured to be read-only.
        </li>
        <li>
          <h4>Improvements to deployment tool</h4>
          The deployment tool has received some UX improvements, such as: linking to a troubleshooting page with common connection problems; automatically inferring port if not provided; and providing a deep link to the deployed process definition.
        </li>
        <li>
          <h4>Unified bottom panel</h4>
          The log and problems panels have been merged into a single resizable bottom panel.
        </li>
        <li>
          <h4>Extended support for Camunda 8 BPMN</h4>
          Added support for signal intermediate throw and end events. Try out upcoming Camunda 8.3 features today.
        </li>
        <li>
          <h4>And many more general improvements</h4>
          This release is packed with small improvements and bug fixes. Check out the full <a href="https://github.com/camunda/camunda-modeler/blob/develop/CHANGELOG.md#5120">Changelog</a> for more details.
        </li>
      </ul>
    </div>
  );
}
