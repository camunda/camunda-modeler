import BpmnRenderer from "bpmn-js/lib/draw/BpmnRenderer";
import inherits from "inherits-browser";
import { append as svgAppend, clear as svgClear } from "tiny-svg";

function JumpConnectionRenderer(
  config,
  eventBus,
  styles,
  pathMap,
  canvas,
  textRenderer,
  elementRegistry,
  graphicsFactory,
  priority = 2000
) {
  BpmnRenderer.call(
    this,
    config,
    eventBus,
    styles,
    pathMap,
    canvas,
    textRenderer,
    priority
  );

  this._eventBus = eventBus;
  this._elementRegistry = elementRegistry;
  this._graphicsFactory = graphicsFactory;
  this._canvas = canvas;
  this._styles = styles;

  // Configuration - subtle, professional defaults
  config = config || {};
  this.jumpEffect =
    config.jumpEffect !== undefined ? !!config.jumpEffect : true;
  this.minIntersectionAngle = config.minIntersectionAngle || 20; // More sensitive to crossing angles
  this.jumpThreshold = config.jumpThreshold || 10; // Increased minimum distance from endpoints

  // Simple state tracking
  this._updateScheduled = false;
  this._pendingRemovals = new Set(); // Track pending removals for debouncing
  this._connectionsBeingEdited = new Set(); // Track connections currently being edited
  this._movementUpdateScheduled = false; // Debounce movement updates

  // Initialize event handlers - less aggressive
  this._initEventHandlers();

  // Save reference to original handler
  this._originalSequenceFlowHandler = this.handlers["bpmn:SequenceFlow"];

  // GUARANTEED NON-INTERFERENCE: Each line creates its OWN jumps, existing lines NEVER modified
  // 1. NEW line (C, D, Z) creates its OWN jump arcs
  // 2. EXISTING lines (A, B) remain completely unchanged
  // 3. EXISTING jump arcs (B's jumps) remain intact
  // 4. NO jumps during direct editing to prevent knotting
  // 5. ONLY the connection being rendered gets jumps - others are untouched
  this.handlers["bpmn:SequenceFlow"] = (parentGfx, element, attrs) => {
    // Check if this connection is currently being edited
    const isBeingEdited = this._connectionsBeingEdited.has(element.id);

    if (isBeingEdited) {
      return this._originalSequenceFlowHandler(parentGfx, element, attrs);
    }

    if (this.jumpEffect && this._shouldApplyJumps(element)) {
      return this._renderWithSelectiveJumps(parentGfx, element, attrs);
    } else {
      return this._originalSequenceFlowHandler(parentGfx, element, attrs);
    }
  };
}

inherits(JumpConnectionRenderer, BpmnRenderer);

// Event handling for connection removal - update connections that were jumping over removed ones
JumpConnectionRenderer.prototype._initEventHandlers = function () {
  const eventBus = this._eventBus;

  // Clean up on diagram clear
  eventBus.on("diagram.clear", () => {
    this._updateScheduled = false;
    this._pendingRemovals.clear();
    this._connectionsBeingEdited.clear();
    this._movementUpdateScheduled = false;
  });

  // When a connection is removed, update any connections that were jumping over it (debounced)
  eventBus.on("shape.removed", (event) => {
    const removedElement = event.element;
    if (removedElement && removedElement.type === "bpmn:SequenceFlow") {
      // console.log(`🗑️ Connection ${removedElement.id} removed - scheduling update`);
      this._scheduleRemovalUpdate(removedElement);
    }
  });

  // Also handle when connections are deleted via command stack
  eventBus.on("commandStack.connection.delete.postExecuted", (event) => {
    const removedConnection = event.context.connection;
    if (removedConnection) {
      // console.log(`🗑️ Connection ${removedConnection.id} deleted - scheduling update`);
      this._scheduleRemovalUpdate(removedConnection);
    }
  });

  // IMPROVED FIX: Handle direct editing and movement events
  eventBus.on("directEditing.activate", (event) => {
    const element = event.element;
    if (element && element.type === "bpmn:SequenceFlow") {
      // console.log(`✏️ Direct editing started on ${element.id} - temporarily disabling jumps`);
      // Mark this connection as being edited to avoid interference
      this._markAsBeingEdited(element);
    }
  });

  eventBus.on("directEditing.complete", (event) => {
    const element = event.element;
    if (element && element.type === "bpmn:SequenceFlow") {
      // console.log(`✅ Direct editing completed on ${element.id} - re-enabling jumps`);
      // Re-enable jumps and force refresh
      this._unmarkAsBeingEdited(element);
      this._forceConnectionUpdate(element);
    }
  });

  eventBus.on("directEditing.cancel", (event) => {
    const element = event.element;
    if (element && element.type === "bpmn:SequenceFlow") {
      // console.log(`❌ Direct editing cancelled on ${element.id} - re-enabling jumps`);
      // Re-enable jumps and force refresh
      this._unmarkAsBeingEdited(element);
      this._forceConnectionUpdate(element);
    }
  });

  // MOVEMENT HANDLING: Update jump arcs when connections are moved/modified
  eventBus.on("connection.move", (event) => {
    this._handleConnectionMovement(event);
  });

  eventBus.on("connection.updateWaypoints", (event) => {
    this._handleConnectionMovement(event);
  });

  eventBus.on("commandStack.connection.move.postExecuted", (event) => {
    this._handleConnectionMovement(event);
  });

  eventBus.on(
    "commandStack.connection.updateWaypoints.postExecuted",
    (event) => {
      this._handleConnectionMovement(event);
    }
  );

  // Handle shape movements that might affect connections
  eventBus.on("commandStack.elements.move.postExecuted", (event) => {
    // console.log("🔄 Elements moved - updating affected connections");
    this._updateAffectedConnections(event.context.elements);
  });
};

