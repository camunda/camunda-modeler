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
          <h4>Better BPMN support in Camunda Platform 8.1</h4>
          Camunda Platform 8.1 now supports <a title="Camunda Platform Docs" href="https://docs.camunda.io/docs/components/modeler/bpmn/inclusive-gateways/">diverging inclusive gateways</a> and <a title="Camunda Platform Docs" href="https://docs.camunda.io/docs/components/modeler/bpmn/terminate-events/">terminate end events</a>.
          Additionally, you can now use cron in your timer definitions.
        </li>
        <li>
          <h4>New form components and dynamic data loading</h4>
          When designing forms, you can now use two multi-select components: <a title="Camunda Platform Docs" href="https://docs.camunda.io/docs/components/modeler/forms/form-element-library/forms-element-library-taglist/">Taglist</a> and <a title="Camunda Platform Docs" href="https://docs.camunda.io/docs/components/modeler/forms/form-element-library/forms-element-library-checklist/">Checklist</a>. To populate your
          select components with process data, select "Input data" as an <a title="Camunda Platform Docs" href="https://docs.camunda.io/docs/components/modeler/forms/configuration/forms-config-options/">options source</a>.
        </li>
        <li>
          <h4>Improved FEEL editor support</h4>
          The FEEL editor now offers improved indentation support and built-in suggestions. When typing, you will get a list of supported
          functions and operators which you can use in FEEL.
        </li>
      </ul>
    </div>
  );
}
