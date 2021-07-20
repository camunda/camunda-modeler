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

const path = require('path');

module.exports = {
  plugins: [
    'license-header'
  ],
  overrides: [
    { // camunda licence for source files
      files: ['app/**', 'client/**'],
      rules: {
        'license-header/header': [2, path.join(__dirname, './camunda-header.js') ]
      }
    },
    { // iaas licence for our plugins
      files: ['resources/plugins/**', 'app/lib/api/**', 'app/lib/quantme/**', 'app/lib/deployment/**', 'app/lib/framework-config/**', 'client/src/app/quantme/**'],
      rules: {
        'license-header/header': [2, path.join(__dirname, './iaas-header.js') ]
      }
    },
    { // no licence for plugin from existing Github repository
      files: ['resources/plugins/Linter-plugin/**'],
      rules: {
        'license-header/header': 'off'
      }
    }
  ]
};
