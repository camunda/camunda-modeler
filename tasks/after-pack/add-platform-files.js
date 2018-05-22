const { copySync } = require('cpx');

module.exports = function(context) {

  const {
    appOutDir,
    electronPlatformName
  } = context;

  copySync('resources/platform/base/**', appOutDir);
  copySync(`resources/platform/${electronPlatformName}/**`, appOutDir);
};