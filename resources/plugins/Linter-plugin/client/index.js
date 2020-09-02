import {
  registerClientPlugin
} from 'camunda-modeler-plugin-helpers';

import lintingModule from 'bpmn-js-bpmnlint';

import defaultConfig from '../.bpmnlintrc';

const persistLintingStateModule = {
  __init__: [
    [ 'eventBus', function(eventBus) {

      eventBus.on('linting.toggle', function(event) {
        const {
          active
        } = event;

        setLintingActive(active);
      });

    } ]
  ]
};

registerClientPlugin(config => {

  const {
    additionalModules,
    ...rest
  } = config;

  return {
    ...rest,
    additionalModules: [
      ...(additionalModules || []),
      lintingModule,
      persistLintingStateModule
    ],
    linting: {
      bpmnlint: defaultConfig,
      active: getLintingActive()
    }
  };
}, 'bpmn.modeler.configure');


// helpers ///////////////

const LINTING_STATE_KEY = 'camunda-modeler-linter-plugin.active';

function getLintingActive() {
  // eslint-disable-next-line no-undef
  const str = window.localStorage.getItem(LINTING_STATE_KEY);

  return str && JSON.parse(str) || false;
}

function setLintingActive(active) {
  // eslint-disable-next-line no-undef
  window.localStorage.setItem(LINTING_STATE_KEY, JSON.stringify(active));
}