// Schedule update for removal with debouncing (handles bulk deletions efficiently)
JumpConnectionRenderer.prototype._scheduleRemovalUpdate = function (
  removedConnection
) {
  // Add to pending removals set
  this._pendingRemovals.add(removedConnection);

  // If update is already scheduled, don't schedule another
  if (this._updateScheduled) return;

  this._updateScheduled = true;

  // Process all pending removals after a short delay
  setTimeout(() => {
    // console.log(`⚡ Processing ${this._pendingRemovals.size} pending connection removals`);

    // Get all removed connections before clearing the set
    const removedConnections = Array.from(this._pendingRemovals);
    this._pendingRemovals.clear();

    // Process all removals at once
    this._processBulkRemovals(removedConnections);

    this._updateScheduled = false;
  }, 10); // Very short delay for bulk operations
};

// Process multiple connection removals efficiently
JumpConnectionRenderer.prototype._processBulkRemovals = function (
  removedConnections
) {
  if (removedConnections.length === 0) return;

  // Find all remaining sequence flow connections once
  const remainingConnections = this._elementRegistry.filter(
    (element) =>
      element.type === "bpmn:SequenceFlow" &&
      element.waypoints &&
      this._shouldApplyJumps(element) &&
      !removedConnections.includes(element) // Not in the removed list
  );

  // Track connections that need updating (avoid duplicates)
  const connectionsToUpdate = new Set();

  // Check each removed connection against remaining connections
  removedConnections.forEach((removedConnection) => {
    if (!removedConnection || !removedConnection.waypoints) return;

    remainingConnections.forEach((connection) => {
      if (this._wasJumpingOver(connection, removedConnection)) {
        connectionsToUpdate.add(connection);
      }
    });
  });

  // console.log(`📝 Found ${connectionsToUpdate.size} connections to update after removing ${removedConnections.length} connections`);

  // Update each affected connection
  connectionsToUpdate.forEach((connection) => {
    const gfx = this._elementRegistry.getGraphics(connection);
    if (gfx) {
      // console.log(`🔄 Updating connection ${connection.id} (was jumping over removed line)`);
      this._graphicsFactory.update("connection", connection, gfx);
    }
  });
};

// Update connections that were jumping over a removed connection (single removal - legacy)
JumpConnectionRenderer.prototype._updateConnectionsJumpingOver = function (
  removedConnection
) {
  if (!removedConnection || !removedConnection.waypoints) return;

  // Find all remaining sequence flow connections
  const remainingConnections = this._elementRegistry.filter(
    (element) =>
      element.type === "bpmn:SequenceFlow" &&
      element !== removedConnection &&
      element.waypoints &&
      this._shouldApplyJumps(element)
  );

  // Check which connections were potentially jumping over the removed one
  const connectionsToUpdate = remainingConnections.filter((connection) => {
    return this._wasJumpingOver(connection, removedConnection);
  });

  // console.log(`📝 Found ${connectionsToUpdate.length} connections to update after removing ${removedConnection.id}`);

  // Update each affected connection
  connectionsToUpdate.forEach((connection) => {
    const gfx = this._elementRegistry.getGraphics(connection);
    if (gfx) {
      // console.log(`🔄 Updating connection ${connection.id} (was jumping over removed line)`);
      // Force re-render of this connection
      this._graphicsFactory.update("connection", connection, gfx);
    }
  });
};

// Check if a connection was jumping over the removed connection
JumpConnectionRenderer.prototype._wasJumpingOver = function (
  connection,
  removedConnection
) {
  // Quick bounds check first
  if (!this._connectionsBoundsOverlap(connection, removedConnection)) {
    return false;
  }

  // Check for actual intersections between the connections
  for (let i = 0; i < connection.waypoints.length - 1; i++) {
    const segmentStart = connection.waypoints[i];
    const segmentEnd = connection.waypoints[i + 1];

    for (let j = 0; j < removedConnection.waypoints.length - 1; j++) {
      const removedStart = removedConnection.waypoints[j];
      const removedEnd = removedConnection.waypoints[j + 1];

      const intersection = this._getLineIntersection(
        segmentStart,
        segmentEnd,
        removedStart,
        removedEnd
      );

      if (
        intersection &&
        this._isSignificantIntersection(
          segmentStart,
          segmentEnd,
          removedStart,
          removedEnd,
          intersection
        )
      ) {
        return true; // This connection was intersecting with the removed one
      }
    }
  }

  return false;
};

