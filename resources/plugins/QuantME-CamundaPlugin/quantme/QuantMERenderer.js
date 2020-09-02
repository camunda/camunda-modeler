/**
 * Copyright (c) 2020 Institute for the Architecture of Application System -
 * University of Stuttgart
 *
 * This program and the accompanying materials are made available under the
 * terms the Apache Software License 2.0
 * which is available at https://www.apache.org/licenses/LICENSE-2.0.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import BpmnRenderer from 'bpmn-js/lib/draw/BpmnRenderer';
import * as quantmeReplaceOptions from './QuantMEReplaceOptions';
import { append as svgAppend, attr as svgAttr, create as svgCreate } from 'tiny-svg';
import { getFillColor, getStrokeColor } from 'bpmn-js/lib/draw/BpmnRenderUtil';

/**
 * This class extends the default BPMNRenderer to render the newly introduced QuantME task types
 */
export default class QuantMERenderer extends BpmnRenderer {
  constructor(config, eventBus, styles, pathMap, quantMEPathMap, canvas, textRenderer) {
    super(config, eventBus, styles, pathMap, canvas, textRenderer, 1001);

    var computeStyle = styles.computeStyle;

    var defaultFillColor = config && config.defaultFillColor,
        defaultStrokeColor = config && config.defaultStrokeColor;

    function drawPath(parentGfx, d, attrs) {

      attrs = computeStyle(attrs, [ 'no-fill' ], {
        strokeWidth: 2,
        stroke: 'black'
      });

      const path = svgCreate('path');
      svgAttr(path, { d: d });
      svgAttr(path, attrs);

      svgAppend(parentGfx, path);

      return path;
    }

    this.quantMeHandlers = {
      'quantme:QuantumComputationTask': function(self, parentGfx, element) {
        var task = self.renderer('bpmn:Task')(parentGfx, element);

        var pathData = quantMEPathMap.getPath('TASK_TYPE_QUANTUM_COMPUTATION');

        drawPath(parentGfx, pathData, {
          transform:'scale(0.3)',
          strokeWidth: 2.5,
          fill: getFillColor(element, defaultFillColor),
          stroke: getStrokeColor(element, defaultStrokeColor)
        });

        return task;
      },
      'quantme:QuantumCircuitLoadingTask': function(self, parentGfx, element) {
        var task = self.renderer('bpmn:Task')(parentGfx, element);

        // create circuit paths without filled shapes
        var pathData = quantMEPathMap.getPath('TASK_TYPE_CIRCUIT_LOADING');
        drawPath(parentGfx, pathData, {
          transform:'scale(0.3)',
          strokeWidth: 2.5,
          fill: getFillColor(element, defaultStrokeColor),
          stroke: getStrokeColor(element, defaultStrokeColor)
        });

        // create circuit paths with filled shapes
        pathData = quantMEPathMap.getPath('TASK_TYPE_CIRCUIT_LOADING_FILL');
        drawPath(parentGfx, pathData, {
          transform:'scale(0.3)',
          strokeWidth: 2.5,
          fill: getFillColor(element, '#000000'),
          stroke: getStrokeColor(element, defaultStrokeColor)
        });

        return task;
      },
      'quantme:DataPreparationTask': function(self, parentGfx, element) {
        var task = self.renderer('bpmn:Task')(parentGfx, element);

        var pathData = quantMEPathMap.getPath('TASK_TYPE_DATA_PREPARATION');
        drawPath(parentGfx, pathData, {
          transform:'scale(0.3)',
          strokeWidth: 2.5,
          fill: getFillColor(element, defaultFillColor),
          stroke: getStrokeColor(element, defaultStrokeColor)
        });

        // create circuit paths with filled shapes (black)
        pathData = quantMEPathMap.getPath('TASK_TYPE_DATA_PREPARATION_FILL_BLACK');
        drawPath(parentGfx, pathData, {
          transform:'scale(0.3)',
          strokeWidth: 2.5,
          fill: getFillColor(element, '#000000'),
          stroke: getStrokeColor(element, defaultStrokeColor)
        });

        // create circuit paths with filled shapes (background color)
        pathData = quantMEPathMap.getPath('TASK_TYPE_DATA_PREPARATION_FILL_BACKGROUND');
        drawPath(parentGfx, pathData, {
          transform:'scale(0.3)',
          strokeWidth: 2.5,
          fill: getFillColor(element, defaultStrokeColor),
          stroke: getStrokeColor(element, defaultStrokeColor)
        });

        // create circuit paths with dashed shapes
        pathData = quantMEPathMap.getPath('TASK_TYPE_DATA_PREPARATION_DASHED');
        drawPath(parentGfx, pathData, {
          transform:'scale(0.3)',
          strokeWidth: 2.5,
          strokeDasharray: 5,
          stroke: getStrokeColor(element, defaultStrokeColor)
        });

        // create white line for database
        pathData = quantMEPathMap.getPath('TASK_TYPE_DATA_PREPARATION_BACKGROUND');
        drawPath(parentGfx, pathData, {
          transform:'scale(0.3)',
          strokeWidth: 2.5,
          stroke: getFillColor(element, '#FFFFFF')
        });

        return task;
      },
      'quantme:OracleExpansionTask': function(self, parentGfx, element) {
        var task = self.renderer('bpmn:Task')(parentGfx, element);

        var pathData = quantMEPathMap.getPath('TASK_TYPE_ORACLE_EXPANSION');
        drawPath(parentGfx, pathData, {
          transform:'scale(0.3)',
          strokeWidth: 2.5,
          fill: getFillColor(element, defaultFillColor),
          stroke: getStrokeColor(element, defaultStrokeColor)
        });

        // create circuit paths with filled shapes
        pathData = quantMEPathMap.getPath('TASK_TYPE_ORACLE_EXPANSION_FILL_BLACK');
        drawPath(parentGfx, pathData, {
          transform:'scale(0.3)',
          strokeWidth: 2.5,
          fill: getFillColor(element, '#000000'),
          stroke: getStrokeColor(element, defaultStrokeColor)
        });

        // create oracle box
        pathData = quantMEPathMap.getPath('TASK_TYPE_ORACLE_EXPANSION_BOX');
        drawPath(parentGfx, pathData, {
          transform:'scale(0.3)',
          strokeWidth: 2.5,
          fill: getFillColor(element, '#000000'),
          stroke: getStrokeColor(element, '#FFF')
        });

        // create arrow
        pathData = quantMEPathMap.getPath('TASK_TYPE_ORACLE_EXPANSION_ARROW');
        drawPath(parentGfx, pathData, {
          transform:'scale(0.3)',
          strokeWidth: 2.5,
          fill: getFillColor(element, '#000000'),
          stroke: getStrokeColor(element, defaultStrokeColor)
        });

        return task;
      },
      'quantme:QuantumCircuitExecutionTask': function(self, parentGfx, element) {
        var task = self.renderer('bpmn:Task')(parentGfx, element);

        var pathData = quantMEPathMap.getPath('TASK_TYPE_CIRCUIT_EXECUTION');
        drawPath(parentGfx, pathData, {
          transform:'scale(0.3)',
          strokeWidth: 2.5,
          fill: getFillColor(element, defaultFillColor),
          stroke: getStrokeColor(element, defaultStrokeColor)
        });

        pathData = quantMEPathMap.getPath('TASK_TYPE_CIRCUIT_EXECUTION_FILL');
        drawPath(parentGfx, pathData, {
          transform:'scale(0.3)',
          strokeWidth: 2.5,
          fill: getFillColor(element, '#000000'),
          stroke: getStrokeColor(element, defaultStrokeColor)
        });

        return task;
      },
      'quantme:ReadoutErrorMitigationTask': function(self, parentGfx, element) {
        var task = self.renderer('bpmn:Task')(parentGfx, element);

        var pathData = quantMEPathMap.getPath('TASK_TYPE_ERROR_MITIGATION');

        drawPath(parentGfx, pathData, {
          transform:'scale(0.3)',
          strokeWidth: 0.5,
          fill: getFillColor(element, '#000000'),
          stroke: getStrokeColor(element, defaultStrokeColor)
        });

        return task;
      }
    };
  }

  renderer(type) {
    return this.handlers[type];
  }

  canRender(element) {

    // default elements can be handled
    if (super.canRender(element)) {
      return true;
    }

    // QuantME elements can be handled
    for (var i = 0; i < quantmeReplaceOptions.TASK.length; i++) {
      if (element.type === quantmeReplaceOptions.TASK[i].target.type) {
        return true;
      }
    }

    console.log('Unable to render element of type: ' + element.type);
    return false;
  }

  drawShape(parentNode, element) {

    // handle QuantME elements
    if (element.type in this.quantMeHandlers) {
      var h = this.quantMeHandlers[element.type];

      /* jshint -W040 */
      return h(this, parentNode, element);
    }

    // use parent class for all non QuantME elements
    return super.drawShape(parentNode, element);
  }
}

QuantMERenderer.$inject = [
  'config',
  'eventBus',
  'styles',
  'pathMap',
  'quantMEPathMap',
  'canvas',
  'textRenderer'
];
