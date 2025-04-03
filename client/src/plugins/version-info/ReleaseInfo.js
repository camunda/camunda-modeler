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
import * as css from './ReleaseInfo.less';

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
          <h4>Support for upcoming Camunda features</h4>
          Camunda 8.7 and 7.23 are now fully supported.
          Also, you can now configure <a href="https://docs.camunda.io/docs/next/components/modeler/bpmn/ad-hoc-subprocesses/?utm_source=modeler&utm_medium=referral#completion">completion attributes</a> of ad-hoc subprocesses.
        </li>
        <li>
          <h4>Support for process applications</h4>
          We now support <a href="https://docs.camunda.io/docs/8.7/components/modeler/desktop-modeler/process-applications/?utm_source=modeler&utm_medium=referral">process applications</a> and resource linking. You can use process applications to easily group processes, decisions, and forms in a project, and link them.
        </li>
        <li>
          <h4>RPA editor</h4>
          Edit, test and deploy <a href="https://docs.camunda.io/docs/8.7/components/rpa/overview/?utm_source=modeler&utm_medium=referral">Robotic Process Automation (RPA)</a> scripts with the new RPA editor.
        </li>
        <li>
          <h4>Bug fixes and more</h4>
          As always, this release incorporates bug fixes and additional minor improvements.
        </li>
      </ul>
    </div>
  );
}
