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
          Also, you can now configure <a href="https://docs.camunda.io/docs/next/components/modeler/bpmn/ad-hoc-subprocesses/#completion">attributes</a> of ad-hoc subprocesses, and in forms, you can pass a custom module to define URL-building logic for document URLs in the preview component.
        </li>
        <li>
          <h4>Support for process applications</h4>
          {/* TODO: link process application docs */}
          We now support process application and resource linking. You can use process applications to bundle related files and deploy them all at once, as in <a href="https://docs.camunda.io/docs/8.7/components/modeler/web-modeler/process-applications/">Web Modeler.</a>
        </li>
        <li>
          <h4>Added RPA editor</h4>
          We introduced <a href="https://docs.camunda.io/docs/8.7/components/modeler/rpa/">Robotic Process Automation (RPA)</a> editor to write scripts to be executed by the RPA worker.
        </li>
        <li>
          <h4>Bug fixes and more</h4>
          As always, this release incorporates bug fixes and additional minor improvements.
        </li>
      </ul>
    </div>
  );
}
