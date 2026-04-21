/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useMemo } from 'react';

import * as css from './RequiredInputsCard.less';

/**
 * RequiredInputsCard — lists the variables a selected element *reads*.
 *
 * Advisory only. The authoritative input form is the existing task-testing
 * editor rendered below. This card just tells the user "these are the names
 * the engine will look for" so they don't have to guess or scroll properties.
 *
 * Hidden entirely when:
 *   - no element selected
 *   - variableResolver not available (older bpmn-js)
 *   - the element has no read variables (clean elements don't deserve an
 *     empty card — less is more)
 */
export default function RequiredInputsCard({ element, injector }) {
  const variables = useMemo(() => {
    if (!element || !injector) return [];
    try {
      const resolver = injector.get('variableResolver', false);
      if (!resolver || !resolver.getVariablesForElement) return [];
      const result = resolver.getVariablesForElement(element, {
        read: true,
        written: false
      });
      return Array.isArray(result) ? result : [];
    } catch (e) {
      return [];
    }
  }, [ element, injector ]);

  if (!element || variables.length === 0) return null;

  return (
    <div className={ css.card } data-testid="validate-required-inputs">
      <div className={ css.title }>Required inputs</div>
      { variables.map(v => (
        <div key={ v.name } className={ css.row }>
          <span className={ css.name }>{ v.name }</span>
          { v.type ? <span className={ css.type }>{ v.type }</span> : null }
        </div>
      )) }
    </div>
  );
}
