const fs = require('fs');
const path = require('path');

module.exports = function(context) {

  const {
    appOutDir
  } = context;

  const appInfo = context.packager.appInfo;

  const {
    buildVersion,
    buildNumber
  } = appInfo;

  fs.writeFileSync(
    path.join(appOutDir, 'VERSION'),
    `v${buildVersion} (build ${buildNumber || '0000' })`,
    'utf8'
  );
};