/**
 * Root babel config for @electron-forge/plugin-webpack.
 * Babel package-relative configs (.babelrc) in client/ don't apply when webpack
 * runs from the repo root. This file sets the same presets so JSX/modern JS compiles.
 */
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { electron: '34' } }],
    '@babel/preset-react',
  ],
};
