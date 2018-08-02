'use strict';

function Separator() {

  if (!(this instanceof Separator)) {
    return new Separator();
  }

  this.render = function() {
    return <span className="separator"></span>;
  };
}

module.exports = Separator;