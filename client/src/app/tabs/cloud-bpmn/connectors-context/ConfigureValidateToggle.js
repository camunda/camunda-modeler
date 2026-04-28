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

import { ContentSwitcher, Switch } from '@carbon/react';

import * as css from './ConfigureValidateToggle.less';

/**
 * Configure / Validate header toggle.
 *
 * Replaces the implicit "click the side-rail tab name" mode-switch with a
 * prominent in-header segmented control. Configure ↔ Validate routes between
 * the two existing SidePanel tabs:
 *   - Configure → tab id 'properties' (bpmn-io properties panel, untouched)
 *   - Validate  → tab id 'test'       (existing TaskTestingTab, untouched)
 *
 * Universal: rendered in the SidePanel header above the tab content, so it
 * surfaces for every selected element regardless of type. The toggle does not
 * own state; it reads the active tab from props and emits intent via
 * onSwitchTab(tabId). The parent (BpmnEditor) wires the actual layout change.
 *
 * @param {object} props
 * @param {string} props.activeTab     - currently active SidePanel tab id ('properties' | 'test')
 * @param {function} props.onSwitchTab - called with 'properties' or 'test'
 */
export default function ConfigureValidateToggle({ activeTab, onSwitchTab }) {

  // Map tab id → switcher index (0 = Configure, 1 = Validate). Anything other
  // than 'test' is treated as Configure so we don't ghost the toggle when the
  // user is on a future third tab (e.g. Variables).
  const selectedIndex = activeTab === 'test' ? 1 : 0;

  const handleChange = ({ index }) => {
    const next = index === 1 ? 'test' : 'properties';
    if (next !== activeTab) onSwitchTab(next);
  };

  return (
    <div className={ css.configureValidateToggle }>
      <ContentSwitcher
        size="sm"
        selectedIndex={ selectedIndex }
        onChange={ handleChange }
      >
        <Switch name="properties" text="Configure" />
        <Switch name="test" text="Validate" />
      </ContentSwitcher>
    </div>
  );
}