// Mark connection as being edited to avoid jump arc interference
JumpConnectionRenderer.prototype._markAsBeingEdited = function (element) {
  if (!element || !element.id) return;
  this._connectionsBeingEdited.add(element.id);
  // console.log(`🚫 Marked ${element.id} as being edited - jumps disabled`);
};

// Unmark connection and re-enable jump arcs
JumpConnectionRenderer.prototype._unmarkAsBeingEdited = function (element) {
  if (!element || !element.id) return;
  this._connectionsBeingEdited.delete(element.id);
  // console.log(`✅ Unmarked ${element.id} as being edited - jumps re-enabled`);
};

// Force connection update with proper delay
JumpConnectionRenderer.prototype._forceConnectionUpdate = function (element) {
  if (!element || !element.id) return;

  // Multiple timeouts to handle different rendering phases
  setTimeout(() => {
    const gfx = this._elementRegistry.getGraphics(element);
    if (gfx) {
      // console.log(`🔄 Forcing update for ${element.id}`);
      this._graphicsFactory.update("connection", element, gfx);
    }
  }, 20);

  // Second attempt to catch any missed renders
  setTimeout(() => {
    const gfx = this._elementRegistry.getGraphics(element);
    if (gfx) {
      this._graphicsFactory.update("connection", element, gfx);
    }
  }, 100);
};

// Handle connection movement events
JumpConnectionRenderer.prototype._handleConnectionMovement = function (event) {
  const connection =
    event.element ||
    event.connection ||
    (event.context && event.context.connection);

  if (!connection || connection.type !== "bpmn:SequenceFlow") return;

  // console.log(`🔄 Connection ${connection.id} moved - scheduling jump update`);
  this._scheduleMovementUpdate(connection);
};

// Schedule movement update with debouncing
JumpConnectionRenderer.prototype._scheduleMovementUpdate = function (
  movedConnection
) {
  if (this._movementUpdateScheduled) return;

  this._movementUpdateScheduled = true;

  setTimeout(() => {
    // console.log(`⚡ Processing movement update for connections`);

    // Update the moved connection
    if (movedConnection) {
      this._forceConnectionUpdate(movedConnection);
    }

    // Update any connections that might be affected by this movement
    this._updateConnectionsAffectedByMovement(movedConnection);

    this._movementUpdateScheduled = false;
  }, 50); // Longer delay for movement to settle
};

// Update connections affected by movement
JumpConnectionRenderer.prototype._updateConnectionsAffectedByMovement =
  function (movedConnection) {
    if (!movedConnection || !movedConnection.waypoints) return;

    // Find all sequence flow connections that might be affected
    const allConnections = this._elementRegistry.filter(
      (element) =>
        element.type === "bpmn:SequenceFlow" &&
        element !== movedConnection &&
        element.waypoints &&
        this._shouldApplyJumps(element)
    );

    // Check which connections might intersect with the moved one
    const affectedConnections = allConnections.filter((connection) => {
      return this._connectionsBoundsOverlap(connection, movedConnection);
    });

    // console.log(`📝 Found ${affectedConnections.length} connections potentially affected by movement`);

    // Update each affected connection
    affectedConnections.forEach((connection) => {
      setTimeout(() => {
        this._forceConnectionUpdate(connection);
      }, 75); // Staggered updates
    });
  };

// Update connections affected by element movements (shapes)
JumpConnectionRenderer.prototype._updateAffectedConnections = function (
  movedElements
) {
  if (!movedElements || movedElements.length === 0) return;

  // Find all sequence flow connections
  const allConnections = this._elementRegistry.filter(
    (element) =>
      element.type === "bpmn:SequenceFlow" &&
      element.waypoints &&
      this._shouldApplyJumps(element)
  );

  // Update all connections as shape movements can affect routing
  // console.log(`📝 Updating ${allConnections.length} connections after shape movement`);

  allConnections.forEach((connection, index) => {
    setTimeout(() => {
      this._forceConnectionUpdate(connection);
    }, index * 25); // Staggered updates to avoid overwhelming the renderer
  });
};

// Removed mass update methods - each connection handles its own jumps during natural rendering

// Determine if jumps should be applied to this connection
JumpConnectionRenderer.prototype._shouldApplyJumps = function (element) {
  // Don't apply to certain types of connections
  if (!element || !element.waypoints || element.waypoints.length < 2) {
    return false;
  }

  // Skip very short connections
  const totalLength = this._getConnectionLength(element);
  if (totalLength < 50) {
    return false;
  }

  // Skip connections with too many waypoints (likely already well-routed)
  if (element.waypoints.length > 4) {
    return false;
  }

  return true;
};

