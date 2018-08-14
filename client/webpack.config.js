'use strict';

const NODE_ENV = process.env.NODE_ENV;
const DEV = NODE_ENV !== 'production';

const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');


module.exports = {
  mode: NODE_ENV,
  entry: {
    bundle: ['./src/index.js']
  },
  output: {
    path: __dirname + '/build',
    filename: '[name].js',
    chunkFilename: '[name].[id].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      // apply loaders, falling back to file-loader, if non matches
      {
        oneOf: [
          {
            test: /\.css$/,
            use: [
              'style-loader',
              'css-loader'
            ]
          },
          {
            test: /\.less$/,
            use: [
              'style-loader',
              'css-loader',
              'less-loader'
            ]
          },
          {
            // exclude files served otherwise
            exclude: [/\.(js|jsx|mjs)$/, /\.html$/, /\.json$/],
            loader: 'file-loader',
            options: {
              name: 'static/media/[name].[hash:8].[ext]',
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new CaseSensitivePathsPlugin(),
    new CopyWebpackPlugin([
      { from: './public' }
    ])
  ],
  // ship source map during development only
  devtool: DEV && 'cheap-module-source-map',
  // don't bundle shims for node globals
  node: {
    dgram: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty',
  }
};