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
    };
  }),
  ...bpmnIoPlugin.configs.node.map((config) => {
    return {
      ...config,
      files: [
        'app/lib/**/*.js',
        'resources/**/*.js',
        'tasks/**/*.js',
        '*.js',
        '*.mjs'
      ]
    };
  }),
  ...bpmnIoPlugin.configs.mocha.map((config) => {
    return {
      ...config,
      files: [
        '**/__tests__/**/*.js',
        'test/**/*.js'
      ],
      rules: {
        'no-mocha-arrows': 'off'
      }
    };
  }),
  ...bpmnIoPlugin.configs.browser.map((config) => {
    return {
      ...config,
      files: [
        'client/src/**/*.js',
        'resources/plugins/**/*.js'
      ]
    };
  }),
  ...bpmnIoPlugin.configs.jsx.map((config) => {
    return {
      ...config,
      files: [
        'client/src/**/*.js',
        'resources/plugins/**/*.js'
      ]
    };
  }),
  {
    files: [
      'client/**/*.js'
    ],
    languageOptions: {
      globals: {
        process: 'readonly'
      }
    }
  },
  {
    files: [
      '**/__tests__/**/*.js'
    ],
    languageOptions: {
      globals: {
        require: 'readonly'
      }
    }
  },
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