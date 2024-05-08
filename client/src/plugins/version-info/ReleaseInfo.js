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
          <h4>Business knowledge model editing added to DMN modeling</h4>
          DMN modeling now supports implementing business knowledge models as literal expressions, offering more flexibility in decision modeling.
        </li>
        <li>
          <h4>Basic auth support for deployments to Camunda 8 self-managed</h4>
          For deployments to self-managed Camunda 8 instances secured with basic auth, you can now provide credentials when deploying.
        </li>
        <li>
          <h4>Support for arm64 on MacOS</h4>
          This release introduces arm64 support for MacOS, ensuring compatibility with Apple's latest hardware.
        </li>
        <li>
          <h4>Bug fixes and more</h4>
          As always, this release incorporates bug fixes and additional minor improvements.
        </li>
      </ul>
    </div>
  );
}
