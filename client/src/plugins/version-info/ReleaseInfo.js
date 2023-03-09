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
          <h4>More Complex Conditions for Element Template Properties</h4>
          Element Templates now support multiple conditions and allow you to create more complex templates. Learn how to use conditional properties in <a href="https://docs.camunda.io/docs/next/components/modeler/desktop-modeler/element-templates/defining-templates/#defining-conditional-properties">our docs</a>.
        </li>
        <li>
          <h4>Extended support for Camunda 8 BPMN</h4>
          Added support for modeling catch-all events. Try out upcoming Camunda 8.2 features today.
        </li>
        <li>
          <h4>And More!</h4>
          This release includes a lot of smaller improvements and bug-fixes. Check out the full <a href="https://github.com/camunda/camunda-modeler/blob/develop/CHANGELOG.md#590">Changelog</a> for more details.
        </li>
      </ul>
    </div>
  );
}
