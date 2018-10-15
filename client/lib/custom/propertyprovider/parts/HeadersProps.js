var properties = require('./implementation/Headers'),
    elementHelper = require('bpmn-js-properties-panel/lib/helper/ElementHelper'),
    cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper'),
    is = require('bpmn-js/lib/util/ModelUtil').is;

module.exports = function(group, element, bpmnFactory) {

  if (!is(element, 'bpmn:ServiceTask')) {
    return;
  }

  var propertiesEntry = properties(element, bpmnFactory, {
    id: 'headers',
    modelProperties: [ 'key', 'value' ],
    labels: [ 'Key', 'Value' ],

    getParent: function(element, node, bo) {
      return bo.extensionElements;
    },

    createParent: function(element, bo) {
      var parent = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
      var cmd = cmdHelper.updateBusinessObject(element, bo, { extensionElements: parent });
      return {
        cmd: cmd,
        parent: parent
      };
    }
  });

  if (propertiesEntry) {
    group.entries.push(propertiesEntry);
  }

};