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
          <h4>Redesigned append and context pads</h4>
          We redesigned the append and context pads for a cleaner, more focused modeling experience. Enable new context pad in the settings to try it out.
        </li>
        <li>
          <h4>Element templates with presets</h4>
          You can now apply element templates that come with presets, and step through their options directly from the append menu.
        </li>
        <li>
          <h4>Set a job priority</h4>
          Jobs can now be given a priority to control the order in which workers pick them up.
        </li>
        <li>
          <h4>See where your variables are used</h4>
          The variable outline now highlights the elements that read or write a selected variable, and picks up variables from even more properties.
        </li>
      </ul>
    </div>
  );
}
