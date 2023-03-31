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
          Text components now support FEEL templating.
          Forms now support more flexible layouts by allowing to arrange components in columns.
        </li>
        <li>
          <h4>Visual grid for diagrams</h4>
          Modeling BPMN and DMN diagrams is easier with the new visual grid.
        </li>
        <li>
          <h4>Example data output for Camunda 8 BPMN</h4>
          The added `Data` section the the properties panel allows adding example data to elements which is used to provide variable suggestions in output mappings and/or the process.
        </li>
        <li>
          <h4>Extended support for Camunda 8 and Camunda 7 BPMN</h4>
          Added support for due and follow-up date properties for user tasks, catch-all error events, and signal start events in Camunda 8.
        </li>
      </ul>
    </div>
  );
}
