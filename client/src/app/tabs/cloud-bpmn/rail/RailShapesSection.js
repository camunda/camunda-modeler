/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useCallback, useState } from 'react';

import { Bot } from '@carbon/icons-react';

import { useRailTooltipAnchor } from './RailTooltip';
import RailShapeFlyout from './RailShapeFlyout';
import { getShapeVariants } from './shapeVariants';

import * as css from './ModeRail.less';

/**
 * Metadata for every primary shape button. Variants are sourced from
 * `shapeVariants.js` — this table just holds the primary-button presentation
 * (label + glyph).
 *
 * Icons use the bpmn-js icon font (imported globally via
 * `client/src/styles/_modeling.less`). Keeping canonical BPMN glyphs means
 * modelers recognize shapes without relearning a custom iconography.
 */
const PRIMARY_DEFS = {
  'bpmn:StartEvent': {
    label: 'Start event',
    iconClass: 'bpmn-icon-start-event-none'
  },
  'bpmn:EndEvent': {
    label: 'End event',
    iconClass: 'bpmn-icon-end-event-none'
  },
  'bpmn:Task': {
    label: 'Task',
    iconClass: 'bpmn-icon-task'
  },
  'bpmn:ServiceTask': {
    label: 'Service task',
    iconClass: 'bpmn-icon-service-task'
  },
  'bpmn:UserTask': {
    label: 'User task',
    iconClass: 'bpmn-icon-user-task'
  },
  'bpmn:ScriptTask': {
    label: 'Script task',
    iconClass: 'bpmn-icon-script-task'
  },
  'bpmn:BusinessRuleTask': {
    label: 'Business rule task',
    iconClass: 'bpmn-icon-business-rule-task'
  },
  'bpmn:CallActivity': {
    label: 'Call activity',
    iconClass: 'bpmn-icon-call-activity'
  },
  'bpmn:IntermediateCatchEvent': {
    label: 'Intermediate event',
    iconClass: 'bpmn-icon-intermediate-event-none'
  },
  'bpmn:IntermediateThrowEvent': {
    label: 'Intermediate throw event',
    iconClass: 'bpmn-icon-intermediate-event-throw-message'
  },
  'bpmn:ExclusiveGateway': {
    label: 'Gateway',
    iconClass: 'bpmn-icon-gateway-none'
  },
  'bpmn:ParallelGateway': {
    label: 'Parallel gateway (AND)',
    iconClass: 'bpmn-icon-gateway-parallel'
  },
  'bpmn:EventBasedGateway': {
    label: 'Event-based gateway',
    iconClass: 'bpmn-icon-gateway-eventbased'
  },
  'bpmn:SubProcess': {
    label: 'Sub-process',
    iconClass: 'bpmn-icon-subprocess-expanded'
  },
  'bpmn:ManualTask': {
    label: 'Manual task',
    iconClass: 'bpmn-icon-manual-task'
  },
  'bpmn:TextAnnotation': {
    label: 'Text annotation',
    iconClass: 'bpmn-icon-text-annotation'
  },
  'bpmn:AdHocSubProcess': {
    label: 'AI Agents',
    Icon: Bot
  }
};

/**
 * RailShapesSection — renders a button per primary shape. If the primary has
 * variants (per `shapeVariants.js`), clicking opens a flyout; otherwise the
 * button directly starts a `create.start` drag (legacy flat behavior preserved
 * for single-variant primaries like StartEvent / EndEvent / SubProcess).
 */
export default function RailShapesSection({ modeler, shapes, mode }) {
  const [ flyout, setFlyout ] = useState(null); // { primaryType, anchorRect }

  const closeFlyout = useCallback(() => setFlyout(null), []);

  if (!shapes || !shapes.length) {
    return (
      <div className={ css.sectionCollapsed } aria-hidden="true" />
    );
  }

  const handleFlatStart = (event, primaryType) => {
    if (!modeler) return;
    const create = modeler.get('create');
    const elementFactory = modeler.get('elementFactory');

    const attrs = buildPrimaryAttrs(primaryType);
    const shape = elementFactory.createShape(attrs);

    create.start(event, shape);
  };

  const handleFlyoutOpen = (primaryType, anchorRect) => {
    setFlyout({ primaryType, anchorRect });
  };

  const flyoutVariants = flyout ? getShapeVariants(flyout.primaryType) : null;

  return (
    <div
      className={ `${css.section} ${css.sectionShapes}` }
      role="group"
      aria-label={ `Shapes for ${mode} mode` }
    >
      { shapes.map(primaryType => {
        const def = PRIMARY_DEFS[primaryType];
        if (!def) return null;
        const variants = getShapeVariants(primaryType);
        const isActive = flyout && flyout.primaryType === primaryType;

        return (
          <PrimaryShapeButton
            key={ primaryType }
            def={ def }
            hasVariants={ Boolean(variants) }
            isActive={ isActive }
            onFlat={ (event) => handleFlatStart(event.nativeEvent, primaryType) }
            onFlyout={ (rect) => handleFlyoutOpen(primaryType, rect) }
          />
        );
      }) }

      { flyout && flyoutVariants && (
        <RailShapeFlyout
          anchorRect={ flyout.anchorRect }
          variants={ flyoutVariants.variants }
          label={ flyoutVariants.label }
          modeler={ modeler }
          onClose={ closeFlyout }
        />
      ) }
    </div>
  );
}

function PrimaryShapeButton({ def, hasVariants, isActive, onFlat, onFlyout }) {

  // Tooltips on primary buttons. For flat primaries, the tooltip shows during
  // the hover → drag-start window. For variant primaries, it hints that there
  // are variants to pick from.
  const tooltipProps = useRailTooltipAnchor({
    label: hasVariants ? `${def.label} (pick variant)` : def.label
  });

  // Variant primaries are launchers (click opens flyout), not drag sources.
  // The flyout's variant buttons are the drag sources — see RailShapeFlyout.
  const handleClick = (event) => {
    if (!hasVariants) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    onFlyout(rect);
  };

  // Flat primaries drag directly via create.start on mousedown.
  const handleMouseDown = hasVariants ? undefined : onFlat;

  return (
    <button
      type="button"
      className={ `${css.button} ${hasVariants ? css['button--hasVariants'] : ''} ${isActive ? css['button--active'] : ''}` }
      aria-label={ def.label }
      aria-haspopup={ hasVariants ? 'menu' : undefined }
      aria-expanded={ hasVariants ? isActive : undefined }
      draggable={ false }
      { ...tooltipProps }
      onMouseDown={ handleMouseDown }
      onClick={ hasVariants ? handleClick : undefined }
    >
      { def.Icon
        ? <def.Icon size={ 20 } aria-hidden="true" />
        : <span className={ def.iconClass } aria-hidden="true" />
      }
      { hasVariants && <Caret /> }
    </button>
  );
}

function Caret() {
  return (
    <svg
      className={ css.caret }
      viewBox="0 0 8 8"
      width="8"
      height="8"
      aria-hidden="true"
    >
      <path d="M1 2.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function buildPrimaryAttrs(primaryType) {
  const attrs = { type: primaryType };

  // SubProcess must be expanded to be useful inline on the canvas.
  if (primaryType === 'bpmn:SubProcess') {
    attrs.isExpanded = true;
  }

  return attrs;
}