// Calculate total connection length
JumpConnectionRenderer.prototype._getConnectionLength = function (connection) {
  const waypoints = connection.waypoints;
  let length = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const dx = waypoints[i + 1].x - waypoints[i].x;
    const dy = waypoints[i + 1].y - waypoints[i].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }

  return length;
};

// STABILITY FUNCTIONS: Ensure consistent jump behavior every time

// Check if element waypoints are stable and finalized
JumpConnectionRenderer.prototype._isElementStable = function (element) {
  if (!element || !element.waypoints || element.waypoints.length < 2) {
    return false;
  }

  // Check if waypoints have valid coordinates
  for (const waypoint of element.waypoints) {
    if (
      waypoint.x === undefined ||
      waypoint.y === undefined ||
      waypoint.x === null ||
      waypoint.y === null ||
      isNaN(waypoint.x) ||
      isNaN(waypoint.y)
    ) {
      return false;
    }
  }

  // Check if element has graphics (rendered)
  const gfx = this._elementRegistry.getGraphics(element);
  return !!gfx;
};

// Get stable connections for intersection checking
JumpConnectionRenderer.prototype._getStableRelevantConnections = function (
  element
) {
  const connections = this._elementRegistry.filter((other) => {
    if (!other || other === element || other.type !== "bpmn:SequenceFlow") {
      return false;
    }

    // Only include stable connections
    if (!this._isElementStable(other)) {
      return false;
    }

    // Only check connections that might actually intersect
    return this._connectionsBoundsOverlap(element, other);
  });

  // Sort by ID for consistent processing order
  return connections.sort((a, b) => a.id.localeCompare(b.id));
};

// Find intersections with enhanced precision and stability
JumpConnectionRenderer.prototype._findStableIntersections = function (
  waypoints,
  otherConnections,
  currentElement
) {
  const intersections = [];
  const precision = 0.001; // Higher precision for consistent results

  // console.log(`🔍 ${currentElement.id} performing STABLE intersection detection`);

  // Check each segment of this connection
  for (let i = 0; i < waypoints.length - 1; i++) {
    const segmentStart = waypoints[i];
    const segmentEnd = waypoints[i + 1];
    const segmentLength = this._getSegmentLength(segmentStart, segmentEnd);

    if (segmentLength < 20) continue;

    for (const other of otherConnections) {
      if (!this._shouldJumpOver(currentElement, other)) {
        continue;
      }

      for (let j = 0; j < other.waypoints.length - 1; j++) {
        const otherStart = other.waypoints[j];
        const otherEnd = other.waypoints[j + 1];

        const intersection = this._getPreciseLineIntersection(
          segmentStart,
          segmentEnd,
          otherStart,
          otherEnd,
          precision
        );

        if (
          intersection &&
          this._isSignificantIntersection(
            segmentStart,
            segmentEnd,
            otherStart,
            otherEnd,
            intersection
          )
        ) {
          const targetType = this._hasExistingJumps(other)
            ? "JUMPED"
            : "ORIGINAL";
          // console.log(`🔵 ${currentElement.id} creates STABLE jump over ${targetType} line ${other.id}`);

          // Round intersection coordinates for consistency
          intersections.push({
            point: {
              x: Math.round(intersection.x * 100) / 100,
              y: Math.round(intersection.y * 100) / 100,
            },
            segment: i,
            distance: this._getDistanceAlongSegment(
              segmentStart,
              segmentEnd,
              intersection
            ),
            otherConnection: other,
          });
        }
      }
    }
  }

  // Sort for consistent order
  intersections.sort((a, b) => {
    if (a.segment !== b.segment) {
      return a.segment - b.segment;
    }
    return a.distance - b.distance;
  });

  const finalIntersections = intersections.slice(0, 3);
  // console.log(`✅ ${currentElement.id} will create ${finalIntersections.length} STABLE jump arcs`);

  return finalIntersections;
};

// Create stable path with consistent jump arcs
JumpConnectionRenderer.prototype._createStablePath = function (
  waypoints,
  intersections
) {
  if (waypoints.length < 2) return "";

  let path = [];
  let currentPoint = waypoints[0];

  // Start path
  path.push(
    `M ${Math.round(currentPoint.x * 100) / 100} ${
      Math.round(currentPoint.y * 100) / 100
    }`
  );

  for (
    let segmentIndex = 0;
    segmentIndex < waypoints.length - 1;
    segmentIndex++
  ) {
    const segmentStart = waypoints[segmentIndex];
    const segmentEnd = waypoints[segmentIndex + 1];

    // Get intersections for this segment
    const segmentIntersections = intersections.filter(
      (inter) => inter.segment === segmentIndex
    );

    if (segmentIntersections.length === 0) {
      // No intersections, draw straight line
      path.push(
        `L ${Math.round(segmentEnd.x * 100) / 100} ${
          Math.round(segmentEnd.y * 100) / 100
        }`
      );
      currentPoint = segmentEnd;
      continue;
    }

    // Process intersections with consistent jumps
    let lastPoint = segmentStart;

    for (const intersection of segmentIntersections) {
      const jumpArc = this._createConsistentJump(
        lastPoint,
        intersection.point,
        segmentEnd
      );
      path.push(...jumpArc.pathSegments);
      lastPoint = jumpArc.endPoint;
    }

    // Complete the segment
    if (
      Math.abs(lastPoint.x - segmentEnd.x) > 0.01 ||
      Math.abs(lastPoint.y - segmentEnd.y) > 0.01
    ) {
      path.push(
        `L ${Math.round(segmentEnd.x * 100) / 100} ${
          Math.round(segmentEnd.y * 100) / 100
        }`
      );
    }

    currentPoint = segmentEnd;
  }

  return path.join(" ");
};

