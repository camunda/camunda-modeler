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
          <h4>Element template runtime versions</h4>
          Define the runtime version for each element template to ensure compatibility with the Camunda runtime.
        </li>
        <li>
          <h4>Zeebe user task is now Camunda user task</h4>
          Implement user tasks as Camunda user tasks to ensure full compatibility.
        </li>
        <li>
          <h4>Improved FEEL support</h4>
          Access script task result expression easily thanks to context keys suggestions.
        </li>
        <li>
          <h4>Document preview component in Forms</h4>
          Model and view uploaded documents in a new preview component.
        </li>
        <li>
          <h4>Bug fixes and more</h4>
          This release includes bug fixes and additional minor improvements to enhance your experience.
        </li>
      </ul>
    </div>
  );
}
