import bpmnIoPlugin from 'eslint-plugin-bpmn-io';
import camundaLicensedPlugin from 'eslint-plugin-camunda-licensed';

const files = {
  client: [
    'client/src/**/*.js',
    'client/test/**/*.js',
    'resources/plugins/*/client/**/*.js'
  ],
  sources: [
    'app/*.js',
    'app/lib/**/*.js',
    'client/src/**/*.js'
  ],
  tests: [
    '**/test/**/*.js',
    '**/__tests__/**/*.js'
  ],
  ignored: [
    'app/preload',
    'app/public',
    'client/build',
    'coverage',
    'dist',
    'docs',
    'resources/plugins/*/dist',
    'resources/plugins/test-script-error/broken.js',
    'tmp'
  ]
};

export default [
  {
    ignores: files.ignored
  },

  // license header
  ...camundaLicensedPlugin.configs.mit.map((config) => {
    return {
      ...config,
      files: files.sources
    };
  }),

  // build + app
  ...bpmnIoPlugin.configs.node.map((config) => {
    return {
      ...config,
      ignores: files.client
    };
  }),

  // client
  ...bpmnIoPlugin.configs.browser.map((config) => {
    return {
      ...config,
      files: files.client
    };
  }),
  ...bpmnIoPlugin.configs.jsx.map((config) => {
    return {
      ...config,
      files: files.client
    };
  }),
  {
    languageOptions: {
      globals: {
        process: 'readonly'
      }
    },
    settings: {
      react: { version: '16.14.0' }
    },
    files: files.client
  },

  // test
  ...bpmnIoPlugin.configs.mocha.map((config) => {
    return {
      ...config,
      files: files.tests
    };
  }),
  {
    languageOptions: {
      globals: {
        require: 'readonly'
      }
    },
    files: files.tests
  }
];