// Removed mass update methods - each connection handles its own jumps during natural rendering

// STABLE rendering with deterministic jumps - fixes inconsistent behavior
JumpConnectionRenderer.prototype._renderWithSelectiveJumps = function (
  parentGfx,
  element,
  attrs
) {
  // STABILITY FIX: Add small delay to ensure all elements are properly positioned
  // This prevents race conditions where waypoints aren't finalized yet
  if (!this._isElementStable(element)) {
    // console.log(`⏳ ${element.id} not stable yet - using original rendering`);
    return this._callOriginalHandler(parentGfx, element, attrs);
  }

  // Get relevant other connections with stability check
  const otherConnections = this._getStableRelevantConnections(element);

  // Find only significant intersections with enhanced precision
  const intersections = this._findStableIntersections(
    element.waypoints,
    otherConnections,
    element
  );

  if (intersections.length === 0) {
    // No intersections found, use original rendering to preserve arrow heads
    return this._callOriginalHandler(parentGfx, element, attrs);
  }

  // Clear existing graphics for custom rendering
  svgClear(parentGfx);

  // Create main connection path with consistent jumps
  const pathData = this._createStablePath(element.waypoints, intersections);

  // Create main path element
  const pathElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  pathElement.setAttribute("d", pathData);

  // Apply professional styling
  const style = this._getProfessionalStyle(attrs);
  Object.entries(style).forEach(([key, value]) => {
    pathElement.setAttribute(key, value);
  });

  svgAppend(parentGfx, pathElement);

  // Add arrow head marker
  this._addArrowHead(parentGfx, element, style);

  return pathElement;
};

// Call original handler to preserve BPMN styling and markers
JumpConnectionRenderer.prototype._callOriginalHandler = function (
  parentGfx,
  element,
  attrs
) {
  // Use the saved original handler
  if (this._originalSequenceFlowHandler) {
    return this._originalSequenceFlowHandler(parentGfx, element, attrs);
  }

  // Fallback: create basic path with arrow head
  svgClear(parentGfx);
  const pathData = this._createBasicPath(element.waypoints);
  const pathElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  pathElement.setAttribute("d", pathData);

  const style = this._getProfessionalStyle(attrs);
  Object.entries(style).forEach(([key, value]) => {
    pathElement.setAttribute(key, value);
  });

  svgAppend(parentGfx, pathElement);
  this._addArrowHead(parentGfx, element, style);
  return pathElement;
};

// Add arrow head to connection
JumpConnectionRenderer.prototype._addArrowHead = function (
  parentGfx,
  element,
  style
) {
  const waypoints = element.waypoints;
  if (waypoints.length < 2) return;

  const lastPoint = waypoints[waypoints.length - 1];
  const secondLastPoint = waypoints[waypoints.length - 2];

  // Calculate arrow direction
  const dx = lastPoint.x - secondLastPoint.x;
  const dy = lastPoint.y - secondLastPoint.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return;

  // Normalize direction
  const dirX = dx / length;
  const dirY = dy / length;

  // Arrow dimensions
  const arrowLength = 8;
  const arrowWidth = 6;

  // Calculate arrow points
  const arrowBase = {
    x: lastPoint.x - dirX * arrowLength,
    y: lastPoint.y - dirY * arrowLength,
  };

  const arrowSide1 = {
    x: arrowBase.x - (dirY * arrowWidth) / 2,
    y: arrowBase.y + (dirX * arrowWidth) / 2,
  };

  const arrowSide2 = {
    x: arrowBase.x + (dirY * arrowWidth) / 2,
    y: arrowBase.y - (dirX * arrowWidth) / 2,
  };

  // Create arrow head path
  const arrowPath = `M ${lastPoint.x} ${lastPoint.y} L ${arrowSide1.x} ${arrowSide1.y} L ${arrowSide2.x} ${arrowSide2.y} Z`;

  // Create arrow head element
  const arrowElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  arrowElement.setAttribute("d", arrowPath);
  arrowElement.setAttribute("fill", style.stroke || "#000");
  arrowElement.setAttribute("stroke", style.stroke || "#000");
  arrowElement.setAttribute("stroke-width", "1");

  svgAppend(parentGfx, arrowElement);
};

