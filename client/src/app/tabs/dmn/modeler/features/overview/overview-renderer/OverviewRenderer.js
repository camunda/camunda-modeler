/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import inherits from 'inherits';

import {
  isArray,
  isObject,
  assign
} from 'min-dash';

import {
  attr as domAttr,
  query as domQuery
} from 'min-dom';

import {
  append as svgAppend,
  attr as svgAttr,
  create as svgCreate
} from 'tiny-svg';

import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';

import {
  createLine
} from 'diagram-js/lib/util/RenderUtil';

import {
  is,
  getName
} from 'dmn-js-shared/lib/util/ModelUtil';

const DEFAULT_FILL_COLOR = '#fafafa',
      DEFAULT_STROKE_COLOR = '#666',
      DECISION_STROKE_COLOR = '#000';


export default function DrdRenderer(eventBus, pathMap, styles, textRenderer) {

  BaseRenderer.call(this, eventBus);

  var markers = {};

  function addMarker(id, element) {
    markers[id] = element;
  }

  function marker(id) {
    var marker = markers[id];

    return 'url(#' + marker.id + ')';
  }

  function initMarkers(svg) {

    function createMarker(id, options) {
      var attrs = assign({
        strokeWidth: 1,
        strokeLinecap: 'round',
        strokeDasharray: 'none',
        fill: DEFAULT_STROKE_COLOR
      }, options.attrs);

      var ref = options.ref || { x: 0, y: 0 };

      var scale = options.scale || 1;

      // fix for safari / chrome / firefox bug not correctly
      // resetting stroke dash array
      if (attrs.strokeDasharray === 'none') {
        attrs.strokeDasharray = [10000, 1];
      }

      var marker = svgCreate('marker');

      svgAttr(options.element, attrs);

      svgAppend(marker, options.element);

      svgAttr(marker, {
        id: id,
        viewBox: '0 0 20 20',
        refX: ref.x,
        refY: ref.y,
        markerWidth: 20 * scale,
        markerHeight: 20 * scale,
        orient: 'auto'
      });

      var defs = domQuery('defs', svg);

      if (!defs) {
        defs = svgCreate('defs');

        svgAppend(svg, defs);
      }

      svgAppend(defs, marker);

      return addMarker(id, marker);
    }

    var associationStart = svgCreate('path');
    svgAttr(associationStart, { d: 'M 11 5 L 1 10 L 11 15' });

    createMarker('association-start', {
      element: associationStart,
      attrs: {
        fill: 'none',
        stroke: DEFAULT_STROKE_COLOR,
        strokeWidth: 1.5
      },
      ref: { x: 1, y: 10 },
      scale: 0.5
    });

    var associationEnd = svgCreate('path');
    svgAttr(associationEnd, { d: 'M 1 5 L 11 10 L 1 15' });

    createMarker('association-end', {
      element: associationEnd,
      attrs: {
        fill: 'none',
        stroke: DEFAULT_STROKE_COLOR,
        strokeWidth: 1.5
      },
      ref: { x: 12, y: 10 },
      scale: 0.5
    });

    var informationRequirementEnd = svgCreate('path');
    svgAttr(informationRequirementEnd, { d: 'M 1 5 L 11 10 L 1 15 Z' });

    createMarker('information-requirement-end', {
      element: informationRequirementEnd,
      ref: { x: 11, y: 10 },
      scale: 1
    });

    var knowledgeRequirementEnd = svgCreate('path');
    svgAttr(knowledgeRequirementEnd, { d: 'M 1 3 L 11 10 L 1 17' });

    createMarker('knowledge-requirement-end', {
      element: knowledgeRequirementEnd,
      attrs: {
        fill: 'none',
        stroke: DEFAULT_STROKE_COLOR,
        strokeWidth: 2
      },
      ref: { x: 11, y: 10 },
      scale: 0.8
    });

    var authorityRequirementEnd = svgCreate('circle');
    svgAttr(authorityRequirementEnd, { cx: 3, cy: 3, r: 3 });

    createMarker('authority-requirement-end', {
      element: authorityRequirementEnd,
      ref: { x: 3, y: 3 },
      scale: 0.9
    });
  }

  function computeStyle(custom, traits, defaultStyles) {
    if (!isArray(traits)) {
      defaultStyles = traits;
      traits = [];
    }

    return styles.style(traits || [], assign(defaultStyles, custom || {}));
  }


  function drawRect(p, width, height, r, offset, attrs) {

    if (isObject(offset)) {
      attrs = offset;
      offset = 0;
    }

    offset = offset || 0;

    attrs = computeStyle(attrs, {
      stroke: DEFAULT_STROKE_COLOR,
      strokeWidth: 2,
      fill: DEFAULT_FILL_COLOR
    });

    var rect = svgCreate('rect');
    svgAttr(rect, {
      x: offset,
      y: offset,
      width: width - offset * 2,
      height: height - offset * 2,
      rx: r,
      ry: r
    });
    svgAttr(rect, attrs);

    svgAppend(p, rect);

    return rect;
  }

  function renderLabel(p, label, options) {
    var text = textRenderer.createText(label || '', assign({ style: { fill: DEFAULT_STROKE_COLOR } }, options || {}));

    domAttr(text, 'class', 'djs-label');

    svgAppend(p, text);

    return text;
  }

  function renderEmbeddedLabel(p, element, options) {
    var name = getName(element);
    return renderLabel(p, name, assign({ box: element, padding: 5 }, options || {}));
  }

  function drawPath(p, d, attrs) {

    attrs = computeStyle(attrs, [ 'no-fill' ], {
      strokeWidth: 2,
      stroke: DEFAULT_STROKE_COLOR
    });

    var path = svgCreate('path');
    svgAttr(path, { d: d });
    svgAttr(path, attrs);

    svgAppend(p, path);

    return path;
  }


  var handlers = {
    'dmn:Decision': function(p, element, attrs) {
      attrs = attrs || {};

      const { businessObject } = element;

      const { decisionLogic } = businessObject;

      if (decisionLogic) {
        attrs.stroke = DECISION_STROKE_COLOR;
      }

      var rect = drawRect(p, element.width, element.height, 0, attrs);

      renderEmbeddedLabel(p, element, { align: 'center-middle', style: { fill: attrs.stroke } });

      return rect;
    },
    'dmn:KnowledgeSource': function(p, element, attrs) {

      var pathData = pathMap.getScaledPath('KNOWLEDGE_SOURCE', {
        xScaleFactor: 1.021,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: 0.0,
          my: 0.075
        }
      });

      var knowledgeSource = drawPath(p, pathData, {
        strokeWidth: 2,
        fill: DEFAULT_FILL_COLOR,
        stroke: DEFAULT_STROKE_COLOR
      });

      renderEmbeddedLabel(p, element, { align: 'center-middle' });

      return knowledgeSource;
    },
    'dmn:BusinessKnowledgeModel': function(p, element, attrs) {

      var pathData = pathMap.getScaledPath('BUSINESS_KNOWLEDGE_MODEL', {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: 0.0,
          my: 0.3
        }
      });

      var businessKnowledge = drawPath(p, pathData, {
        strokeWidth: 2,
        fill: DEFAULT_FILL_COLOR,
        stroke: DEFAULT_STROKE_COLOR
      });

      renderEmbeddedLabel(p, element, { align: 'center-middle' });

      return businessKnowledge;
    },
    'dmn:InputData': function(p, element, attrs) {

      var rect = drawRect(p, element.width, element.height, 22, attrs);

      renderEmbeddedLabel(p, element, { align: 'center-middle' });

      return rect;
    },
    'dmn:TextAnnotation': function(p, element, attrs) {
      var style = {
        'fill': 'none',
        'stroke': 'none'
      };

      var textElement = drawRect(p, element.width, element.height, 0, 0, style);

      var textPathData = pathMap.getScaledPath('TEXT_ANNOTATION', {
        xScaleFactor: 1,
        yScaleFactor: 1,
        containerWidth: element.width,
        containerHeight: element.height,
        position: {
          mx: 0.0,
          my: 0.0
        }
      });

      drawPath(p, textPathData);

      var text = getSemantic(element).text || '';

      renderLabel(p, text, {
        box: element,
        align: 'left-top',
        padding: 5
      });

      return textElement;
    },
    'dmn:Association': function(p, element, attrs) {
      var semantic = getSemantic(element);

      attrs = assign({
        strokeDasharray: '0.5, 5',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        fill: 'none'
      }, attrs || {});

      if (semantic.associationDirection === 'One' ||
          semantic.associationDirection === 'Both') {
        attrs.markerEnd = marker('association-end');
      }

      if (semantic.associationDirection === 'Both') {
        attrs.markerStart = marker('association-start');
      }

      return drawLine(p, element.waypoints, attrs);
    },
    'dmn:InformationRequirement': function(p, element, attrs) {

      attrs = assign({
        strokeWidth: 1,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        markerEnd: marker('information-requirement-end')
      }, attrs || {});

      return drawLine(p, element.waypoints, attrs);
    },
    'dmn:KnowledgeRequirement': function(p, element, attrs) {

      attrs = assign({
        strokeWidth: 1,
        strokeDasharray: 5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        markerEnd: marker('knowledge-requirement-end')
      }, attrs || {});

      return drawLine(p, element.waypoints, attrs);
    },
    'dmn:AuthorityRequirement': function(p, element, attrs) {

      attrs = assign({
        strokeWidth: 1.5,
        strokeDasharray: 5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        markerEnd: marker('authority-requirement-end')
      }, attrs || {});

      return drawLine(p, element.waypoints, attrs);
    }
  };


  // draw shape and connection //////////////////

  function drawShape(parent, element) {
    var h = handlers[element.type];

    if (!h) {
      return BaseRenderer.prototype.drawShape.apply(this, [ parent, element ]);
    } else {
      return h(parent, element);
    }
  }

  function drawConnection(parent, element) {
    var type = element.type;
    var h = handlers[type];

    if (!h) {
      return BaseRenderer.prototype.drawConnection.apply(this, [ parent, element ]);
    } else {
      return h(parent, element);
    }
  }

  function drawLine(p, waypoints, attrs) {
    attrs = computeStyle(attrs, [ 'no-fill' ], {
      stroke: DEFAULT_STROKE_COLOR,
      strokeWidth: 2,
      fill: 'none'
    });

    var line = createLine(waypoints, attrs);

    svgAppend(p, line);

    return line;
  }

  this.canRender = function(element) {
    return is(element, 'dmn:DMNElement') ||
           is(element, 'dmn:InformationRequirement') ||
           is(element, 'dmn:KnowledgeRequirement') ||
           is(element, 'dmn:AuthorityRequirement');
  };

  this.drawShape = drawShape;
  this.drawConnection = drawConnection;


  // hook onto canvas init event to initialize
  // connection start/end markers on svg
  eventBus.on('canvas.init', function(event) {
    initMarkers(event.svg);
  });

}

inherits(DrdRenderer, BaseRenderer);

DrdRenderer.$inject = [
  'eventBus',
  'pathMap',
  'styles',
  'textRenderer'
];


// helper functions //////////////////////

function getSemantic(element) {
  return element.businessObject;
}
