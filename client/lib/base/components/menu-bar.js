'use strict';

var h = require('vdom/h');

var forEach = require('lodash/collection/forEach');

function MenuBar(options) {

  if (!(this instanceof MenuBar)) {
    return new MenuBar(options);
  }

  this.render = function() {

    var entries = options.entries,
        groups = [];

    forEach(entries, function(group) {
      if (group.visible) {
        groups.push(group);
      }
    });

    var html = <div className="menu-bar">
    {
      groups.map(function(group) {
        return <div className={ 'group ' + group.name }>
          {
            group.buttons.map(e => {
              return <div className="entry" key={ e.id }>{ h(e) }</div>;
            })
          }
        </div>;
      })
    }
    </div>;

    return html;
  };
}

module.exports = MenuBar;
