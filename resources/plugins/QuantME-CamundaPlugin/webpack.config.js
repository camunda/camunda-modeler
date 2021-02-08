/**
 * Copyright (c) 2021 Institute of Architecture of Application Systems -
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
  mode: 'production',
  entry: './client/client.js',
  output: {
    path: path.resolve(__dirname, 'client'),
    filename: 'client.bundle.js'
  }
  ,
  devtool:'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  },
  target: 'node'
};