// Create basic path without jumps
JumpConnectionRenderer.prototype._createBasicPath = function (waypoints) {
  if (waypoints.length < 2) return "";

  let path = `M ${waypoints[0].x} ${waypoints[0].y}`;
  for (let i = 1; i < waypoints.length; i++) {
    path += ` L ${waypoints[i].x} ${waypoints[i].y}`;
  }
  return path;
};

// Get only relevant connections for intersection checking
JumpConnectionRenderer.prototype._getRelevantConnections = function (element) {
  return this._elementRegistry.filter((other) => {
    if (!other || other === element || other.type !== "bpmn:SequenceFlow") {
      return false;
    }

    if (!other.waypoints || other.waypoints.length < 2) {
      return false;
    }

    // Only check connections that might actually intersect
    return this._connectionsBoundsOverlap(element, other);
  });
};

// Quick bounds check for potential intersection
JumpConnectionRenderer.prototype._connectionsBoundsOverlap = function (
  connA,
  connB
) {
  const boundsA = this._getConnectionBounds(connA);
  const boundsB = this._getConnectionBounds(connB);

  const margin = 20; // Add margin for tolerance

  return !(
    boundsA.right + margin < boundsB.left ||
    boundsB.right + margin < boundsA.left ||
    boundsA.bottom + margin < boundsB.top ||
    boundsB.bottom + margin < boundsA.top
  );
};

// Get connection bounds
JumpConnectionRenderer.prototype._getConnectionBounds = function (connection) {
  const waypoints = connection.waypoints;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  waypoints.forEach((point) => {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  });

  return { left: minX, top: minY, right: maxX, bottom: maxY };
};

// Find intersections - LEGACY METHOD (kept for compatibility)
JumpConnectionRenderer.prototype._findSignificantIntersections = function (
  waypoints,
  otherConnections,
  currentElement
) {
  const intersections = [];

  // console.log(`🔍 ${currentElement.id} checking intersections to create its OWN jump arcs`);

  // Check each segment of this connection
  for (let i = 0; i < waypoints.length - 1; i++) {
    const segmentStart = waypoints[i];
    const segmentEnd = waypoints[i + 1];
    const segmentLength = this._getSegmentLength(segmentStart, segmentEnd);

    // Skip very short segments
    if (segmentLength < 20) continue;

    // INDIVIDUAL LOGIC: THIS connection creates jumps for itself only
    // Line A (original) → Line B creates jumps over A → Line C creates jumps over B
    // Result: A unchanged, B has jumps over A, C has jumps over B
    for (const other of otherConnections) {
      // PRIORITY CHECK: Only jump if this connection is "newer" than the other
      if (!this._shouldJumpOver(currentElement, other)) {
        continue; // Skip - this connection should NOT jump over the other
      }

      for (let j = 0; j < other.waypoints.length - 1; j++) {
        const otherStart = other.waypoints[j];
        const otherEnd = other.waypoints[j + 1];

        const intersection = this._getLineIntersection(
          segmentStart,
          segmentEnd,
          otherStart,
          otherEnd
        );

        if (
          intersection &&
          this._isSignificantIntersection(
            segmentStart,
            segmentEnd,
            otherStart,
            otherEnd,
            intersection
          )
        ) {
          const targetType = this._hasExistingJumps(other)
            ? "JUMPED"
            : "ORIGINAL";
          // console.log(`🔵 ${currentElement.id} creates its OWN jump over ${targetType} line ${other.id} (${other.id} remains untouched)`);
          intersections.push({
            point: intersection,
            segment: i,
            distance: this._getDistanceAlongSegment(
              segmentStart,
              segmentEnd,
              intersection
            ),
            otherConnection: other,
          });
        }
      }
    }
  }

  // Sort and filter to prevent too many jumps
  intersections.sort((a, b) => {
    if (a.segment !== b.segment) {
      return a.segment - b.segment;
    }
    return a.distance - b.distance;
  });

  // Limit intersections to prevent visual clutter
  const finalIntersections = intersections.slice(0, 3); // Max 3 jumps per connection

  // console.log(`✅ ${currentElement.id} will create ${finalIntersections.length} jump arcs (existing lines remain intact)`);

  return finalIntersections;
};

// IMPROVED: Cascading jump logic - newer lines jump over ALL older lines (including jumped ones)
JumpConnectionRenderer.prototype._shouldJumpOver = function (
  thisConnection,
  otherConnection
) {
  // Method 1: Use element ID comparison for consistent behavior
  // The connection with the "later" ID is considered newer and should jump
  if (thisConnection.id && otherConnection.id) {
    const shouldJump = thisConnection.id > otherConnection.id;
    const targetType = this._hasExistingJumps(otherConnection)
      ? "JUMPED"
      : "ORIGINAL";
    // console.log(`Jump decision: ${thisConnection.id} vs ${otherConnection.id} = ${shouldJump ? `JUMP over ${targetType} line` : "NO JUMP"}`);
    return shouldJump;
  }

  // Fallback: Default to not jumping to prevent excessive jumps
  return false;
};

