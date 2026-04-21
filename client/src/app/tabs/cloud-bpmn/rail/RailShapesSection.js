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

import * as css from './ModeRail.less';

/**
 * Static metadata for every shape the rail might render. The actual visibility
 * for a given mode is decided by modeConfig.visibleShapes. Creation semantics
 * (drag to place) match bpmn-js default palette behavior — we delegate to
 * `create.start()` with an elementFactory-built shape.
 */
const SHAPE_DEFS = {
  'bpmn:StartEvent': {
    label: 'Start event',
    hint: 'Starts the process',
    icon: () => circleIcon('start')
  },
  'bpmn:EndEvent': {
    label: 'End event',
    hint: 'Ends the process',
    icon: () => circleIcon('end')
  },
  'bpmn:Task': {
    label: 'Task',
    hint: 'Generic step',
    icon: () => taskIcon('task')
  },
  'bpmn:ServiceTask': {
    label: 'Service task',
    hint: 'Automated service call',
    icon: () => taskIcon('service')
  },
  'bpmn:UserTask': {
    label: 'User task',
    hint: 'Human step',
    icon: () => taskIcon('user')
  },
  'bpmn:ScriptTask': {
    label: 'Script task',
    hint: 'Inline script',
    icon: () => taskIcon('script')
  },
  'bpmn:BusinessRuleTask': {
    label: 'Business rule',
    hint: 'DMN / rule engine',
    icon: () => taskIcon('rule')
  },
  'bpmn:CallActivity': {
    label: 'Call activity',
    hint: 'Call another process',
    icon: () => taskIcon('call')
  },
  'bpmn:IntermediateCatchEvent': {
    label: 'Catch event',
    hint: 'Wait for something',
    icon: () => circleIcon('catch')
  },
  'bpmn:IntermediateThrowEvent': {
    label: 'Throw event',
    hint: 'Emit something',
    icon: () => circleIcon('throw')
  },
  'bpmn:ExclusiveGateway': {
    label: 'Gateway (XOR)',
    hint: 'Exclusive branch',
    icon: () => gatewayIcon('xor')
  },
  'bpmn:ParallelGateway': {
    label: 'Gateway (AND)',
    hint: 'Parallel branches',
    icon: () => gatewayIcon('and')
  },
  'bpmn:EventBasedGateway': {
    label: 'Event gateway',
    hint: 'Event-based branch',
    icon: () => gatewayIcon('event')
  },
  'bpmn:SubProcess': {
    label: 'Sub-process',
    hint: 'Nested flow',
    icon: () => subProcessIcon()
  },
  'bpmn:TextAnnotation': {
    label: 'Note',
    hint: 'Text annotation',
    icon: () => noteIcon()
  }
};

/**
 * RailShapesSection — renders a mode-filtered button per shape. Mouse-down
 * begins a drag via `create.start`, matching the bpmn-js default palette so
 * keyboard / dragging behavior remains familiar. Click with no drag also
 * triggers create (user then clicks the canvas to drop).
 */
export default function RailShapesSection({ modeler, shapes, mode }) {
  if (!shapes || !shapes.length) {
    return (
      <div className={ css.sectionCollapsed } aria-hidden="true" />
    );
  }

  const handleStart = (event, shapeType) => {
    if (!modeler) return;
    const create = modeler.get('create');
    const elementFactory = modeler.get('elementFactory');

    const attrs = buildShapeAttrs(shapeType);
    const shape = elementFactory.createShape(attrs);

    create.start(event, shape);
  };

  return (
    <div className={ css.section } role="group" aria-label={ `Shapes for ${mode} mode` }>
      { shapes.map(shapeType => {
        const def = SHAPE_DEFS[shapeType];
        if (!def) return null;
        const Icon = def.icon;
        return (
          <button
            key={ shapeType }
            type="button"
            className={ css.button }
            title={ `${def.label} — ${def.hint}` }
            aria-label={ def.label }
            draggable={ false }
            onMouseDown={ (event) => handleStart(event.nativeEvent, shapeType) }
          >
            { Icon() }
          </button>
        );
      }) }
    </div>
  );
}

function buildShapeAttrs(shapeType) {
  const attrs = { type: shapeType };

  if (shapeType === 'bpmn:IntermediateCatchEvent') {

    // Default to message catch; user can change via properties panel.
    attrs.eventDefinitionType = 'bpmn:MessageEventDefinition';
  } else if (shapeType === 'bpmn:IntermediateThrowEvent') {
    attrs.eventDefinitionType = 'bpmn:MessageEventDefinition';
  } else if (shapeType === 'bpmn:SubProcess') {
    attrs.isExpanded = true;
  }

  return attrs;
}

// ---- Icons (small, monochrome, shape-hinting). Each is keyed so CSS can tint
// per-mode via currentColor.

function circleIcon(variant) {
  const strokeWidth = variant === 'end' ? 2.6 : 1.8;
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={ strokeWidth }>
      <circle cx="12" cy="12" r="8" />
      { variant === 'catch' && <circle cx="12" cy="12" r="5" /> }
      { variant === 'throw' && <circle cx="12" cy="12" r="5" fill="currentColor" opacity="0.5" /> }
    </svg>
  );
}

function taskIcon(variant) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="10" rx="2" />
      { variant === 'service' && <path d="M7 12h10M12 10v4" /> }
      { variant === 'user' && (
        <>
          <circle cx="7.5" cy="11.5" r="1.2" />
          <path d="M6 14c.5-1 1-1.3 1.5-1.3s1 .3 1.5 1.3" />
        </>
      ) }
      { variant === 'script' && <path d="M6 10h3M6 12h5M6 14h4" /> }
      { variant === 'rule' && <path d="M6 10h5M6 12h4M6 14h6" strokeDasharray="2 1" /> }
      { variant === 'call' && <rect x="5" y="9" width="14" height="6" rx="1" strokeWidth="1" /> }
    </svg>
  );
}

function gatewayIcon(variant) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M12 3l9 9-9 9-9-9 9-9z" />
      { variant === 'xor' && <path d="M9 9l6 6M15 9l-6 6" strokeLinecap="round" /> }
      { variant === 'and' && <path d="M12 8v8M8 12h8" strokeLinecap="round" /> }
      { variant === 'event' && <circle cx="12" cy="12" r="3.5" /> }
    </svg>
  );
}

function subProcessIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M10 12h4M12 10v4" strokeLinecap="round" />
    </svg>
  );
}

function noteIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 5v14M8 5h10v14H8" strokeWidth="1" strokeDasharray="0" />
      <path d="M8 5v14" />
      <path d="M11 9h6M11 12h6M11 15h4" />
    </svg>
  );
}
