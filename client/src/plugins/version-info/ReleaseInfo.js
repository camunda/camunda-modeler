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
          <h4>Context pad for multi-selection</h4>
          This release adds the context pad to multiple selected elements.<br />
          You can now conveniently perform actions on multiple elements, such as Align and Distribute.
          We also improved the behavior of this actions to be more intuitive and to give you more control.
        </li>
        <li>
          <h4>Refined selection UX</h4>
          We refined the whole selection behavior to make changes to complex process models more convenient.<br />
          This includes an improved selection outline and a dedicated multi-selection state in the properties panel.
        </li>
        <li>
          <h4>Conditional properties for element templates</h4>
          This release adds support for conditional properties in your element templates.<br />
          This allows you to define element template properties to be conditionally shown/hidden and bound to the diagram,
          making the properties panel and the resulting BPMN model responsive to user input.<br />
          You can learn more about how to define conditional properties in the <a href="https://docs.camunda.io/docs/components/modeler/desktop-modeler/element-templates/defining-templates/?utm_source=modeler&utm_medium=referral">element templates documentation</a>.
        </li>
        <li>
          <h4>Adjusted telemetry</h4>
          We carefully added additional data points to our telemetry to better understand how our app works.
          As always, you decide whether you want that information to be shared.<br />
          Find a comprehensive overview of what we track, how we do this and why in our <a href="https://docs.camunda.io/docs/components/modeler/desktop-modeler/telemetry/?utm_source=modeler&utm_medium=referral">telemetry documentation</a>.
        </li>
      </ul>
    </div>
  );
}