// Check if a connection already has jump arcs (is a "jumped line")
JumpConnectionRenderer.prototype._hasExistingJumps = function (connection) {
  // Quick check: if this connection has intersections with earlier connections, it likely has jumps
  const earlierConnections = this._elementRegistry.filter(
    (element) =>
      element.type === "bpmn:SequenceFlow" &&
      element !== connection &&
      element.waypoints &&
      element.id < connection.id // Earlier ID = existing when this connection was created
  );

  // Check if this connection intersects with any earlier connections
  for (const earlier of earlierConnections) {
    if (this._connectionsBoundsOverlap(connection, earlier)) {
      return true; // This connection likely has jumps
    }
  }

  return false;
};

// Check if intersection is significant enough to warrant a jump
JumpConnectionRenderer.prototype._isSignificantIntersection = function (
  seg1Start,
  seg1End,
  seg2Start,
  seg2End,
  intersection
) {
  // Calculate angle between segments
  const angle = this._getIntersectionAngle(
    seg1Start,
    seg1End,
    seg2Start,
    seg2End
  );

  // Only create jumps for intersections at significant angles
  if (
    angle < this.minIntersectionAngle ||
    angle > 180 - this.minIntersectionAngle
  ) {
    return false;
  }

  // Don't create jumps too close to endpoints
  const dist1 = this._getDistanceAlongSegment(seg1Start, seg1End, intersection);
  const dist2 = this._getDistanceAlongSegment(seg2Start, seg2End, intersection);
  const len1 = this._getSegmentLength(seg1Start, seg1End);
  const len2 = this._getSegmentLength(seg2Start, seg2End);

  const threshold = this.jumpThreshold;

  return (
    dist1 > threshold &&
    dist1 < len1 - threshold &&
    dist2 > threshold &&
    dist2 < len2 - threshold
  );
};

// Calculate intersection angle
JumpConnectionRenderer.prototype._getIntersectionAngle = function (
  seg1Start,
  seg1End,
  seg2Start,
  seg2End
) {
  const v1 = { x: seg1End.x - seg1Start.x, y: seg1End.y - seg1Start.y };
  const v2 = { x: seg2End.x - seg2Start.x, y: seg2End.y - seg2Start.y };

  const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  if (len1 === 0 || len2 === 0) return 0;

  const dot = v1.x * v2.x + v1.y * v2.y;
  const cos = dot / (len1 * len2);
  const angle = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;

  return Math.min(angle, 180 - angle);
};

// Get segment length
JumpConnectionRenderer.prototype._getSegmentLength = function (start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// Get intersection point between two line segments (original method)
JumpConnectionRenderer.prototype._getLineIntersection = function (
  p1,
  p2,
  p3,
  p4
) {
  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);

  if (Math.abs(denom) < 0.001) {
    return null; // Lines are parallel
  }

  const ua =
    ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
  const ub =
    ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: p1.x + ua * (p2.x - p1.x),
      y: p1.y + ua * (p2.y - p1.y),
    };
  }

  return null;
};

// ENHANCED precision intersection detection for consistent results
JumpConnectionRenderer.prototype._getPreciseLineIntersection = function (
  p1,
  p2,
  p3,
  p4,
  precision = 0.001
) {
  // Use higher precision calculation
  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);

  if (Math.abs(denom) < precision) {
    return null; // Lines are parallel
  }

  const ua =
    ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
  const ub =
    ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

  // Use tighter bounds for more precise intersection detection
  const tolerance = 0.001;
  if (
    ua >= -tolerance &&
    ua <= 1 + tolerance &&
    ub >= -tolerance &&
    ub <= 1 + tolerance
  ) {
    const intersectionX = p1.x + ua * (p2.x - p1.x);
    const intersectionY = p1.y + ua * (p2.y - p1.y);

    // Round to avoid floating point precision issues
    return {
      x: Math.round(intersectionX * 1000) / 1000,
      y: Math.round(intersectionY * 1000) / 1000,
    };
  }

  return null;
};

// Get distance along a segment to a point
JumpConnectionRenderer.prototype._getDistanceAlongSegment = function (
  start,
  end,
  point
) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return 0;

  const t =
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / (length * length);
  return t * length;
};

