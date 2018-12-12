import BpmnModeler from 'bpmn-js/lib/Modeler';

import diagramOriginModule from 'diagram-js-origin';
import minimapModule from 'diagram-js-minimap';

import executableFixModule from './features/executable-fix';
import globalClipboardModule from './features/global-clipboard';
import applyDefaultTemplates from './features/apply-default-templates';

import signavioCompatModule from 'bpmn-js-signavio-compat';

import camundaModdlePackage from 'camunda-bpmn-moddle/resources/camunda';
import camundaModdleExtension from 'camunda-bpmn-moddle/lib';

import propertiesPanelModule from 'bpmn-js-properties-panel';
import propertiesProviderModule from 'bpmn-js-properties-panel/lib/provider/camunda';


import 'bpmn-js-properties-panel/styles/properties.less';

import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';

import 'diagram-js-minimap/assets/diagram-js-minimap.css';


export default class CamundaBpmnModeler extends BpmnModeler {

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

const defaultModules = BpmnModeler.prototype._modules;

const extensionModules = [
  diagramOriginModule,
  minimapModule,
  executableFixModule,
  globalClipboardModule,
  signavioCompatModule,
  camundaModdleExtension,
  propertiesPanelModule,
  propertiesProviderModule,
  applyDefaultTemplates
];

CamundaBpmnModeler.prototype._modules = [
  ...defaultModules,
  ...extensionModules
];