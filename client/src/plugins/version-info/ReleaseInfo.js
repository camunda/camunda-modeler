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
import * as css from './ReleaseInfo.css';

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
          <h4>Revamped Modeler UI</h4>
          The Modeler now uses the Camunda design system. Plug-ins using Carbon need to switch to the plug-in helper components instead.
        </li>
        <li>
          <h4>Camunda 8 connections as a list</h4>
          Camunda 8 connections are now displayed in a list. Use the new dialog-based UI to add and modify them.
        </li>
        <li>
          <h4>Custom element template sources</h4>
          In addition to the Camunda Marketplace endpoint, you can now add custom registries to automatically download and update element templates.
        </li>
        <li>
          <h4>Clearer create and append menu</h4>
          The menu now shows all element types in each category, with less common task and gateway options listed last.
        </li>
      </ul>
    </div>
  );
}
