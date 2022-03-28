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
          <h4>Support for Camunda 8</h4>
          With this release, we added support for Camunda 8.<br />
          You can now model BPMN and DMN diagrams as well as Forms for Camunda 8.
          Using plugins, you can now also customize the Modeler specifically for Camunda 8.
          Element templates will now work for Camunda 8 BPMN diagrams, too.
          We will now also use a more concise naming: <i>Camunda Platform</i> becomes Camunda 7
          and <i>Camunda Cloud</i> becomes Camunda 8.<br />
          Learn more about Camunda 8 in general <a href="https://camunda.com/blog/2022/04/camunda-platform-8-orchestrate-all-the-things?utm_source=modeler&utm_medium=referral">in the Camunda 8 blogpost.</a>
        </li>
        <li>
          <h4>Improved overall UI to become a "Visual IDE"</h4>
          We re-worked the entire Modeler, including welcome screen, properties panel, status bar, tab bar, and bottom panel
          following our visions of a "Visual IDE".<br />
          Learn more <a href="https://camunda.com/blog/2022/01/camunda-modeler-5-0-0-alpha-0-released?utm_source=modeler&utm_medium=referral">in a dedicated blog post about the UI improvements</a>.
        </li>
        <li>
          <h4>Process Debugging for Camunda 8 BPMN diagrams</h4>
          The Modeler will now support you when automating BPMN processes with Camunda 8 by showing implementation errors,
          and giving hints on how to fix them.
        </li>
        <li>
          <h4>Support drill down into collapsed subprocesses</h4>
          In Camunda 7 BPMN diagrams, you can now model collapsed subprocesses by
          collapsing an expanded subprocess. Use the blue drill down icon to view and model the contents of the subprocess.
        </li>
        <li>
          <h4>New customization features for element templates</h4>
          We added various new element templates features: <a href="https://docs.camunda.io/docs/components/modeler/desktop-modeler/element-templates/defining-templates/?utm_source=modeler&utm_medium=referral#groups">custom grouping</a>, <a href="https://docs.camunda.io/docs/components/modeler/desktop-modeler/element-templates/defining-templates/?utm_source=modeler&utm_medium=referral">documentation reference</a>, <a href="https://docs.camunda.io/docs/components/modeler/desktop-modeler/element-templates/defining-templates/?utm_source=modeler&utm_medium=referral">target element type</a>, and <a href="https://docs.camunda.io/docs/components/modeler/desktop-modeler/element-templates/defining-templates/?utm_source=modeler&utm_medium=referral#icons">custom task icons</a>.<br />
          Discover all configuration options <a href="https://docs.camunda.io/docs/components/modeler/desktop-modeler/element-templates/about-templates/?utm_source=modeler&utm_medium=referral">in the element templates docs</a>.
        </li>
      </ul>
    </div>
  );
}
