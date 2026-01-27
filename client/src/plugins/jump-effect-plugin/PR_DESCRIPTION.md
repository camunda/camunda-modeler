# Pull Request: Jump Effect Plugin for BPMN Sequence Flows

## Summary

This PR adds a **Jump Effect Plugin** that draws sequence flows with small “bridge” arcs where they cross other connections, so crossing lines read clearly without overlapping. Only one of the two crossing lines gets the arc; the other stays straight. The behavior is similar to common circuit/schematic tools.

---

## What Problem It Solves

When several sequence flows cross, overlapping segments are hard to follow. This plugin:

- Keeps a single, consistent “over/under” at each crossing.
- Uses a stable rule (connection ID) so it’s predictable which line jumps.
- Avoids touching other connections: each connection only alters its own path.

---

## How It’s Implemented

### 1. Renderer Override

The plugin **extends `BpmnRenderer`** (from `bpmn-js/lib/draw/BpmnRenderer`) and **replaces** the handler for `bpmn:SequenceFlow`. The original handler is stored and used whenever we don’t draw jumps (e.g. during direct editing or when the connection doesn’t qualify).

So we’re not rewriting the whole BPMN renderer—we only intercept sequence flow drawing and, when appropriate, draw a custom SVG path with arcs at crossings, then re-use the original handler for styling/arrows when we don’t.

### 2. When Jumps Are Applied

Jumps are **optional** and **scoped**:

- **Config**: `jumpEffect` can be turned off; `minIntersectionAngle` and `jumpThreshold` tune sensitivity and how close to endpoints we allow jumps.
- **Eligibility** (`_shouldApplyJumps`): Only connections that are “normal” sequence flows—length ≥ 50px, waypoints between 2 and 4—get the effect. Very short or heavily routed connections are left to the default renderer.
- **Stability** (`_isElementStable`): We only run jump logic when the element has valid waypoints and already has graphics, to avoid races during create/move.

So “what happened” at the plugin level is: we wired a custom SequenceFlow handler that, when the above conditions hold, computes crossings and draws arcs; otherwise we delegate to the original BPMN renderer.

### 3. “Who Jumps” Rule (One-Way Jumps)

To avoid double arcs and keep a clear hierarchy, we use a **fixed rule**: the connection with the **larger element ID** draws the jump over the other (`_shouldJumpOver`). So for any pair, only one line has an arc; the other is unchanged. Order is consistent and independent of creation order in the session.

### 4. Intersection Detection and Arcs

- **Relevant connections**: We restrict to other `bpmn:SequenceFlow` elements whose bounding box overlaps the current one (`_connectionsBoundsOverlap`), to keep work limited.
- **Segments**: For each segment of the current connection, we run line–segment intersection (with a precise variant `_getPreciseLineIntersection` and rounding for stability).
- **Significance** (`_isSignificantIntersection`): We only add a jump if the angle between segments is in a “crossing” range (not almost parallel) and the intersection is not too close to either line’s endpoints, using `minIntersectionAngle` and `jumpThreshold`.
- **Cap**: At most **3 jumps per connection** to avoid clutter.
- **Path building**: Where we’ve decided to jump, we insert a small quadratic Bézier arc (`_createConsistentJump` / `_createStablePath`) so the line briefly goes “over” the other. Coordinates are rounded for stable, repeatable rendering.

So “how this plugin is implemented” for the line itself is: **bounds filter → segment intersection → significance filter → cap at 3 → inject Bézier arcs into the SVG path**, and we always keep the original BPMN handler for the arrow and base style when we fall back.

### 5. Lifecycle and Editing

We avoid fighting with the diagram during editing and moving:

- **Direct editing**: On `directEditing.activate` we mark the connection as “being edited” and **disable jumps** for it (render with the original handler). On `complete` / `cancel` we clear that and refresh so jumps come back.
- **Movement**: `connection.move`, `connection.updateWaypoints`, and their `commandStack.*.postExecuted` versions are handled with a **debounced** update (~50ms): we refresh the moved connection and then refresh others that might have been crossing it (bounds overlap), with a short stagger to avoid overload.
- **Removal**: On `shape.removed` and `commandStack.connection.delete.postExecuted`, we **debounce** (~10ms) and then refresh every connection that used to jump over the removed one (`_wasJumpingOver`), so arcs disappear when the crossed connection is deleted.
- **Diagram clear**: We reset internal state (pending removals, “being edited” set, scheduled flags) so the next diagram load doesn’t carry over.

So “what happened” from a lifecycle view: we listen to a small set of events, debounce where it matters, and only change rendering for connections that are stable and not being edited.

### 6. Integration Point

The module is registered in the Cloud BPMN modeler’s `_modules` and provides `JumpConnectionRenderer` with `$inject` for `config.bpmnRenderer`, `eventBus`, `styles`, `pathMap`, `canvas`, `textRenderer`, `elementRegistry`, and `graphicsFactory`. It runs in the same dependency-injection and rendering pipeline as the default BPMN renderer; we only swap the SequenceFlow handler.

---

## Design Choices in One Sentence Each

- **One-way jumps by ID**: One crossing → one arc, stable and easy to reason about.
- **No edits to other connections**: Each connection only changes its own path; no cascading rewrites of other flows.
- **Jumps off during direct editing**: Avoids arcs fighting with waypoint drag and keeps the UX clean.
- **Debounced updates on move/delete**: Fewer redraws and less flicker.
- **Stability checks before jump math**: Avoids using half-initialized waypoints and ensures consistent behavior.

---

## Files Touched

- **New**: `client/src/plugins/jump-effect-plugin/JumpConnectionRenderer.js` — renderer, event wiring, intersection and path logic.
- **New**: `client/src/plugins/jump-effect-plugin/README.md` — usage, config, and high-level behavior.
- **Modified**: `client/src/app/tabs/cloud-bpmn/modeler/BpmnModeler.js` — `jumpConnectionRenderer` added to the modeler’s `_modules`.

---

## How to Verify

1. Open a BPMN diagram with two or more sequence flows that cross.
2. Confirm only one line has a small arc at each crossing and that it’s consistent when you reload.
3. Drag waypoints of one connection: arcs on others should update or disappear as crossings change; the one you’re editing should show no jump until you finish editing.
4. Delete a connection that another one was jumping over: the remaining connection should revert to a straight segment where the crossing was.
5. Toggle `jumpEffect: false` in config (if exposed) and confirm sequence flows render as before, with no arcs.

---

*This description is intended for reviewers as a concise “what we built and why” for the jump-effect plugin and its integration into the Cloud BPMN modeler.*
