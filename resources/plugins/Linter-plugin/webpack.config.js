const path = require('path');

module.exports = {
  mode: 'development',
  entry: './client/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'client.js'
  },
  module: {
    rules: [
      {
        test: /\.bpmnlintrc$/i,
        use: 'bpmnlint-loader',
      }
    ]
  },
  devtool: 'cheap-module-source-map'
};