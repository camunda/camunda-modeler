import CmmnModeler from 'cmmn-js/lib/Modeler';

import diagramOriginModule from 'diagram-js-origin';

import addExporterModule from '@bpmn-io/add-exporter';

import camundaModdlePackage from 'camunda-cmmn-moddle/resources/camunda';

import propertiesPanelModule from 'cmmn-js-properties-panel';
import propertiesProviderModule from 'cmmn-js-properties-panel/lib/provider/camunda';
import propertiesPanelKeyboardBindingsModule from '../../bpmn/modeler/features/properties-panel-keyboard-bindings';


import 'cmmn-js-properties-panel/styles/properties.less';

import 'cmmn-js/dist/assets/diagram-js.css';
import 'cmmn-js/dist/assets/cmmn-font/css/cmmn-embedded.css';


export default class CamundaCmmnModeler extends CmmnModeler {

  constructor(options = {}) {

    const {
      moddleExtensions,
      ...otherOptions
    } = options;

    super({
      ...otherOptions,
      moddleExtensions: {
        camunda: camundaModdlePackage,
        ...(moddleExtensions || {})
      }
    });
  }
}

const defaultModules = CmmnModeler.prototype._modules;

const extensionModules = [
  diagramOriginModule,
  addExporterModule,
  propertiesPanelModule,
  propertiesProviderModule,
  propertiesPanelKeyboardBindingsModule
];

CamundaCmmnModeler.prototype._modules = [
  ...defaultModules,
  ...extensionModules
];