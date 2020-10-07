/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import DmnModeler from 'dmn-js/lib/Modeler';
import DrdViewer from './DrdViewer';

import diagramOriginModule from 'diagram-js-origin';

import alignToOriginModule from '@bpmn-io/align-to-origin';
import addExporter from '@bpmn-io/add-exporter/add-exporter';

import completeDirectEditingModule from '../../bpmn/modeler/features/complete-direct-editing';
import propertiesPanelModule from 'dmn-js-properties-panel';
import propertiesProviderModule from 'dmn-js-properties-panel/lib/provider/camunda';

import drdAdapterModule from 'dmn-js-properties-panel/lib/adapter/drd';

import propertiesPanelKeyboardBindingsModule from '../../bpmn/modeler/features/properties-panel-keyboard-bindings';
import decisionTableKeyboardModule from './features/decision-table-keyboard';

import Flags, { DISABLE_ADJUST_ORIGIN } from '../../../../util/Flags';

import camundaModdleDescriptor from 'camunda-dmn-moddle/resources/camunda';

import openDrgElementModule from './features/overview/open-drg-element';
import overviewRendererModule from './features/overview/overview-renderer';

import 'dmn-js/dist/assets/diagram-js.css';
import 'dmn-js/dist/assets/dmn-font/css/dmn-embedded.css';
import 'dmn-js/dist/assets/dmn-js-decision-table-controls.css';
import 'dmn-js/dist/assets/dmn-js-decision-table.css';
import 'dmn-js/dist/assets/dmn-js-drd.css';
import 'dmn-js/dist/assets/dmn-js-literal-expression.css';
import 'dmn-js/dist/assets/dmn-js-shared.css';

import 'dmn-js-properties-panel/dist/assets/dmn-js-properties-panel.css';

const NOOP_MODULE = [ 'value', null ];

const poweredByModule = {
  poweredBy: NOOP_MODULE
};

const OVERVIEW_ZOOM_SCALE = 0.66;

const LOW_PRIORITY = 500,
      HIGH_PRIORITY = 2500;


export default class CamundaDmnModeler extends DmnModeler {

  constructor(options = {}) {

    const {
      moddleExtensions,
      drd,
      decisionTable,
      literalExpression,
      exporter,
      overview,
      ...otherOptions
    } = options;

    super({
      ...otherOptions,
      drd: mergeModules(drd, [
        Flags.get(DISABLE_ADJUST_ORIGIN) ? diagramOriginModule : alignToOriginModule,
        propertiesPanelModule,
        propertiesProviderModule,
        drdAdapterModule,
        propertiesPanelKeyboardBindingsModule
      ]),
      decisionTable: mergeModules(decisionTable, [
        decisionTableKeyboardModule,
        poweredByModule,
        {
          viewDrd: NOOP_MODULE
        }
      ]),
      literalExpression: mergeModules(literalExpression, [
        poweredByModule,
        {
          viewDrd: NOOP_MODULE
        }
      ]),
      moddleExtensions: {
        camunda: camundaModdleDescriptor,
        ...(moddleExtensions || {})
      }
    });

    this.on('viewer.created', ({ viewer }) => {

      viewer.on('commandStack.changed', event => {
        this._emit('view.contentChanged', event);
      });

      viewer.on('selection.changed', event => {
        this._emit('view.selectionChanged', event);
      });

      viewer.on([ 'directEditing.activate', 'directEditing.deactivate' ], event => {
        this._emit('view.directEditingChanged', event);
      });

      viewer.on('error', ({ error }) => {
        this._emit('error', {
          viewer,
          error
        });
      });

      viewer.on('propertiesPanel.focusin', event => {
        this._emit('propertiesPanel.focusin', event);
      });

      viewer.on('propertiesPanel.focusout', event => {
        this._emit('propertiesPanel.focusout', event);
      });

    });

    addExporter(exporter, this);

    this._addOverview(overview);
  }

  /**
   * Get stack index of active viewer.
   *
   * @returns {?number} Stack index or null.
   */
  getStackIdx() {
    const viewer = this.getActiveViewer();

    if (!viewer) {
      return null;
    }

    const commandStack = viewer.get('commandStack', false);

    if (!commandStack) {
      return null;
    }

    return commandStack._stackIdx;
  }

