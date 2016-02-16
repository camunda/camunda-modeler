'use strict';

var inherits = require('inherits');

var Tab = require('base/components/tab');


function EmptyTab(options) {

  if (!(this instanceof EmptyTab)) {
    return new EmptyTab(options);
  }

  this.render = function() {

    var html =
      <div className="FOOO">
        <h1>I am an empty tab!!!</h1>
      </div>;

    return html;
  };

  Tab.call(this, options);
}

inherits(EmptyTab, Tab);

module.exports = EmptyTab;