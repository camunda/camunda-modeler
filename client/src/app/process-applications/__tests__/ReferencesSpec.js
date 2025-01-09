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
import References from '../References';

describe('References', function() {

  let processApplications, references;

  beforeEach(function() {
    processApplications = new ProcessApplications();

    processApplications.emit('activeTab-changed', DEFAULT_ACTIVE_TAB);

    processApplications.emit('items-changed', DEFAULT_ITEMS_PROCESS_APPLICATION);

    references = new References(processApplications);
  });


  describe('#findReferencesFrom', function() {

    it('should find references from BPMN', function() {

      // given
      const path = DEFAULT_ITEMS[0].file.path;

      // when
      const referencesFrom = references.findReferencesFrom(path);

      // then
      expect(referencesFrom).to.have.length(3);
      expect(referencesFrom).to.eql([
        {
          source: {
            id: 'CallActivity_1',
            type: 'bpmn',
            uri: 'file:///C:/process-application/foo.bpmn'
          },
          target: {
            id: 'BarProcess',
            type: 'bpmn',
            uri: 'file:///C:/process-application/bar/bar.bpmn'
          }
        },
        {
          source: {
            id: 'BusinessRuleTask_1',
            type: 'bpmn',
            uri: 'file:///C:/process-application/foo.bpmn'
          },
          target: {
            id: 'BarDecision',
            type: 'dmn',
            uri: 'file:///C:/process-application/bar/bar.dmn'
          }
        },
        {
          source: {
            id: 'UserTask_1',
            type: 'bpmn',
            uri: 'file:///C:/process-application/foo.bpmn'
          },
          target: {
            id: 'BarForm',
            type: 'form',
            uri: 'file:///C:/process-application/bar/bar.form'
          }
        }
      ]);
    });


    it('should find references with ID from BPMN', function() {

      // given
      const path = DEFAULT_ITEMS[0].file.path;

      // when
      const referencesFrom = references.findReferencesFrom(path, 'CallActivity_1');

      // then
      expect(referencesFrom).to.have.length(1);
      expect(referencesFrom).to.eql([
        {
          source: {
            id: 'CallActivity_1',
            type: 'bpmn',
            uri: 'file:///C:/process-application/foo.bpmn'
          },
          target: {
            id: 'BarProcess',
            type: 'bpmn',
            uri: 'file:///C:/process-application/bar/bar.bpmn'
          }
        }
      ]);
    });


    it('should not find references from process application', function() {

      // given
      const path = DEFAULT_ITEMS_PROCESS_APPLICATION[0].file.path;

      // when
      // then
      expect(() => references.findReferencesFrom(path)).to.throw('Finding references for process applications is not supported.');
    });

  });


  describe('#findReferencesTo', function() {

    it('should find references to BPMN', function() {

      // given
      const path = DEFAULT_ITEMS[1].file.path;

      // when
      const referencesTo = references.findReferencesTo(path);

      // then
      expect(referencesTo).to.have.length(1);
      expect(referencesTo).to.eql([
        {
          source: {
            id: 'CallActivity_1',
            type: 'bpmn',
            uri: 'file:///C:/process-application/foo.bpmn'
          },
          target: {
            id: 'BarProcess',
            type: 'bpmn',
            uri: 'file:///C:/process-application/bar/bar.bpmn'
          }
        }
      ]);
    });


    it('should find references to DMN', function() {

      // given
      const path = DEFAULT_ITEMS[2].file.path;

      // when
      const referencesTo = references.findReferencesTo(path);

      // then
      expect(referencesTo).to.have.length(2);
      expect(referencesTo).to.eql([
        {
          source: {
            id: 'BusinessRuleTask_1',
            type: 'bpmn',
            uri: 'file:///C:/process-application/foo.bpmn'
          },
          target: {
            id: 'BarDecision',
            type: 'dmn',
            uri: 'file:///C:/process-application/bar/bar.dmn'
          }
        },
        {
          source: {
            id: 'BusinessRuleTask_1',
            type: 'bpmn',
            uri: 'file:///C:/process-application/bar/bar.bpmn'
          },
          target: {
            id: 'BazDecision',
            type: 'dmn',
            uri: 'file:///C:/process-application/bar/bar.dmn'
          }
        }
      ]);
    });


    it('should find references with ID to DMN', function() {

      // given
      const path = DEFAULT_ITEMS[2].file.path;

      // when
      const referencesTo = references.findReferencesTo(path, 'BarDecision');

      // then
      expect(referencesTo).to.have.length(1);
      expect(referencesTo).to.eql([
        {
          source: {
            id: 'BusinessRuleTask_1',
            type: 'bpmn',
            uri: 'file:///C:/process-application/foo.bpmn'
          },
          target: {
            id: 'BarDecision',
            type: 'dmn',
            uri: 'file:///C:/process-application/bar/bar.dmn'
          }
        }
      ]);
    });


    it('should find references to form', function() {

      // given
      const path = DEFAULT_ITEMS[3].file.path;

      // when
      const referencesTo = references.findReferencesTo(path);

      // then
      expect(referencesTo).to.have.length(1);
      expect(referencesTo).to.eql([
        {
          source: {
            id: 'UserTask_1',
            type: 'bpmn',
            uri: 'file:///C:/process-application/foo.bpmn'
          },
          target: {
            id: 'BarForm',
            type: 'form',
            uri: 'file:///C:/process-application/bar/bar.form'
          }
        }
      ]);
    });


    it('should not find references to process application', function() {

      // given
      const path = DEFAULT_ITEMS_PROCESS_APPLICATION[0].file.path;

      // when
      // then
      expect(() => references.findReferencesTo(path)).to.throw('Finding references for process applications is not supported.');
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