  _addOverview(options = {}) {
    const { layout } = options;

    const overview = this._overview = new DrdViewer({
      drd: {
        additionalModules: [
          openDrgElementModule,
          overviewRendererModule
        ],
        openDrgElement: {
          layout
        }
      }
    });

    // (1) import overview initially
    this.on('import.parse.start', ({ xml }) => {
      overview.importXML(xml, this._handleOverviewImport);
    });

    // keep track of view type
    let previousActiveViewType;

    this.on('views.changed', LOW_PRIORITY, ({ activeView }) => {
      previousActiveViewType = activeView.type;
    });

    // (2) update overview on changes in modeler
    let offCommandStackChanged;

    this.on('views.changed', ({ activeView }) => {
      if (previousActiveViewType === activeView.type) {
        return;
      }

      // (2.1) remove previous listener
      if (offCommandStackChanged) {
        offCommandStackChanged();
      }

      const handleCommandStackChanged = () => {

        // (2.3) stop listening until save XML done
        offCommandStackChanged();

        // (2.4) start listening again when save XML done
        this.once('saveXML.done', onCommandStackChanged);

        this._updateOverview();
      };

      const viewer = this._viewers[ activeView.type ];

      const eventBus = viewer.get('eventBus', false);

      const onCommandStackChanged = () => {
        eventBus.on('commandStack.changed', handleCommandStackChanged);
      };

      offCommandStackChanged = () => {
        eventBus.off('commandStack.changed', handleCommandStackChanged);
      };

      // (2.2) add new listener
      onCommandStackChanged();
    });

    // (3) highlight current open DRG element on views changed
    this.on('views.changed', ({ activeView }) => {
      if (activeView.type !== 'drd') {
        const activeViewer = overview.getActiveViewer();

        if (activeViewer) {
          activeViewer.get('eventBus').fire('drgElementOpened', {
            id: activeView.element.id
          });
        }
      }
    });

    // (4) propagate layout changes
    this.on('overviewOpen', () => {
      const activeViewer = this._overview.getActiveViewer();

      if (activeViewer) {
        activeViewer.get('eventBus').fire('overviewOpen');
      }
    });

    overview.once('import.done', () => {
      const activeViewer = overview.getActiveViewer();

      // (5) open DRG element on click
      activeViewer.on('openDrgElement', ({ id }) => {
        const view = this.getViews().find(({ element }) => {
          return element.id === id;
        });

        if (view && view.type !== 'drd') {
          this.open(view);
        }
      });
    });
  }

  _updateOverview = () => {
    if (!this._overview) {
      return;
    }

    // Prevent others from hooking in when updating overview
    this.once('saveXML.start', HIGH_PRIORITY, () => false);

    this.saveXML((err, xml) => {
      if (err) {
        console.error(err);
      } else {
        this._overview.importXML(xml, this._handleOverviewImport);
      }
    });
  }

  _handleOverviewImport = err => {
    if (!this._overview || !this._overview.getActiveViewer()) {
      return;
    }

    if (err) {
      console.error(err);
    } else {
      this._overview.getActiveViewer().get('canvas').zoom(OVERVIEW_ZOOM_SCALE);
    }
  }

  attachOverviewTo = (parentNode) => {
    this.detachOverview();

    const activeViewer = this._overview.getActiveViewer();

    if (!activeViewer) {
      return;
    }

    this._emit('attachOverview');

    parentNode.appendChild(activeViewer._container);

    activeViewer.get('canvas').resized();
  }

  detachOverview = () => {
    const activeViewer = this._overview.getActiveViewer();

    if (!activeViewer) {
      return;
    }

    const container = activeViewer._container;

    if (container.parentNode) {
      this._emit('detachOverview');

      container.parentNode.removeChild(container);
    }
  }
}


// helpers ///////////////////////

function mergeModules(editorConfig = {}, additionalModules) {

  const editorModules = editorConfig.additionalModules || [];

  return {
    ...editorConfig,
    additionalModules: [
      completeDirectEditingModule,
      ...editorModules,
      ...additionalModules
    ]
  };
}
