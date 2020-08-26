let QuantMEAttributeChecker = require('quantme/custom/replacement/QuantMEAttributeChecker');
let QuantMEReplacementUtility = require('quantme/custom/replacement/QuantMEReplacementUtility');

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
      if (!QuantMEReplacementUtility.isReplaceable(node)) {
        reporter.report(node.id, 'Unable to replace this node with available QRMs!');
      }
    }
  }

  return {
    check: check
  };
};
