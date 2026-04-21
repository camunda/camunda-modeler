# Validate Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-element Validate mode on top of the existing left-rail prototype — click any BPMN element in Validate mode, see what inputs it needs, run it via the real task-tester, keep the result as a canvas badge.

**Architecture:** A thin React + vanilla-JS shell over the existing `@camunda/task-testing` tab. Four moving parts: (1) `runnability.js` — pure decision table for which element types are runnable, (2) `ValidatePanel` — injected above `<TaskTesting>` with a required-inputs card and a disabled-reason banner, (3) `ValidateBadges` — per-modeler overlay manager that reacts to `taskTesting.finished` events, (4) UI rename of "Test" → "Validate" in the three surfaces. No new engine, no new inspector — the existing tab and the bpmn-js `overlays` service do the work.

**Tech Stack:** React 18 (hooks + JSX), bpmn-js services (`overlays`, `eventBus`, `variableResolver`), `@camunda/task-testing` v4.0.1, CSS Modules via LESS, Camunda 8 only (`client/src/app/tabs/cloud-bpmn/`).

**Design doc:** `docs/superpowers/specs/2026-04-22-validate-mode-design.md`

---

## Context the implementer needs before starting

1. **The internal mode key stays `test`.** `modeConfig.test` is not renamed. Only user-facing strings change. Grepping for `'test'` in the mode layer will hit a lot of legitimate code — don't mass-replace.

2. **`<TaskTesting>` from `@camunda/task-testing` already listens to `selection.changed` on the bpmn-js eventBus** (confirmed in `node_modules/@camunda/task-testing/dist/index.js`). Canvas clicks retarget the internal element automatically. **We do NOT add a `selectedElement` prop to the tab.** The spec's `useValidateSelectionSync` hook mentioned in the design doc is therefore **replaced** by a smaller `useCurrentSelection(injector)` hook that each of our own components uses to read the current selection.

3. **`taskTesting.finished` events reach us via `EventsContext`.** The tab calls `onAction('emit-event', { type: 'taskTesting.finished', payload })`, `App.js` forwards that to an `EventEmitter`, and React consumers subscribe via `useContext(EventsContext).subscribe(type, listener)`. Source:
   - Emit: `client/src/app/tabs/cloud-bpmn/side-panel/tabs/task-testing/TaskTestingTab.js:155-163`
   - Route: `client/src/app/App.js:2221-2227`
   - Context: `client/src/app/EventsContext.js:17-24`

4. **`onTestTask` is the runnability guard point.** `<TaskTesting>` accepts `onTestTask?: () => boolean | Promise<boolean>` — returning `false` aborts the run. The current tab uses it only for "are we connected?". We'll compose it with a runnability check.

5. **BpmnEditor is a class component.** New React logic lives in functional components that BpmnEditor mounts in `render()`. Per-modeler state (`ValidateBadges` instance) lives as class fields.

6. **No new tests.** This prototype matches the discipline of the rail + copilot + guided-start branches above it — manual verification against the spec's 16-point checklist is the gate. If a future iteration makes `runnability.js` the source of customer-visible copy, add a test file then.

---

## File Structure

**New files** (all under `client/src/app/tabs/cloud-bpmn/validate/`):

