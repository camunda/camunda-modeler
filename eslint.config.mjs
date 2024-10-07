import { merge } from 'min-dash';

import globals from 'globals';

import bpmnIoPlugin from 'eslint-plugin-bpmn-io';
import camundaLicensedPlugin from 'eslint-plugin-camunda-licensed';

export default [
  ...camundaLicensedPlugin.configs.mit.map((config) => {
    return {
      ...config,
      files: [
        'app/lib/**/*.js',
        'client/src/**/*.js'
      ]
    }
  }),
  ...bpmnIoPlugin.configs.node.map((config) => {
    return merge({
      ...config,
      files: [
        'app/lib/**/*.js',
        'resources/**/*.js',
        'tasks/**/*.js'
      ]
    }, {
      languageOptions: {
        globals: {
          ...globals.chai,
          ...globals.mocha
        }
      }
    })
  }),
  ...bpmnIoPlugin.configs.mocha.map((config) => {
    return {
      ...config,
      files: [
        '**/__tests__/**/*.js',
        'test/**/*.js'
      ]
    };
  }),
  ...bpmnIoPlugin.configs.browser.map((config) => {
    return merge({
      ...config,
      files: [
        'client/src/**/*.js',
        'resources/plugins/**/*.js'
      ]
    }, {
      languageOptions: {
        globals: {
          ...globals.chai,
          ...globals.mocha,
          ...globals.node
        }
      }
    });
  }),
  ...bpmnIoPlugin.configs.jsx.map((config) => {
    return merge({
      ...config,
      files: [
        'client/src/**/*.js',
        'resources/plugins/**/*.js'
      ]
    }, {
      rules: {
        'react/jsx-uses-react': 'error',
        'react/react-in-jsx-scope': 'error'
      }
    });
  }),
  {
    ignores: [
      '**/dist',
      '**/node_modules',
      'app/public',
      'app/preload',
      'client/build',
      'coverage',
      'docs',
      'tmp'
    ]
  }
];