// Create professional path - LEGACY METHOD (kept for compatibility)
JumpConnectionRenderer.prototype._createProfessionalPath = function (
  waypoints,
  intersections
) {
  if (waypoints.length < 2) return "";

  let path = [];
  let currentPoint = waypoints[0];

  // Start path
  path.push(`M ${currentPoint.x} ${currentPoint.y}`);

  for (
    let segmentIndex = 0;
    segmentIndex < waypoints.length - 1;
    segmentIndex++
  ) {
    const segmentStart = waypoints[segmentIndex];
    const segmentEnd = waypoints[segmentIndex + 1];

    // Get intersections for this segment
    const segmentIntersections = intersections.filter(
      (inter) => inter.segment === segmentIndex
    );

    if (segmentIntersections.length === 0) {
      // No intersections, draw straight line
      path.push(`L ${segmentEnd.x} ${segmentEnd.y}`);
      currentPoint = segmentEnd;
      continue;
    }

    // Process intersections with subtle jumps
    let lastPoint = segmentStart;

    for (const intersection of segmentIntersections) {
      const jumpArc = this._createSubtleJump(
        lastPoint,
        intersection.point,
        segmentEnd
      );
      path.push(...jumpArc.pathSegments);
      lastPoint = jumpArc.endPoint;
    }

    // Complete the segment
    if (lastPoint.x !== segmentEnd.x || lastPoint.y !== segmentEnd.y) {
      path.push(`L ${segmentEnd.x} ${segmentEnd.y}`);
    }

    currentPoint = segmentEnd;
  }

  return path.join(" ");
};

// Create smooth, subtle jump arc - FIXED to prevent knotting
JumpConnectionRenderer.prototype._createSubtleJump = function (
  start,
  intersection,
  end
) {
  const jumpHeight = 8; // Reduced jump height for subtlety
  const arcWidth = 16; // Width of the arc along the connection

  // Calculate direction vector of the connection
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) {
    return {
      pathSegments: [`L ${end.x} ${end.y}`],
      endPoint: end,
    };
  }

  // Normalize direction vector
  const dirX = dx / length;
  const dirY = dy / length;

  // Perpendicular vector (for jump direction) - determine which way to jump
  const perpX = -dirY;
  const perpY = dirX;

  // Create jump points with reasonable spacing
  const jumpStart = {
    x: intersection.x - dirX * (arcWidth / 2),
    y: intersection.y - dirY * (arcWidth / 2),
  };

  const jumpEnd = {
    x: intersection.x + dirX * (arcWidth / 2),
    y: intersection.y + dirY * (arcWidth / 2),
  };

  // Control point for smooth arc - modest height
  const controlPoint = {
    x: intersection.x + perpX * jumpHeight,
    y: intersection.y + perpY * jumpHeight,
  };

  // Create smooth quadratic curve
  return {
    pathSegments: [
      `L ${jumpStart.x} ${jumpStart.y}`,
      `Q ${controlPoint.x} ${controlPoint.y} ${jumpEnd.x} ${jumpEnd.y}`,
    ],
    endPoint: jumpEnd,
  };
};

// CONSISTENT jump creation with rounded coordinates for stability
JumpConnectionRenderer.prototype._createConsistentJump = function (
  start,
  intersection,
  end
) {
  const jumpHeight = 8; // Fixed height for consistency
  const arcWidth = 16; // Fixed width for consistency

  // Calculate direction vector of the connection
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) {
    return {
      pathSegments: [
        `L ${Math.round(end.x * 100) / 100} ${Math.round(end.y * 100) / 100}`,
      ],
      endPoint: end,
    };
  }

  // Normalize direction vector
  const dirX = dx / length;
  const dirY = dy / length;

  // Perpendicular vector (for jump direction) - consistent direction
  const perpX = -dirY;
  const perpY = dirX;

  // Create jump points with rounded coordinates for consistency
  const jumpStart = {
    x: Math.round((intersection.x - dirX * (arcWidth / 2)) * 100) / 100,
    y: Math.round((intersection.y - dirY * (arcWidth / 2)) * 100) / 100,
  };

  const jumpEnd = {
    x: Math.round((intersection.x + dirX * (arcWidth / 2)) * 100) / 100,
    y: Math.round((intersection.y + dirY * (arcWidth / 2)) * 100) / 100,
  };

  // Control point for consistent arc
  const controlPoint = {
    x: Math.round((intersection.x + perpX * jumpHeight) * 100) / 100,
    y: Math.round((intersection.y + perpY * jumpHeight) * 100) / 100,
  };

  // Create stable quadratic curve with rounded coordinates
  return {
    pathSegments: [
      `L ${jumpStart.x} ${jumpStart.y}`,
      `Q ${controlPoint.x} ${controlPoint.y} ${jumpEnd.x} ${jumpEnd.y}`,
    ],
    endPoint: jumpEnd,
  };
};

// Professional styling that matches BPMN standards
JumpConnectionRenderer.prototype._getProfessionalStyle = function (attrs) {
  const baseStyle = this._styles.style(["no-fill"], {
    strokeWidth: 2,
    stroke: "#000",
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  });

  return Object.assign(baseStyle, attrs || {});
};

JumpConnectionRenderer.$inject = [
  "config.bpmnRenderer",
  "eventBus",
  "styles",
  "pathMap",
  "canvas",
  "textRenderer",
  "elementRegistry",
  "graphicsFactory",
];

export default {
  __init__: ["jumpConnectionRenderer"],
  jumpConnectionRenderer: ["type", JumpConnectionRenderer],
};
