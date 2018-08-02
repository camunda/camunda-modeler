'use strict';

var CloseHandle = require('base/components/misc/close-handle');

var ensureOpts = require('util/ensure-opts');


function WarningsOverlay(options) {

  ensureOpts([ 'onOpenLog', 'onClose' ], options);

  if (!(this instanceof WarningsOverlay)) {
    return new WarningsOverlay(options);
  }

  this.render = function() {

    var warnings = options.warnings;

    // don't return anything if there are no warnings
    if (!warnings || !warnings.length) {
      return;
    }

    var html = (
      <div className="warnings-overlay warnings" ref="warnings-overlay">
        <div className="alert">
          Imported with { warningsStr(warnings) }.&nbsp;

          <div className="warnings-show" onClick={ options.onOpenLog } ref="warnings-details-link">Open Log</div>

          <CloseHandle onClick={ options.onClose } ref="warnings-hide-link" />
        </div>
      </div>);

    return html;
  };
}

module.exports = WarningsOverlay;


function warningsStr(warnings) {
  var count = warnings.length;

  return count + ' warning' + (count !== 1 ? 's' : '');
}
