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
          <h4>Model all elements for Camunda 8</h4>
          The BPMN editor now supports drawing all BPMN symbols while it also indicates which elements are not supported in the engine.
        </li>
        <li>
          <h4>Improved validation infrastructure</h4>
          Editor now supports errors and warnings as problem types. Contribute your own validators with <a href="https://github.com/camunda/camunda-modeler-custom-linter-rules-plugin">linter plugins</a>.
        </li>
        <li>
          <h4>New replace menu UI in the BPMN editor</h4>
          Easily find the replacement element you are looking for with the search feature in the menu.
        </li>
        <li>
          <h4>Camunda 8.2 and 7.19 preview</h4>
          Select the upcoming Camunda versions for preview of the new features. This includes support for link events in Camunda 8.
        </li>
      </ul>
    </div>
  );
}
