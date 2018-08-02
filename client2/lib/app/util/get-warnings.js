'use strict';

function getWarnings(lastImport) {
  var warnings = lastImport && lastImport.warnings;

  return warnings && warnings.length ? warnings : null;
}

module.exports = getWarnings;
