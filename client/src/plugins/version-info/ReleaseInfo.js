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

import { isMac } from '../../globals';

// If you add links to the release info, make sure to track them with UTM tags
// import { utmTag } from '../../util/utmTag';

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
          <h4>Cut action</h4>
          Use <code>{isMac ? 'Cmd+X' : 'Ctrl+X'}</code> to cut BPMN elements and move them across diagrams.
        </li>
        <li>
          <h4>Copy selection as image</h4>
          Copy selected BPMN elements as an image to easily paste them anywhere.
        </li>
        <li>
          <h4>Conditional events modeling</h4>
          Model conditional events in your BPMN diagrams to trigger flows based on data conditions.
        </li>
        <li>
          <h4>New FEEL functions</h4>
          Use <code>from json</code> and <code>to json</code> functions to convert between JSON strings and FEEL values.
        </li>
        <li>
          <h4>FEEL expressions for Form ID</h4>
        </li>
        <li>
          <h4>Variable name validation</h4>
        </li>
      </ul>
    </div>
  );
}
