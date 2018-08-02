'use strict';

var ensureOpts = require('util/ensure-opts');

var Log = require('./log');


function Footer(options) {

  ensureOpts([ 'log', 'layout', 'events' ], options);

  this.render = function() {

    var log = options.log,
        layout = options.layout,
        events = options.events;

    var html =
      <div className="footer">
        <Log log={ log } layout={ layout } events={ events } />
      </div>;

    return html;
  };
}

module.exports = Footer;