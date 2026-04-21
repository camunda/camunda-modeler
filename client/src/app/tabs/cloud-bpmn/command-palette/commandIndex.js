/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import modeConfig, { MODES, IMPLEMENT_SHAPES } from '../mode/modeConfig';
import { buildVariantAttrs } from '../rail/shapeVariants';

// Intermediate events need an event-definition type to render; Message is the
// most common trigger, so the palette defaults to it. Users pick other triggers
// via the rail's Intermediate-event flyout.
const PALETTE_EVENT_DEFAULTS = {
  'bpmn:IntermediateCatchEvent': 'bpmn:MessageEventDefinition',
  'bpmn:IntermediateThrowEvent': 'bpmn:MessageEventDefinition'
};

/**
 * Command categories (rendered in this order in the palette).
 * Recents is synthesized from localStorage at render time.
 */
export const GROUPS = [
  { id: 'recents', label: 'Recents' },
  { id: 'shapes', label: 'Shapes' },
  { id: 'templates', label: 'Templates' },
  { id: 'actions', label: 'Actions' },
  { id: 'modes', label: 'Modes' },
  { id: 'copilot', label: 'Copilot' }
];

const RECENTS_KEY = 'camunda-modeler.left-rail.command-recents';
const RECENTS_MAX = 5;

/**
 * buildCommandIndex — flat array of commands the palette searches over.
 * Each entry: { id, label, keywords, group, hint?, run(ctx) }
 * run(ctx) is given { modeler, setMode, openAiPanel } so it can act without
 * pulling on BpmnEditor internals.
 */
export function buildCommandIndex({ modeler, mode, templates = [] }) {
  const commands = [];

  // --- Shapes (flattened IMPLEMENT_SHAPES so every shape is reachable via palette
  //     regardless of current mode; mode only affects the rail visual)
  IMPLEMENT_SHAPES.forEach(shapeType => {
    const label = shapeLabel(shapeType);
    commands.push({
      id: `shape:${shapeType}`,
      label: `Insert ${label}`,
      keywords: [ shapeType.replace('bpmn:', ''), label, 'shape', 'insert', 'add' ].join(' ').toLowerCase(),
      group: 'shapes',
      hint: '↵ place at center',
      run({ modeler: m }) {
        insertShapeAtCenter(m, shapeType);
      }
    });
  });

  // --- Templates (element templates — connectors, AI agents, etc.)
  templates.forEach(tpl => {
    const name = tpl.name || tpl.id;
    commands.push({
      id: `tpl:${tpl.id}`,
      label: `Insert template: ${name}`,
      keywords: [ name, tpl.id, 'template', 'connector' ].join(' ').toLowerCase(),
      group: 'templates',
      hint: '↵ place at center',
      run({ modeler: m }) {
        insertTemplateAtCenter(m, tpl);
      }
    });
  });

  // --- Modes
  MODES.forEach(targetMode => {
    const cfg = modeConfig[targetMode];
    const currentSuffix = targetMode === mode ? ' (current)' : '';
    commands.push({
      id: `mode:${targetMode}`,
      label: `Switch to ${cfg.label} mode${currentSuffix}`,
      keywords: [ targetMode, cfg.label, 'mode', 'switch' ].join(' ').toLowerCase(),
      group: 'modes',
      hint: `⌘${cfg.hotkey}`,
      disabled: targetMode === mode,
      run({ setMode }) {
        setMode(targetMode);
      }
    });
  });

  // --- Actions (common editor actions reachable by keyboard users)
  commands.push(
    {
      id: 'action:undo',
      label: 'Undo',
      keywords: 'undo revert back history',
      group: 'actions',
      hint: '⌘Z',
      run({ modeler: m }) {
        m.get('editorActions').trigger('undo');
      }
    },
    {
      id: 'action:redo',
      label: 'Redo',
      keywords: 'redo forward history',
      group: 'actions',
      hint: '⌘⇧Z',
      run({ modeler: m }) {
        m.get('editorActions').trigger('redo');
      }
    },
    {
      id: 'action:fit-viewport',
      label: 'Fit diagram to viewport',
      keywords: 'fit zoom reset viewport center',
      group: 'actions',
      hint: '',
      run({ modeler: m }) {
        m.get('canvas').zoom('fit-viewport');
      }
    },
    {
      id: 'action:select-all',
      label: 'Select all elements',
      keywords: 'select all',
      group: 'actions',
      hint: '⌘A',
      run({ modeler: m }) {
        m.get('editorActions').trigger('selectElements');
      }
    }
  );

  // --- Copilot
  commands.push({
    id: 'copilot:ask',
    label: 'Ask Copilot…',
    keywords: 'copilot ai assist generate draft',
    group: 'copilot',
    hint: '',
    run({ openAiPanel }) {
      openAiPanel && openAiPanel();
    }
  });

  return commands;
}

/**
 * Fuzzy scorer: character-subsequence match with word-boundary bonuses.
 * Returns a number — higher is better — or -Infinity if no match.
 */
