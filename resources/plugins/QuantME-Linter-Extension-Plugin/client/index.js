import {
  registerBpmnJSPlugin
} from 'camunda-modeler-plugin-helpers';

import customLinterConfig from '../.bpmnlintrc';

registerBpmnJSPlugin({
  __init__: [
    function(linting) {
      linting.setLinterConfig(customLinterConfig);
    }
  ]
});