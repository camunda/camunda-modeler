'use strict';

function selectText(element) {
  var range, selection;

  selection = window.getSelection();
  range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
}

module.exports = selectText;
