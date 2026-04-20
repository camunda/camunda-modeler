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
 * Drives the scripted playback of a copilot scenario.
 *
 * Events:
 *   - 'step'     — emitted per step with the step object, *before* its durationMs wait
 *   - 'complete' — emitted when playback finishes naturally (not on stop)
 *
 * The player is responsible only for timing and event emission. Rendering,
 * narration typing, and log accumulation live in subscribers.
 */
export class CopilotPlayer {
  constructor(scenario) {
    this._scenario = scenario;
    this._listeners = { step: [], complete: [] };
    this._stopped = false;
    this._running = false;
  }

  on(event, handler) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(handler);
  }

  isRunning() {
    return this._running;
  }

  stop() {
    this._stopped = true;
    this._running = false;
  }

  async start() {
    this._stopped = false;
    this._running = true;

    for (let i = 0; i < this._scenario.steps.length; i++) {
      if (this._stopped) break;
      const step = this._scenario.steps[i];
      this._emit('step', { ...step, index: i });
      await wait(step.durationMs || 800);
    }

    if (!this._stopped) {
      this._emit('complete');
    }
    this._running = false;
  }

  /**
   * Produce the XML containing only elements up to index `uptoIndex` (inclusive).
   * Implementation: parses `resultXml`, removes shapes not yet placed based on
   * step element IDs, returns reserialized XML.
   *
   * Naive regex-based implementation keeps the deps footprint minimal — the
   * scenario XMLs are small and well-formed (hand-authored).
   */
  getPartialXml(uptoIndex) {
    const xml = this._scenario.resultXml;
    const placed = new Set(
      this._scenario.steps.slice(0, uptoIndex + 1).map(s => s.elementId)
    );

    // Remove any element whose id is not in `placed`, along with attached
    // sequence flows that reference it. Crude but adequate for hand-authored
    // XML with stable structure.
    return xml.replace(
      /<bpmn:(startEvent|endEvent|userTask|serviceTask|task|exclusiveGateway|parallelGateway|intermediateThrowEvent|intermediateCatchEvent|sequenceFlow)([^>]*)\bid="([^"]+)"([^>]*)(\/>|>[\s\S]*?<\/bpmn:\1>)/g,
      (match, tag, attrsBefore, id, attrsAfter, rest) => {

        // Sequence flows: keep only if both endpoints are placed.
        if (tag === 'sequenceFlow') {
          const srcMatch = match.match(/sourceRef="([^"]+)"/);
          const tgtMatch = match.match(/targetRef="([^"]+)"/);
          if (srcMatch && tgtMatch && placed.has(srcMatch[1]) && placed.has(tgtMatch[1])) {
            return match;
          }
          return '';
        }
        return placed.has(id) ? match : '';
      }
    );
  }

  _emit(event, payload) {
    (this._listeners[event] || []).forEach(h => h(payload));
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
