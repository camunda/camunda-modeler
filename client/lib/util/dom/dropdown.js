'use strict';

var getParent = require('util/dom/get-parent');


/**
 * Generic drop down functionality that may be used
 * to create mouse down + mouse click aware drop downs.
 *
 * Expected HTML:
 *
 * <div class={active?}>
 *   <span class="primary"></span>
 *   <ul class="dropdown">
 *     <li class="entry">FOO</li>
 *     <li class="entry {active?}">BAR</li>
 *   </ul>
 * </div>
 *
 * @return {Function} mouseDown initializer for dropdown
 */
function dropdown(parent) {

  var el, activeDropdown;

  function close() {
    el.classList.remove('active');

    if (activeDropdown) {
      activeDropdown.classList.remove('active');
    }

    document.body.removeEventListener('mouseup', up);
    el.removeEventListener('mouseover', hover);
    el.removeEventListener('mouseout', out);
  }

  function hover(event) {

    var li = getParent(event.target, 'entry', 2);

    if (li) {
      li.classList.add('active');
      activeDropdown = li;
    }
  }

  function out(event) {

    var li = getParent(event.target, 'entry', 2);

    if (li) {
      li.classList.remove('active');
      activeDropdown = null;
    }
  }

  function up(event) {

    var target = event.target;

    if (getParent(target, parent, 5) && !
        getParent(target, 'dropdown', 3)) {

      return;
    }

    close();
  }

  function down(event) {

    var target = event.target;

    var isDropdown = getParent(target, 'dropdown', 3);

    var currentTarget = el = event.currentTarget;

    var classes = currentTarget.classList;

    if (!classes.contains('active')) {
      document.body.addEventListener('mouseup', up);
      currentTarget.addEventListener('mouseover', hover);
      currentTarget.addEventListener('mouseout', out);

      classes.add('active');
    } else {
      if (!isDropdown) {
        close();
      }
    }
  }

  return down;
}

module.exports = dropdown;