export function scoreCommand(command, query) {
  if (!query) return 0;
  const q = query.toLowerCase().trim();
  const label = command.label.toLowerCase();
  const keywords = command.keywords || '';

  // Exact or prefix match on label wins big.
  if (label === q) return 1000;
  if (label.startsWith(q)) return 800;

  let score = 0;

  // Subsequence match on label.
  const labelScore = subsequenceScore(label, q);
  if (labelScore > 0) score += labelScore;

  // Lesser bonus from keywords subsequence.
  const kwScore = subsequenceScore(keywords, q);
  if (kwScore > 0) score += Math.floor(kwScore * 0.5);

  return score > 0 ? score : -Infinity;
}

function subsequenceScore(haystack, needle) {
  let h = 0, n = 0, score = 0, prevMatch = -2, wordStart = true;
  while (h < haystack.length && n < needle.length) {
    const hc = haystack[h];
    const nc = needle[n];
    if (hc === nc) {
      score += 10;
      if (h === prevMatch + 1) score += 4; // consecutive
      if (wordStart) score += 8; // word boundary
      prevMatch = h;
      n++;
    }
    wordStart = hc === ' ' || hc === '-' || hc === ':' || hc === '_';
    h++;
  }

  // All needle chars must match.
  if (n < needle.length) return 0;
  return score;
}

/**
 * Rank and group commands for a given query + current mode.
 */
export function rankCommands(commands, query, { mode, recentsIds = [] } = {}) {
  const scored = commands
    .map(c => ({ c, score: scoreCommand(c, query) }))
    .filter(({ score }) => score !== -Infinity);

  scored.sort((a, b) => b.score - a.score);

  // Pull recents to the top if no query.
  if (!query && recentsIds.length) {
    const recentsSet = new Set(recentsIds);
    const recents = [];
    const others = [];
    scored.forEach(({ c }) => {
      if (recentsSet.has(c.id)) recents.push(c);
      else others.push(c);
    });

    // Respect the stored order of recents.
    recents.sort((a, b) => recentsIds.indexOf(a.id) - recentsIds.indexOf(b.id));
    return { flat: [ ...recents.map(c => ({ ...c, group: 'recents' })), ...others ], recentsCount: recents.length };
  }

  return { flat: scored.map(s => s.c), recentsCount: 0 };
}

/**
 * Group a flat ranked list into { groupId: [commands] } keeping the order.
 */
export function groupCommands(flat) {
  const groups = {};
  GROUPS.forEach(g => { groups[g.id] = []; });
  flat.forEach(cmd => {
    if (!groups[cmd.group]) groups[cmd.group] = [];
    groups[cmd.group].push(cmd);
  });
  return groups;
}

// ------ Recents persistence (localStorage) ---------------------------------

export function loadRecents() {
  try {
    const raw = typeof localStorage !== 'undefined' && localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, RECENTS_MAX) : [];
  } catch (e) {
    return [];
  }
}

export function pushRecent(commandId) {
  try {
    if (typeof localStorage === 'undefined') return;
    const current = loadRecents().filter(id => id !== commandId);
    current.unshift(commandId);
    const trimmed = current.slice(0, RECENTS_MAX);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(trimmed));
  } catch (e) { /* ignore */ }
}

// ------ Helpers ------------------------------------------------------------

function shapeLabel(shapeType) {
  return shapeType
    .replace('bpmn:', '')
    .replace(/([A-Z])/g, ' $1')
    .trim();
}

function insertShapeAtCenter(modeler, shapeType) {
  const canvas = modeler.get('canvas');
  const elementFactory = modeler.get('elementFactory');
  const modeling = modeler.get('modeling');
  const selection = modeler.get('selection');

  // Shared with RailShapeFlyout — single source of truth for SubProcess
  // expansion, event-definition type, etc. See rail/shapeVariants.js.
  const attrs = buildVariantAttrs({
    type: shapeType,
    eventDefinitionType: PALETTE_EVENT_DEFAULTS[shapeType] || null
  });

  const root = canvas.getRootElement();
  const viewbox = canvas.viewbox();
  const position = {
    x: Math.round(viewbox.x + viewbox.width / 2),
    y: Math.round(viewbox.y + viewbox.height / 2)
  };

  const shape = elementFactory.createShape(attrs);
  const placed = modeling.createShape(shape, position, root);
  selection.select(placed);
}

function insertTemplateAtCenter(modeler, template) {
  const canvas = modeler.get('canvas');
  const modeling = modeler.get('modeling');
  const elementTemplates = modeler.get('elementTemplates', false);
  const selection = modeler.get('selection');
  if (!elementTemplates) return;

  const shape = elementTemplates.createElement(template);
  const root = canvas.getRootElement();
  const viewbox = canvas.viewbox();
  const position = {
    x: Math.round(viewbox.x + viewbox.width / 2),
    y: Math.round(viewbox.y + viewbox.height / 2)
  };
  const placed = modeling.createShape(shape, position, root);
  selection.select(placed);
}
