'use strict';

var h = require('vdom/h');


function MenuBar(options) {

  if (!(this instanceof MenuBar)) {
    return new MenuBar(options);
  }

  this.render = function() {

    var entries = options.entries;

    var html = <div className="menu-bar">
      {
        entries.map(e => {
          return <div className="entry" key={ e.id }>{ h(e) }</div>;
        })
      }
    </div>;

    return html;
  };
}

module.exports = MenuBar;