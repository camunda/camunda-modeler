/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import ProcessApplications from '../ProcessApplications';
import AutoCompletions from '../AutoCompletions';

describe('AutoCompletions', function() {

  let processApplications, autoCompletions;

  beforeEach(function() {
    processApplications = new ProcessApplications();

    processApplications.emit('activeTab-changed', DEFAULT_ACTIVE_TAB);

    processApplications.emit('items-changed', DEFAULT_ITEMS_PROCESS_APPLICATION);

    autoCompletions = new AutoCompletions(processApplications);
  });


  describe('#get', function() {

    it('should get autocompletion', function() {

      // given
      const value = 'BarDec';

      // when
      const autocompletions = autoCompletions.get(value, 'dmn');

      // then
      console.log(autocompletions);
      expect(autocompletions).to.have.length(1);
      expect(autocompletions).to.eql([
        {
          uri: 'file:///C:/process-application/bar/bar.dmn',
          value: 'BarDecision'
        }
      ]);
    });

  });

});

const DEFAULT_ITEMS = [
  {
    file: {
      uri: 'file:///C:/process-application/foo.bpmn',
      path: 'C://process-application/foo.bpmn',
      dirname: 'C://process-application',
      contents: '<?xml version="1.0" encoding="UTF-8"?>'
    },
    metadata: {
      type: 'bpmn',
      ids: [ 'FooProcess' ],
      linkedIds: [
        { linkedId: 'BarProcess', elementId: 'CallActivity_1', type: 'bpmn' },
        { linkedId: 'BarDecision', elementId: 'BusinessRuleTask_1', type: 'dmn' },
        { linkedId: 'BarForm', elementId: 'UserTask_1', type: 'form' }
      ]
    }
  },
  {
    file: {
      uri: 'file:///C:/process-application/bar/bar.bpmn',
      path: 'C://process-application/bar/bar.bpmn',
      dirname: 'C://process-application/bar',
      contents: '<?xml version="1.0" encoding="UTF-8"?>'
    },
    metadata: {
      type: 'bpmn',
      ids: [ 'BarProcess' ],
      linkedIds: [
        { linkedId: 'BazDecision', elementId: 'BusinessRuleTask_1', type: 'dmn' }
      ]
    }
  },
  {
    file: {
      uri: 'file:///C:/process-application/bar/bar.dmn',
      path: 'C://process-application/bar/bar.dmn',
      dirname: 'C://process-application/bar',
      contents: '<?xml version="1.0" encoding="UTF-8"?>'
    },
    metadata: {
      type: 'dmn',
      ids: [ 'BarDecision', 'BazDecision' ],
      linkedIds: []
    }
  },
  {
    file: {
      uri: 'file:///C:/process-application/bar/bar.form',
      path: 'C://process-application/bar/bar.form',
      dirname: 'C://process-application/bar',
      contents: '{}'
    },
    metadata: {
      type: 'form',
      ids: [ 'BarForm' ],
      linkedIds: []
    }
  },
  {
    file: {
      uri: 'file:///C:/bar.bpmn',
      path: 'C://bar.bpmn',
      dirname: 'C://',
      contents: '<?xml version="1.0" encoding="UTF-8"?>'
    },
    metadata: {
      type: 'bpmn'
    }
  }
];

const DEFAULT_ITEMS_PROCESS_APPLICATION = [
  {
    file: {
      uri: 'file:///C:/process-application/.process-application',
      path: 'C://process-application/.process-application',
      dirname: 'C://process-application',
      contents: '{}'
    },
    metadata: {
      type: 'processApplication'
    }
  },
  ...DEFAULT_ITEMS
];

const DEFAULT_ACTIVE_TAB = {
  file: {
    ...DEFAULT_ITEMS[0].file
  }
};