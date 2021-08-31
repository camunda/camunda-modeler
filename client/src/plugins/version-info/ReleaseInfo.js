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
      <ul>
        <li>
          <b>New components for Forms</b><br />
          We added five additional form components such as select, checkbox, and radio
          button. We also included a markdown text component, which allows you to provide
          static information in your form.
        </li>
        <li>
          <b>Modeling guidance for Forms</b><br />
          By clicking on the platform label on the left side of the status bar,
          you can now select the execution platform you want to deploy the form to.
          This will lead to the form being validated to ensure that it can be successfully executed.
          The results will be presented in a new panel, helping you to find issues before the
          deployment.
        </li>
        <li>
          <b>Improved properties panel for Cloud BPMN diagrams</b><br />
          The properties panel for BPMN diagrams was modernized to
          provide an improved user experience. One fundamental change is that
          the tabs were replaced by expandable sections that indicate at a glance
          whether properties exist in the respective section.
        </li>
        <li>Plus, various smaller bug fixes and usability improvements.</li>
      </ul>

    </div>
  );
}
