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
          <h4>New form fields and more in the Form editor</h4>
          The form editor now supports text area, datetime, and image form fields. Add conditions to form fields to control visibility.
        </li>
        <li>
          <h4>New color picker in the BPMN editor</h4>
          Color one or more elements using the new color picker that is accessible through the context menu.
        </li>
        <li>
          <h4>Element templates accessible through replace menu</h4>
          Apply and unlink element templates directly through the replace menu. With an element selected, press <kbd>R</kbd> to open the replace menu.
        </li>
        <li>
          <h4>Extended support for using FEEL in Camunda 8 BPMN</h4>
          FEEL expressions can be used for script task implementations and as error codes.
        </li>
      </ul>
    </div>
  );
}
