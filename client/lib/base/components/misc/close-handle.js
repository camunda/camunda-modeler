'use strict';

var ensureOpts = require('util/ensure-opts');


function CloseHandle(options) {

  ensureOpts([ 'onClick' ], options);

  this.render = function() {

    var dirty = options.dirty;

    var className = 'close-handle';

    if (dirty) {
      className += ' dirty';
    }

    return (
      <span className={ className }
            onClick={ options.onClick }
            tabIndex="0"
            ref={ options.ref }></span>
    );
  };
}

module.exports = CloseHandle;
