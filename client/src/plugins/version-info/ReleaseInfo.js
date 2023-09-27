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
          <h4>Forms improvements</h4>
          Added a group component and support for nested data (form keys).
        </li>
        <li>
          <h4>FEEL tooling inside the DMN editor</h4>
          Integrated inside the DMN editor, our FEEL tooling helps you to create better decision tables faster.
        </li>
        <li>
          <h4>A better deploy experience</h4>
          The deploy tool ships with improved UI and error handling, providing more useful feedback when things go awry.
        </li>
        <li>
          <h4>Improved Camunda 8 coverage, bug fixes, and more</h4>
          Added support for signal events, a new Camunda 8 feature. As always, this release incorporates bug fixes and additional minor improvements.
        </li>
      </ul>
    </div>
  );
}
