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
          <b>Support for Camunda Cloud 1.2</b><br />
          With this release, we added new BPMN elements supported by Camunda Cloud 1.2.
          These new elements are message intermediate throw events, message end events, and manual tasks.
        </li>
        <li>
          <b>Form reference bindings for User Tasks and Start Events</b><br />
          With the Camunda Platform 7.16.0 release you now have an additional way to bind Camunda Forms to
          User Tasks or Start Events. Besides the existing way of binding using a
          <a href="https://docs.camunda.org/manual/latest/user-guide/task-forms/#form-key">form key</a>,
          you can now alternatively use a
          <a href="https://docs.camunda.org/manual/latest/user-guide/task-forms/#form-reference">form reference</a>.
          This allows you to bind a specific version, or the latest version from the deployment.
        </li>
        <li>
          <b>New rule sets to check the compatibility of Forms</b><br />
          In addition to existing versions, you can now select the latest Platform 7.16.0 and Cloud 1.2.0 versions in
          the Form editor. This allows you to easily check the compatibility of your form with the product version you are using.
        </li>
        <li>Plus, various smaller bug fixes and usability improvements.</li>
      </ul>

    </div>
  );
}
