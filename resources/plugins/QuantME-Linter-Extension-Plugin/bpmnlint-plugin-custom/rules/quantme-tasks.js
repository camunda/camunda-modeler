let QuantMEAttributeChecker = require('quantme/replacement/QuantMEAttributeChecker');
let QuantMETransformator = require('quantme/replacement/QuantMETransformator');

/**
 * Rule that reports QuantME tasks for which no suited replacment model exists
 */
module.exports = function() {

  function check(node, reporter) {
    if (node.$type && node.$type.startsWith('quantme:')) {
      if (!QuantMEAttributeChecker.requiredAttributesAvailable(node)) {
        reporter.report(node.id, 'Not all required attributes are set. Unable to replace task!');
        return;
      }
      if (!QuantMETransformator.isReplaceable(node)) {
        reporter.report(node.id, 'Unable to replace this node with available QRMs!');
      }
    }
  }

  return {
    check: check
  };
};
