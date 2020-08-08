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