/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { CamundaCloudModeler as DmnModeler } from 'camunda-dmn-js';
import DrdViewer from '../../dmn/modeler/DrdViewer';

import addExporter from '@bpmn-io/add-exporter/add-exporter';

import completeDirectEditingModule from '../../bpmn/modeler/features/complete-direct-editing';

import propertiesPanelKeyboardBindingsModule from '../../bpmn/modeler/features/properties-panel-keyboard-bindings';

import Flags, {
  DISABLE_ADJUST_ORIGIN,
  ENABLE_NEW_CONTEXT_PAD
} from '../../../../util/Flags';

import openDrgElementModule from '../../dmn/modeler/features/overview/open-drg-element';
import overviewRendererModule from '../../dmn/modeler/features/overview/overview-renderer';

import executionPlatformModule from '@camunda/execution-platform';
import modelerModdle from 'modeler-moddle/resources/dmn-modeler.json';

import { DmnImprovedCanvasModule } from '@camunda/improved-canvas';

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
      moddleExtensions = {},
      drd,
      decisionTable,
      literalExpression,
      exporter,
      overview,
      ...otherOptions
    } = options;

    let additionalModules = [];

    if (Flags.get(ENABLE_NEW_CONTEXT_PAD, false)) {
      additionalModules = [
        ...additionalModules,
        DmnImprovedCanvasModule
      ];
    }

    super({
      ...otherOptions,
      boxedExpression: mergeModules(otherOptions.boxedExpression, [
        poweredByModule,
        executionPlatformModule,
        {
          viewDrd: NOOP_MODULE
        }
      ]),
      drd: mergeModules({
        ...drd,
        disableAdjustOrigin: Flags.get(DISABLE_ADJUST_ORIGIN)
      }, [
        propertiesPanelKeyboardBindingsModule,
        executionPlatformModule,
        ...additionalModules
      ]),
      decisionTable: mergeModules(decisionTable, [
        poweredByModule,
        executionPlatformModule,
        {
          viewDrd: NOOP_MODULE
        }
      ]),
      literalExpression: mergeModules(literalExpression, [
        poweredByModule,
        executionPlatformModule,
        {
          viewDrd: NOOP_MODULE
        }
      ]),
      moddleExtensions: {
        ...moddleExtensions,
        modeler: modelerModdle
      },
      canvas: {
        autoFocus: true
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

  showOverview(xml) {
    return this._overview.importXML(xml).then(
      () => {}, err => err
    ).then(err => this._handleOverviewImport(err));
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
      this.showOverview(xml);
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

      if (!activeViewer) {
        return;
      }

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

    return this.saveXML().then(
      ({ xml }) => this.showOverview(xml)
    ).catch(err => {
      console.error(err);
    });
  };

  _handleOverviewImport = err => {
    if (!this._overview || !this._overview.getActiveViewer()) {
      return;
    }

    if (err) {
      console.error(err);
    } else {
      this._overview.getActiveViewer().get('canvas').zoom(OVERVIEW_ZOOM_SCALE);
    }
  };

  attachOverviewTo = (parentNode) => {
    this.detachOverview();

    const activeViewer = this._overview.getActiveViewer();

    if (!activeViewer) {
      return;
    }

    this._emit('attachOverview');

    this._overview.attachTo(parentNode);

    activeViewer.get('canvas').resized();
  };

  detachOverview = () => {
    const activeViewer = this._overview.getActiveViewer();

    if (!activeViewer) {
      return;
    }

    this._emit('detachOverview');

    this._overview.detach();
  };
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