| File | Responsibility |
|---|---|
| `runnability.js` | Pure function table. `isRunnable(element) → { enabled, advisory, explanation }`. Plus `isAgenticSubprocess(element)` helper. ~80 lines. |
| `useCurrentSelection.js` | React hook. Subscribes to `injector.get('eventBus').on('selection.changed', ...)` and returns the currently-selected element (or `null`). ~30 lines. |
| `RequiredInputsCard.js` | Presentational card. Takes `{ element, injector }`, calls `variableResolver.getVariablesForElement(element, { read: true })`, renders a list. Hides if no reads. ~50 lines. |
| `RequiredInputsCard.less` | Styling. Matches the existing Task Testing tab card idiom. |
| `ValidatePanel.js` | Orchestrator. Mounts card + runnability banner. Exports `useRunnabilityGuard(injector)` — a hook that returns an `onTestTask` function composable with the tab's existing gate. ~70 lines. |
| `ValidatePanel.less` | Layout (stacked cards with spec'd spacing). |
| `ValidateBadges.js` | Plain ES class. Owns `Map<elementId, overlayRef>`. Methods: `record({ element, success, incident })`, `clearAll()`, `destroy()`. Subscribes to bpmn-js `element.deleted` to drop orphans. ~70 lines. |
| `ValidateBadges.less` | Overlay pill styling — three status variants (pass / fail / incident). |

**Modified files:**

| File | Change |
|---|---|
| `client/src/app/tabs/cloud-bpmn/mode/modeConfig.js` | Rename `test.label`, `test.canvasChip.label`, `test.canvasChip.hint` to the Validate copy. |
| `client/src/app/tabs/cloud-bpmn/rail/CanvasChip.js` | Add optional `action` prop: `{ label: string, onClick: () => void }`. Renders a clickable link after the hint. |
| `client/src/app/tabs/cloud-bpmn/rail/CanvasChip.less` | Style for the action link. |
| `client/src/app/tabs/cloud-bpmn/side-panel/tabs/task-testing/TaskTestingTab.js` | Accept `validateBadges` prop. Render `<ValidatePanel injector={injector} />` above `<TaskTesting>`. Compose `onTestTask` through the runnability guard. |
| `client/src/app/tabs/cloud-bpmn/BpmnEditor.js` | Instantiate `ValidateBadges` when the modeler is ready; destroy on unmount. Wrap `onAction` before passing to `TaskTestingTab` so `taskTesting.finished` forwards to `validateBadges.record(...)`. Rename the side-panel tab `label="Test"` → `label="Validate"`. Pass `action` prop to `CanvasChip` only when `mode === 'test'`. |

**Reused as-is (no edit):**

- `@bpmn-io/variable-resolver` — already a bpmn-js plugin; read via `injector.get('variableResolver')`.
- `@camunda/task-testing` — engine, connection banners, form, deploy flow all stay untouched.
- `modeConfig.test.sidePanelTab = 'test'`, `sidePanelOpen: true` — already opens the Validate tab on mode switch.

---

## Task 1: `runnability.js` — pure decision table

**Files:**
- Create: `client/src/app/tabs/cloud-bpmn/validate/runnability.js`

- [ ] **Step 1: Create the validate directory**

```bash
mkdir -p client/src/app/tabs/cloud-bpmn/validate
```

- [ ] **Step 2: Write `runnability.js`**

```javascript
/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/**
 * runnability — per-element rules for the Validate mode.
 *
 * The rule stays as a plain lookup rather than nested conditionals so the
 * PM, designer, and engineer edit one table. Every branch returns the same
 * shape so callers never have to check which field is populated.
 *
 *   isRunnable(element) → {
 *     enabled: boolean,
 *     advisory: string | null,    // shown above Run when enabled but caveated
 *     explanation: string | null  // shown inline when disabled
 *   }
 */

const ADVISORY_USER_TASK = 'User tasks require manual claim & complete in Tasklist — this run will hang until someone picks it up.';
const ADVISORY_AGENTIC = 'Agentic subprocess validation is best-effort in Camunda 8.9. Treat results as indicative.';
const ADVISORY_CALL_ACTIVITY = 'Called process must also be deployed for this to succeed.';

const EXPLAIN_GATEWAY = 'Gateways route, they don\u2019t execute — validate the task on either side.';
const EXPLAIN_BOUNDARY = 'Boundary events attach to a task — validate the parent task instead.';
const EXPLAIN_END = 'End events terminate the process — nothing to run.';
const EXPLAIN_CATCH = 'Catch events wait for an external signal — not directly runnable from here.';
const EXPLAIN_THROW = 'Throw events emit a signal — the preceding task is what you want to validate.';
const EXPLAIN_TRIGGERED_START = 'This start event requires an external trigger. Use a plain start or a downstream task.';
const EXPLAIN_NON_EXEC = 'This element isn\u2019t executable.';

const RUNNABLE = { enabled: true, advisory: null, explanation: null };

/**
 * Detect agentic subprocesses. Two-layer rule so we don't block on the
 * 8.9 moddle attribute landing:
 *   1. Preferred: zeebe:adHocSubProcess moddle flag
 *   2. Fallback: name matches /\bagent(ic)?\b/i
 * The advisory copy is conservative enough that a false positive is
 * harmless (it reads as a "this might be agentic" disclaimer).
 */
export function isAgenticSubprocess(element) {
  const bo = element && element.businessObject;
  if (!bo || bo.$type !== 'bpmn:SubProcess') return false;

  try {
    if (bo.get && bo.get('zeebe:adHocSubProcess')) return true;
  } catch (e) { /* moddle attribute not registered yet — fall through */ }

  const name = bo.name || '';
  return /\bagent(ic)?\b/i.test(name);
}

function isPlainStartEvent(element) {
  const bo = element.businessObject;
  if (!bo || bo.$type !== 'bpmn:StartEvent') return false;
  const defs = bo.eventDefinitions || [];
  return defs.length === 0;
}

export function isRunnable(element) {
  if (!element || !element.businessObject) {
    return { enabled: false, advisory: null, explanation: EXPLAIN_NON_EXEC };
  }

  const type = element.businessObject.$type;

  // Agentic subprocess detection takes precedence over the plain SubProcess row.
  if (type === 'bpmn:SubProcess' && isAgenticSubprocess(element)) {
    return { enabled: true, advisory: ADVISORY_AGENTIC, explanation: null };
  }

  switch (type) {
  case 'bpmn:ServiceTask':
  case 'bpmn:BusinessRuleTask':
  case 'bpmn:ScriptTask':
  case 'bpmn:SendTask':
  case 'bpmn:ReceiveTask':
  case 'bpmn:ManualTask':
  case 'bpmn:Task':
  case 'bpmn:SubProcess':
    return RUNNABLE;

  case 'bpmn:UserTask':
    return { enabled: true, advisory: ADVISORY_USER_TASK, explanation: null };

  case 'bpmn:CallActivity':
    return { enabled: true, advisory: ADVISORY_CALL_ACTIVITY, explanation: null };

  case 'bpmn:StartEvent':
    return isPlainStartEvent(element)
      ? RUNNABLE
      : { enabled: false, advisory: null, explanation: EXPLAIN_TRIGGERED_START };

  case 'bpmn:ExclusiveGateway':
  case 'bpmn:ParallelGateway':
  case 'bpmn:EventBasedGateway':
  case 'bpmn:InclusiveGateway':
  case 'bpmn:ComplexGateway':
    return { enabled: false, advisory: null, explanation: EXPLAIN_GATEWAY };

  case 'bpmn:BoundaryEvent':
    return { enabled: false, advisory: null, explanation: EXPLAIN_BOUNDARY };

  case 'bpmn:EndEvent':
    return { enabled: false, advisory: null, explanation: EXPLAIN_END };

  case 'bpmn:IntermediateCatchEvent':
    return { enabled: false, advisory: null, explanation: EXPLAIN_CATCH };

  case 'bpmn:IntermediateThrowEvent':
    return { enabled: false, advisory: null, explanation: EXPLAIN_THROW };

  default:
    return { enabled: false, advisory: null, explanation: EXPLAIN_NON_EXEC };
  }
}
```

- [ ] **Step 3: Lint the new file**

Run: `cd client && npx eslint src/app/tabs/cloud-bpmn/validate/runnability.js`
Expected: clean (no output).

- [ ] **Step 4: Commit**

```bash
git add client/src/app/tabs/cloud-bpmn/validate/runnability.js
git commit -m "$(cat <<'EOF'
feat(validate): per-element runnability decision table

Pure module returning { enabled, advisory, explanation } for any BPMN
element. One table, one place for PM/design/eng to agree on copy.

Handles the spec's full element matrix: tasks + call activity + subprocess
enabled; user task + agentic subprocess enabled with advisory; gateways,
boundaries, end events, intermediate events, triggered start events
disabled with a one-line explanation. Agentic detection uses the 8.9
moddle flag when present, falls back to a name heuristic.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `useCurrentSelection` hook

**Files:**
- Create: `client/src/app/tabs/cloud-bpmn/validate/useCurrentSelection.js`

- [ ] **Step 1: Write the hook**

```javascript
/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { useEffect, useState } from 'react';

/**
 * useCurrentSelection — returns the first selected bpmn-js element (or null).
 *
 * Multi-select: we take the first. Validate mode is single-element by nature;
 * if a user rubber-bands five tasks, operating on one is the useful default.
 *
 * The hook owns its own subscription so callers can mount in any React tree
 * that has the injector — no prop drilling of "selected element" state from
 * BpmnEditor downward.
 */
export default function useCurrentSelection(injector) {
  const [ element, setElement ] = useState(() => readSelection(injector));

  useEffect(() => {
    if (!injector) return undefined;

    const eventBus = injector.get('eventBus');
    const handler = () => setElement(readSelection(injector));

    // Prime with current selection in case the hook mounts after the user
    // has already selected something.
    handler();

    eventBus.on('selection.changed', handler);
    return () => eventBus.off('selection.changed', handler);
  }, [ injector ]);

  return element;
}

function readSelection(injector) {
  if (!injector) return null;
  try {
    const selection = injector.get('selection');
    const selected = selection.get();
    return selected && selected.length > 0 ? selected[0] : null;
  } catch (e) {
    return null;
  }
}
```

- [ ] **Step 2: Lint**

Run: `cd client && npx eslint src/app/tabs/cloud-bpmn/validate/useCurrentSelection.js`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add client/src/app/tabs/cloud-bpmn/validate/useCurrentSelection.js
git commit -m "$(cat <<'EOF'
feat(validate): useCurrentSelection hook

Tiny hook that reads the current bpmn-js selection via injector.get.
Lets Validate-mode components subscribe directly — no need to drill
selection state through BpmnEditor → TaskTestingTab → ValidatePanel.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: `RequiredInputsCard` + styling

**Files:**
- Create: `client/src/app/tabs/cloud-bpmn/validate/RequiredInputsCard.js`
- Create: `client/src/app/tabs/cloud-bpmn/validate/RequiredInputsCard.less`

- [ ] **Step 1: Write the LESS file**

```less
/**
 * RequiredInputsCard — matches the existing task-testing card idiom.
 */

:local(.card) {
  border: 1px solid var(--color-grey-225-10-90, #e3e6ea);
  border-radius: 6px;
  background: var(--color-white, #fff);
  padding: 10px 12px;
  margin: 0 0 8px 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--color-grey-225-10-15, #3b4252);
}

:local(.title) {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-grey-225-10-50, #8792a1);
  margin: 0 0 6px 0;
}

:local(.row) {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 2px 0;
}

:local(.name) {
  font-family: var(--font-family-monospace, monospace);
  font-size: 11.5px;
  color: var(--color-grey-225-10-20, #1f2937);
}

:local(.type) {
  font-size: 10.5px;
  color: var(--color-grey-225-10-50, #8792a1);
}

:local(.empty) {
  font-size: 11.5px;
  color: var(--color-grey-225-10-50, #8792a1);
  font-style: italic;
}
```

- [ ] **Step 2: Write the component**

```javascript
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
```

- [ ] **Step 3: Lint**

Run: `cd client && npx eslint src/app/tabs/cloud-bpmn/validate/RequiredInputsCard.js`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add client/src/app/tabs/cloud-bpmn/validate/RequiredInputsCard.js client/src/app/tabs/cloud-bpmn/validate/RequiredInputsCard.less
git commit -m "$(cat <<'EOF'
feat(validate): required-inputs card using variable-resolver

Small card listing variables the selected element reads. Powered by
modeler.get('variableResolver').getVariablesForElement(element, { read: true }).
Hidden if the element has no reads — we don't clutter clean elements
with empty cards.

Advisory only; the authoritative input form is the existing task-testing
editor rendered below this card.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: `ValidatePanel` — orchestrator

**Files:**
- Create: `client/src/app/tabs/cloud-bpmn/validate/ValidatePanel.js`
- Create: `client/src/app/tabs/cloud-bpmn/validate/ValidatePanel.less`

- [ ] **Step 1: Write the LESS file**

```less
:local(.panel) {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px 0;
}

:local(.emptyState) {
  padding: 14px 12px;
  border: 1px dashed var(--color-grey-225-10-80, #d9dee4);
  border-radius: 6px;
  color: var(--color-grey-225-10-50, #8792a1);
  font-size: 12px;
  text-align: center;
  margin: 0 0 8px 0;
}

:local(.banner) {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 9px 11px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.45;
  margin: 0 0 8px 0;
}

:local(.banner--disabled) {
  background: var(--color-grey-225-10-95, #f0f2f5);
  border: 1px solid var(--color-grey-225-10-80, #d9dee4);
  color: var(--color-grey-225-10-25, #3b4252);
}

:local(.banner--advisory) {
  background: #fff7ed;
  border: 1px solid #fde0a8;
  color: #7c2d12;
}

:local(.bannerIcon) {
  flex: 0 0 auto;
  line-height: 1;
  font-size: 14px;
  margin-top: 1px;
}
```

- [ ] **Step 2: Write the component**

```javascript
/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useCallback } from 'react';

import useCurrentSelection from './useCurrentSelection';
import RequiredInputsCard from './RequiredInputsCard';
import { isRunnable } from './runnability';

import * as css from './ValidatePanel.less';

/**
 * ValidatePanel — Validate-mode chrome rendered above the @camunda/task-testing
 * component. Owns:
 *   - the required-inputs card (variable-resolver → one row per read var)
 *   - the runnability banner (advisory when caveated, disabled-reason when
 *     the element can't be run at all)
 *
 * Element selection is read from bpmn-js directly via useCurrentSelection —
 * the library also listens to selection.changed internally, so our panel
 * and the library stay in sync without explicit handshake.
 */
export default function ValidatePanel({ injector }) {
  const element = useCurrentSelection(injector);

  if (!element) {
    return (
      <div className={ css.panel }>
        <div className={ css.emptyState }>
          Select an element on the canvas to validate it.
        </div>
      </div>
    );
  }

  const { enabled, advisory, explanation } = isRunnable(element);

  return (
    <div className={ css.panel }>
      <RequiredInputsCard element={ element } injector={ injector } />
      { !enabled && explanation ? (
        <div className={ `${css.banner} ${css['banner--disabled']}` }>
          <span className={ css.bannerIcon }>—</span>
          <span>{ explanation }</span>
        </div>
      ) : null }
      { enabled && advisory ? (
        <div className={ `${css.banner} ${css['banner--advisory']}` }>
          <span className={ css.bannerIcon }>⚠</span>
          <span>{ advisory }</span>
        </div>
      ) : null }
    </div>
  );
}

/**
 * Composes a runnability-aware `onTestTask` guard on top of the tab's
 * existing connection check. Returns `false` (abort) when the selected
 * element is non-runnable.
 *
 *   const onTestTask = composeOnTestTask({
 *     injector,
 *     connectionGuard: handleTestTask
 *   });
 */
export function composeOnTestTask({ injector, connectionGuard }) {
  return async () => {
    // Connection gate first — mirrors existing behavior (pops the connection
    // selector if not configured).
    const canConnect = await connectionGuard();
    if (!canConnect) return false;

    // Runnability gate — reads the current selection at call time so we
    // don't hold a stale reference.
    let element = null;
    try {
      const selection = injector.get('selection');
      const selected = selection.get();
      element = selected && selected.length > 0 ? selected[0] : null;
    } catch (e) { /* no selection service — allow run */ }

    if (!element) return true; // nothing selected → defer to library
    const { enabled } = isRunnable(element);
    return enabled;
  };
}
```

- [ ] **Step 3: Lint**

Run: `cd client && npx eslint src/app/tabs/cloud-bpmn/validate/ValidatePanel.js`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add client/src/app/tabs/cloud-bpmn/validate/ValidatePanel.js client/src/app/tabs/cloud-bpmn/validate/ValidatePanel.less
git commit -m "$(cat <<'EOF'
feat(validate): ValidatePanel — required inputs + runnability banner

Mounts above <TaskTesting>: shows the required-inputs card for consumed
variables, a disabled-reason banner for non-runnable elements, and an
advisory banner for conditionally-runnable ones (user task, agentic
subprocess, call activity).

Also exports composeOnTestTask — a wrapper that gates the tab's Run
callback on runnability, aborting cleanly for gateways / end events /
triggered start events while leaving the connection check intact.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Wire ValidatePanel into TaskTestingTab

**Files:**
- Modify: `client/src/app/tabs/cloud-bpmn/side-panel/tabs/task-testing/TaskTestingTab.js`

- [ ] **Step 1: Add imports at the top of `TaskTestingTab.js` (after line 27)**

Exact edit — locate:
```javascript
import { utmTag } from '../../../../../../util/utmTag';
import { EventsContext } from '../../../../../EventsContext';
```

Add directly below:
```javascript
import ValidatePanel, { composeOnTestTask } from '../../../validate/ValidatePanel';
```

- [ ] **Step 2: Replace the `handleTestTask` callback (lines 179–186) so it composes runnability on top of the connection check**

Find:
```javascript
  const handleTestTask = useCallback(() => {
    if (!isConnectionConfigured) {
      handleConfigureConnection();
      return false;
    }

    return true;
  }, [ isConnectionConfigured, handleConfigureConnection ]);
```

Replace with:
```javascript
  const connectionGuard = useCallback(async () => {
    if (!isConnectionConfigured) {
      handleConfigureConnection();
      return false;
    }

    return true;
  }, [ isConnectionConfigured, handleConfigureConnection ]);

  const handleTestTask = useMemo(
    () => composeOnTestTask({ injector, connectionGuard }),
    [ injector, connectionGuard ]
  );
```

- [ ] **Step 3: Render `<ValidatePanel>` above `<TaskTesting>` (line 191 onward)**

Find:
```javascript
  return <div className={ css.TaskTestingTab }>
    <TaskTesting
```

Replace with:
```javascript
  return <div className={ css.TaskTestingTab }>
    <ValidatePanel injector={ injector } />
    <TaskTesting
```

- [ ] **Step 4: Lint the modified file**

Run: `cd client && npx eslint src/app/tabs/cloud-bpmn/side-panel/tabs/task-testing/TaskTestingTab.js`
Expected: clean.

- [ ] **Step 5: Build the client**

Run: `cd client && npm run build 2>&1 | tail -15`
Expected: `webpack ... compiled with 2 warnings in ... ms` (only pre-existing size warnings). No errors.

- [ ] **Step 6: Commit**

```bash
git add client/src/app/tabs/cloud-bpmn/side-panel/tabs/task-testing/TaskTestingTab.js
git commit -m "$(cat <<'EOF'
feat(validate): mount ValidatePanel above task-testing form

- Renders required-inputs card + runnability banner above the existing
  <TaskTesting> form. Card is hidden when the selected element reads no
  variables; banner only renders when there's something to say.
- Composes the connection guard with a runnability guard so non-runnable
  elements abort the Run attempt cleanly (instead of sending gateways /
  end events to the engine).

The tab otherwise unchanged — same engine, same deploy, same results.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: `ValidateBadges` overlay manager

**Files:**
- Create: `client/src/app/tabs/cloud-bpmn/validate/ValidateBadges.js`
- Create: `client/src/app/tabs/cloud-bpmn/validate/ValidateBadges.less`

- [ ] **Step 1: Write the LESS file**

```less
/**
 * ValidateBadges — colored pill overlay on each element's canvas shape.
 */

.djs-overlay-validate-badge {
  pointer-events: none;
}

.validate-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  background: #fff;
  border: 1.5px solid;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.validate-badge--pass {
  color: #047857;
  border-color: #10b981;
  background: #ecfdf5;
}

.validate-badge--fail {
  color: #b91c1c;
  border-color: #ef4444;
  background: #fef2f2;
}

.validate-badge--incident {
  color: #b45309;
  border-color: #f59e0b;
  background: #fff7ed;
}
```

- [ ] **Step 2: Write the manager**

```javascript
/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import './ValidateBadges.less';

/**
 * ValidateBadges — per-modeler overlay manager for Validate mode.
 *
 * Listens to nothing on its own — the BpmnEditor intercepts `taskTesting.finished`
 * app events and forwards them via `record()`. Keeping the event tap upstream
 * means this class only talks to bpmn-js, which makes teardown trivial.
 *
 * Session-only: the Map is discarded on destroy(). No serialization.
 */
export default class ValidateBadges {
  constructor(modeler) {
    this._modeler = modeler;
    this._overlays = modeler.get('overlays');
    this._eventBus = modeler.get('eventBus');
    this._badges = new Map(); // elementId → overlayId

    // bpmn-js removes overlays on element delete automatically, but we still
    // need to drop the map entry so a re-added element with the same id (undo)
    // doesn't resurrect a stale record.
    this._onElementDeleted = (event) => {
      const id = event && event.element && event.element.id;
      if (id) this._badges.delete(id);
    };
    this._eventBus.on('shape.remove', this._onElementDeleted);
  }

  /**
   * record({ element, success, incident }) — replace any existing badge on
   * the element with one reflecting the new outcome.
   */
  record(payload) {
    if (!payload || !payload.element || !payload.element.id) return;

    const { element, success, incident } = payload;
    const status = deriveStatus({ success, incident });
    this._clearBadge(element.id);

    const overlayId = this._overlays.add(element.id, 'validate-badge', {
      position: { top: -10, right: 8 },
      html: `<div class="validate-badge validate-badge--${status}">${glyph(status)}</div>`
    });
    this._badges.set(element.id, overlayId);
  }

  clearAll() {
    for (const overlayId of this._badges.values()) {
      this._overlays.remove(overlayId);
    }
    this._badges.clear();
  }

  destroy() {
    this.clearAll();
    this._eventBus.off('shape.remove', this._onElementDeleted);
  }

  _clearBadge(elementId) {
    const existing = this._badges.get(elementId);
    if (existing) {
      this._overlays.remove(existing);
      this._badges.delete(elementId);
    }
  }
}

function deriveStatus({ success, incident }) {
  if (incident) return 'incident';
  return success ? 'pass' : 'fail';
}

function glyph(status) {
  if (status === 'pass') return '\u2713';       // ✓
  if (status === 'fail') return '\u2715';       // ✕
  return '\u26A0';                              // ⚠
}
```

- [ ] **Step 3: Lint**

Run: `cd client && npx eslint src/app/tabs/cloud-bpmn/validate/ValidateBadges.js`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add client/src/app/tabs/cloud-bpmn/validate/ValidateBadges.js client/src/app/tabs/cloud-bpmn/validate/ValidateBadges.less
git commit -m "$(cat <<'EOF'
feat(validate): ValidateBadges overlay manager

Per-modeler class that owns a Map<elementId, overlayId>. record(payload)
replaces any existing badge on the target element with a pass / fail /
incident variant; clearAll() removes everything; destroy() also tears
down the shape.remove subscription.

Visual: 20px rounded pill anchored top-right of each element shape via
bpmn-js overlays service. Overlay CSS scoped with .djs-overlay-* so it
never fights with connector / properties chrome.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: BpmnEditor — instantiate ValidateBadges + intercept action

**Files:**
- Modify: `client/src/app/tabs/cloud-bpmn/BpmnEditor.js`

Locate the exact lines before editing — the file is long (1500+ lines), so the edits below are scoped to specific regions.

- [ ] **Step 1: Import `ValidateBadges` near the top of the file**

Open `client/src/app/tabs/cloud-bpmn/BpmnEditor.js`, find the block of imports from `./mode/...` and add below it:

```javascript
import ValidateBadges from './validate/ValidateBadges';
```

- [ ] **Step 2: Add a `this._validateBadges = null` initialization in the constructor**

Locate the constructor where `this.modeController` is created (around line 132). Add directly below:

```javascript
    this._validateBadges = null;
```

- [ ] **Step 3: Instantiate `ValidateBadges` when the modeler becomes available**

Find the `componentDidMount` or the modeler-creation callback where other per-modeler services are wired (search for `this.modeController.subscribe` near line 236 or similar). Add after the modeler is available (look for where other modeler-based side effects run, e.g., near the existing `this._applyModeSideEffects(...)` calls):

```javascript
    // Per-modeler overlay manager for Validate mode. Instantiated once we
    // have a modeler; torn down in componentWillUnmount.
    const modeler = this.getModeler && this.getModeler();
    if (modeler && !this._validateBadges) {
      this._validateBadges = new ValidateBadges(modeler);
    }
```

If `getModeler()` doesn't exist, use whatever accessor this file uses for the bpmn-js modeler (grep inside the file for `.get('overlays')` or `get('canvas')` to find the pattern — typically `this.getModeler()` or `this.modeler`). Match existing style.

- [ ] **Step 4: Tear down on unmount**

In `componentWillUnmount` (exists in the file — find it) add:

```javascript
    if (this._validateBadges) {
      this._validateBadges.destroy();
      this._validateBadges = null;
    }
```

- [ ] **Step 5: Wrap `onAction` for the Validate tab**

Find the render method's JSX for the Task Testing tab (line ~1569 — search for `<SidePanel.Tab id="test"`). Before that JSX, in the render method body, add:

```javascript
    const validateAwareOnAction = (type, payload) => {
      if (
        type === 'emit-event'
        && payload
        && payload.type === 'taskTesting.finished'
        && this._validateBadges
      ) {
        this._validateBadges.record(payload.payload);
      }
      return onAction(type, payload);
    };
```

(`onAction` here is the one already destructured from props earlier in `render()` — use the local name matching what the tab receives today.)

Then change the `<TaskTestingTab>` JSX to use `validateAwareOnAction`:

Find:
```jsx
      <TaskTestingTab
        config={ config }
        deployment={ deployment }
        file={ file }
        id={ id }
        injector={ injector }
        layout={ layout }
        onAction={ onAction }
        startInstance={ startInstance }
        zeebeApi={ zeebeApi }
      />
```

Replace the `onAction` line only:
```jsx
        onAction={ validateAwareOnAction }
```

- [ ] **Step 6: Lint and build**

Run: `cd client && npx eslint src/app/tabs/cloud-bpmn/BpmnEditor.js && npm run build 2>&1 | tail -10`
Expected: no eslint errors; webpack finishes with the 2 pre-existing warnings, no errors.

- [ ] **Step 7: Commit**

```bash
git add client/src/app/tabs/cloud-bpmn/BpmnEditor.js
git commit -m "$(cat <<'EOF'
feat(validate): BpmnEditor owns ValidateBadges lifecycle

Instantiate one ValidateBadges per modeler; destroy on unmount.

Wrap the onAction the Validate tab receives so taskTesting.finished
events forward to validateBadges.record(...) before falling through to
the original action pipe. Other children of BpmnEditor keep the raw
onAction — the wrapping is tab-scoped.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: CanvasChip accepts an `action` prop

**Files:**
- Modify: `client/src/app/tabs/cloud-bpmn/rail/CanvasChip.js`
- Modify: `client/src/app/tabs/cloud-bpmn/rail/CanvasChip.less`

- [ ] **Step 1: Extend `CanvasChip.js`**

Open `client/src/app/tabs/cloud-bpmn/rail/CanvasChip.js`. The current signature is `export default function CanvasChip({ label, hint, accent = 'test' })`. Change to:

```javascript
export default function CanvasChip({ label, hint, accent = 'test', action = null }) {
```

In the JSX (inside the component), after the hint span, before the closing wrapper tag, add:

```jsx
      { action && action.label ? (
        <button type="button" className={ css.action } onClick={ action.onClick }>
          { action.label }
        </button>
      ) : null }
```

- [ ] **Step 2: Add the action-link style to `CanvasChip.less`**

Append to the file:

```less
:local(.action) {
  margin-left: 10px;
  background: transparent;
  border: 0;
  padding: 0;
  color: var(--color-link, #2a7de1);
  font-size: inherit;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

:local(.action):hover,
:local(.action):focus-visible {
  color: var(--color-link-hover, #1d4ed8);
  outline: none;
}
```

- [ ] **Step 3: Lint**

Run: `cd client && npx eslint src/app/tabs/cloud-bpmn/rail/CanvasChip.js`
Expected: clean.

- [ ] **Step 4: Wire the action from `BpmnEditor.js`**

Find the `<CanvasChip>` render in `BpmnEditor.js` (grep for `CanvasChip`). The current JSX reads `{ mode: 'test' }`-gated already per the prior rail commit. Add an `action` prop only in Validate mode:

Find the CanvasChip JSX (look for `<CanvasChip` inside the render method). If it currently looks like:

```jsx
        { modeCfg.canvasChip ? (
          <CanvasChip
            label={ modeCfg.canvasChip.label }
            hint={ modeCfg.canvasChip.hint }
            accent={ mode }
          />
        ) : null }
```

Change to:

```jsx
        { modeCfg.canvasChip ? (
          <CanvasChip
            label={ modeCfg.canvasChip.label }
            hint={ modeCfg.canvasChip.hint }
            accent={ mode }
            action={
              mode === 'test' && this._validateBadges
                ? {
                  label: 'Clear all results',
                  onClick: () => this._validateBadges.clearAll()
                }
                : null
            }
          />
        ) : null }
```

- [ ] **Step 5: Lint and build**

Run: `cd client && npx eslint src/app/tabs/cloud-bpmn/rail/CanvasChip.js src/app/tabs/cloud-bpmn/BpmnEditor.js && npm run build 2>&1 | tail -10`
Expected: clean lint; build finishes with 2 pre-existing warnings.

- [ ] **Step 6: Commit**

```bash
git add client/src/app/tabs/cloud-bpmn/rail/CanvasChip.js client/src/app/tabs/cloud-bpmn/rail/CanvasChip.less client/src/app/tabs/cloud-bpmn/BpmnEditor.js
git commit -m "$(cat <<'EOF'
feat(validate): "Clear all results" action on canvas chip

CanvasChip accepts an optional { label, onClick } action that renders
as a link next to the hint. BpmnEditor wires it to validateBadges.clearAll()
only in Validate mode — modeConfig stays declarative (no callbacks in
config), which is the Karpathy call from the audit.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: UI rename "Test" → "Validate"

**Files:**
- Modify: `client/src/app/tabs/cloud-bpmn/mode/modeConfig.js`
- Modify: `client/src/app/tabs/cloud-bpmn/BpmnEditor.js`

- [ ] **Step 1: Rename in `modeConfig.js`**

Open `client/src/app/tabs/cloud-bpmn/mode/modeConfig.js`. Find the `test:` mode object:

```javascript
  test: {
    label: 'Test',
    hotkey: '4',
    themeClass: 'bpmn-editor--mode-test',
    sidePanelTab: 'test',
    sidePanelOpen: true,
    visibleShapes: [],
    canvasChip: {
      label: 'Test mode',
      hint: 'Click a task to run it with inputs.'
    },
    canvasOverlay: null
  }
```

Change three strings:

```javascript
  test: {
    label: 'Validate',
    hotkey: '4',
    themeClass: 'bpmn-editor--mode-test',
    sidePanelTab: 'test',
    sidePanelOpen: true,
    visibleShapes: [],
    canvasChip: {
      label: 'Validate mode',
      hint: 'Click an element to review it; runnable ones show Run.'
    },
    canvasOverlay: null
  }
```

(Keep the comment before this block about the internal key staying `test`. If the comment doesn't already exist, add one line: `// UI says "Validate"; internal mode key stays 'test' to avoid codebase churn.`)

- [ ] **Step 2: Rename the side-panel tab label in `BpmnEditor.js`**

Find line ~1569 (search for `id="test"`):

```jsx
<SidePanel.Tab id="test" label="Test" icon={ TaskTestingIcon }>
```

Change to:

```jsx
<SidePanel.Tab id="test" label="Validate" icon={ TaskTestingIcon }>
```

- [ ] **Step 3: Check the rail tooltip wording**

Open `client/src/app/tabs/cloud-bpmn/rail/RailModesSection.js` and grep for `cfg.label` usage. The tooltip text should now already say "Validate (Cmd+4)" because it's derived from `cfg.label`. If the file hardcodes "Test" anywhere, change to "Validate". Run:

```bash
grep -n "Test" client/src/app/tabs/cloud-bpmn/rail/RailModesSection.js
```

If the only match is a generic comment, skip. If a user-visible string says "Test", change it to "Validate" (preserve surrounding punctuation).

- [ ] **Step 4: Lint and build**

Run: `cd client && npx eslint src/app/tabs/cloud-bpmn/mode/modeConfig.js src/app/tabs/cloud-bpmn/BpmnEditor.js src/app/tabs/cloud-bpmn/rail/RailModesSection.js && npm run build 2>&1 | tail -10`
Expected: clean lint; build finishes with 2 pre-existing warnings.

- [ ] **Step 5: Confirm no visible string says "Test" in the Validate UI surface**

Run:
```bash
grep -n "'Test'\|\"Test\"" client/src/app/tabs/cloud-bpmn/mode/modeConfig.js client/src/app/tabs/cloud-bpmn/rail/RailModesSection.js
```
Expected: no matches (the string `"Test"` only survives inside comments or internal IDs).

In `BpmnEditor.js`:
```bash
grep -n 'label="Test"' client/src/app/tabs/cloud-bpmn/BpmnEditor.js
```
Expected: no matches.

- [ ] **Step 6: Commit**

```bash
git add client/src/app/tabs/cloud-bpmn/mode/modeConfig.js client/src/app/tabs/cloud-bpmn/BpmnEditor.js
# also stage RailModesSection.js only if Step 3 changed it
git commit -m "$(cat <<'EOF'
feat(validate): rename "Test" → "Validate" in UI strings

Three surfaces:
- Rail chip label (via modeConfig.test.label)
- Canvas chip label + hint (modeConfig.test.canvasChip)
- Side-panel tab label in BpmnEditor.js

Internal mode key stays 'test' so modeConfig lookups, layout persistence,
and modeManager calls from other bpmn-js modules keep working without
migration.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Final verification

**Files:** none modified — this is manual QA against the spec.

- [ ] **Step 1: Start the desktop modeler in dev mode**

Run: `npm run dev` at the repo root. Open a new C8 BPMN file.

- [ ] **Step 2: Walk the spec's 16-point verification list**

Open `docs/superpowers/specs/2026-04-22-validate-mode-design.md` §Verification. For each of the 16 items, confirm the observed behavior matches. Track issues as you go; don't batch-fix at the end.

The list (summarized — spec has full copy):
1. Rename coverage — no user-visible "Test mode" anywhere.
2. Selection sync, basic — tab targets within one frame of a click.
3. Required-inputs card populates for elements with reads.
4. Run a runnable task end-to-end → green ✓ badge.
5. Badge persistence across selection.
6. Failure → ✕ badge; re-run with good inputs → ✓ replaces ✕.
7. Gateway click → tab retargets; Run disabled with explanation.
8. User task → advisory banner above Run; Run enabled.
9. Agentic subprocess → advisory banner.
10. Call activity → Run enabled; advisory "Called process must also be deployed".
11. End event → Run disabled with explanation.
12. "Clear all results" empties badges; subsequent clicks still retarget.
13. Session-only persistence (badges survive mode switch, not tab reload).
14. Undo of deletion removes badge; redo does not resurrect.
15. Connection loss disables Run (existing banner unchanged).
16. No regressions: rail, modes, command palette, properties CSS, Guided Append, EmptyCanvasOverlay, AiPanel, CopilotStepper all unchanged.

- [ ] **Step 3: Visual QA at two viewport heights**

Resize the Electron window to 1440×900, then 1280×720. Confirm:
- The Validate tab's top section (card + banner) doesn't clip or overlap the TaskTesting form below.
- Canvas chip "Clear all results" link is reachable (not clipped by the chip's container).
- Badges stay anchored top-right of their element at both sizes (pan + zoom).

- [ ] **Step 4: Pointer-capture interaction check**

Drag a shape from the rail while Validate mode is active — badges on existing elements should stay put during the drag, and the tab should continue to show the formerly-selected element (drag doesn't fire selection.changed). Confirm the required-inputs card stays rendered through the drag.

- [ ] **Step 5: Run the final build**

Run: `cd client && npm run build 2>&1 | tail -10`
Expected: `webpack ... compiled with 2 warnings` — the 2 pre-existing size warnings only.

- [ ] **Step 6: Commit any fixes from Steps 2–4**

Each fix = its own small commit; don't batch. Use `feat(validate):` or `fix(validate):` prefix matching the original work.

- [ ] **Step 7: Tag the branch head as the Validate-mode prototype complete**

Run:
```bash
git log --oneline -15
# confirm the Validate commits land on top of the rail commits in sensible order
```

No tagging operation required unless the user asks; this step is a manual sanity check.

---

## Self-Review (written by planner after drafting)

**Spec coverage:**
- Problem / Goal / Design Summary → covered by Tasks 1–9.
- Interaction Flows § Primary (service task) → Task 5 + 7 (banner + badge).
- § Gateway / User task / Agentic / Clear all → Task 1 (table), 4 (banner render), 8 (clear).
- Runnability Policy full table → Task 1 (every row encoded; agentic helper included).
- Canvas Badges visual spec → Task 6 LESS; `.validate-badge--pass/--fail/--incident` names match spec.
- Critical Files § New (6 files) + § Modified (6 files) → every file hit by a task.
- What's Deferred — explicitly honored (no trigger sim, no per-turn agent trace, no persistence).
- Verification (16 points) → Task 10 step 2.

**Type / name consistency check:**
- `runnability.isRunnable(element)` return shape `{ enabled, advisory, explanation }` is used identically in Task 4 (ValidatePanel) and Task 4 (composeOnTestTask).
- `ValidateBadges.record(payload)` expects `{ element, success, incident }` — matches exactly the `taskTesting.finished` payload emitted by `TaskTestingTab.js:155-163`.
- `useCurrentSelection(injector)` returns `element | null` in Task 2 — consumed as such in Task 4 (no destructuring assumed).
- `composeOnTestTask({ injector, connectionGuard })` in Task 4 — Task 5 wires it with the same named params.

**Placeholder scan:** none found. Every step has either concrete code or a specific command with expected output. Task 7 step 3 uses `grep` to locate the modeler accessor because BpmnEditor's pattern varies across the file — but this is "run this grep to find the answer," not "figure it out."

**One minor flex point:** Task 7 step 3 says "match existing style" for where `ValidateBadges` is instantiated. If the codebase has an obvious "modeler ready" hook, use that; otherwise mount in `componentDidMount` after the initial import completes. The implementer can decide based on what they see.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-22-validate-mode.md`. Two execution options:

**1. Subagent-Driven (recommended)** — fresh subagent per task, spec + code-quality review between tasks, fast iteration.

**2. Inline Execution** — batch tasks with checkpoint review via executing-plans.

Which approach?
