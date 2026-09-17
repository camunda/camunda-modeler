/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { expect } from 'chai';
import { ResourcesProvider } from '../ResourcesProvider';



const DEFAULT_ITEMS = [
  {
    file: {
      name: 'foo.bpmn',
      uri: 'file:///C:/camunda-project/foo.bpmn',
      path: 'C://camunda-project/foo.bpmn',
      dirname: 'C://camunda-project',
      contents: '<?xml version="1.0" encoding="UTF-8"?>'
    },
    metadata: {
      processes: [
        {
          id: 'Process_1',
          name: 'Foo'
        }
      ],
      type: 'bpmn'
    }
  },
  {
    file: {
      name: 'bar.bpmn',
      uri: 'file:///C:/bar.bpmn',
      path: 'C://bar.bpmn',
      dirname: 'C://',
      contents: '<?xml version="1.0" encoding="UTF-8"?>'
    },
    metadata: {
      processes: [
        {
          id: 'Process_2',
          name: 'Bar'
        }
      ],
      type: 'bpmn'
    }
  }
];

const DEFAULT_ITEMS_CAMUNDA_PROJECT = [
  {
    file: {
      name: 'camunda-project.json',
      uri: 'file:///C:/camunda-project/camunda-project.json',
      path: 'C://camunda-project/camunda-project.json',
      dirname: 'C://camunda-project',
      contents: '{}'
    },
    metadata: {
      type: 'camundaProject'
    }
  }
];

const DEFAULT_ITEMS_DMN = [
  {
    file: {
      name: 'foo.dmn',
      uri: 'file:///C:/camunda-project/foo.dmn',
      path: 'C://camunda-project/foo.dmn',
      dirname: 'C://camunda-project',
      contents: '<?xml version="1.0" encoding="UTF-8"?>'
    },
    metadata: {
      decisions: [
        {
          id: 'Decision_1',
          name: 'Foo'
        }
      ],
      type: 'dmn'
    }
  },
  {
    file: {
      name: 'bar.dmn',
      uri: 'file:///C:/bar.dmn',
      path: 'C://bar.dmn',
      dirname: 'C://',
      contents: '<?xml version="1.0" encoding="UTF-8"?>'
    },
    metadata: {
      decisions: [
        {
          id: 'Decision_2',
          name: 'Bar'
        },
        {
          id: 'Decision_3',
          name: 'Baz'
        }
      ],
      type: 'dmn'
    }
  }
];

const DEFAULT_ITEMS_FORM = [
  {
    file: {
      name: 'foo.form',
      uri: 'file:///C:/camunda-project/foo.form',
      path: 'C://camunda-project/foo.form',
      dirname: 'C://camunda-project',
      contents: '<?xml version="1.0" encoding="UTF-8"?>'
    },
    metadata: {
      forms: [
        {
          id: 'Form_1',
          name: 'Foo'
        }
      ],
      type: 'form'
    }
  },
  {
    file: {
      name: 'bar.form',
      uri: 'file:///C:/bar.form',
      path: 'C://bar.form',
      dirname: 'C://',
      contents: '<?xml version="1.0" encoding="UTF-8"?>'
    },
    metadata: {
      forms: [
        {
          id: 'Form_2',
          name: 'Bar'
        }
      ],
      type: 'form'
    }
  }
];

const NO_METADATA = [
  {
    file: {
      name: 'bar.form',
      uri: 'file:///C:/bar.form',
      path: 'C://bar.form',
      dirname: 'C://',
      contents: '<?xml version="1.0" encoding="UTF-8"?>'
    },
    metadata: null
  }
];


describe('ResourcesProvider', function() {

  it('should handle bpmn item', function() {

    // given
    const resourceLoader = createResourceLoader();
    const camundaProjects = createCamundaProjects(DEFAULT_ITEMS);

    const resourcesProvider = new ResourcesProvider(resourceLoader, camundaProjects);

    // when
    const resources = resourcesProvider.getResources();

    // then
    expect(resources).to.eql([
      {
        name: 'Foo',
        type: 'bpmnProcess',
        processId: 'Process_1'
      },
      {
        name: 'Bar',
        type: 'bpmnProcess',
        processId: 'Process_2'
      }
    ]);
  });


  it('should handle dmn item', function() {

    // given
    const resourceLoader = createResourceLoader();
    const camundaProjects = createCamundaProjects(DEFAULT_ITEMS_DMN);

    const resourcesProvider = new ResourcesProvider(resourceLoader, camundaProjects);

    // when
    const resources = resourcesProvider.getResources();

    // then
    expect(resources).to.eql([
      {
        name: 'Foo',
        type: 'dmnDecision',
        decisionId: 'Decision_1'
      },
      {
        name: 'Bar',
        type: 'dmnDecision',
        decisionId: 'Decision_2'
      },
      {
        name: 'Baz',
        type: 'dmnDecision',
        decisionId: 'Decision_3'
      }
    ]);
  });


  it('should handle form item', function() {

    // given
    const resourceLoader = createResourceLoader();
    const camundaProjects = createCamundaProjects(DEFAULT_ITEMS_FORM);

    const resourcesProvider = new ResourcesProvider(resourceLoader, camundaProjects);

    // when
    const resources = resourcesProvider.getResources();

    // then
    expect(resources).to.eql([
      {
        name: 'Foo',
        type: 'form',
        formId: 'Form_1'
      },
      {
        name: 'Bar',
        type: 'form',
        formId: 'Form_2'
      }
    ]);
  });


  it('should ignore Camunda project', function() {

    // given
    const resourceLoader = createResourceLoader();
    const camundaProjects = createCamundaProjects(DEFAULT_ITEMS_CAMUNDA_PROJECT);

    const resourcesProvider = new ResourcesProvider(resourceLoader, camundaProjects);

    // when
    const resources = resourcesProvider.getResources();

    // then
    expect(resources).to.eql([]);
  });


  it('should ignore file without metadata', function() {

    // given
    const resourceLoader = createResourceLoader();
    const camundaProjects = createCamundaProjects(NO_METADATA);

    const resourcesProvider = new ResourcesProvider(resourceLoader, camundaProjects);

    // when
    const resources = resourcesProvider.getResources();

    // then
    expect(resources).to.eql([]);
  });

});


// helper /////////

function createResourceLoader() {
  return {
    register() {}
  };
}

function createCamundaProjects(items) {
  return {
    getItems() {
      return items || [];
    }
  };
}
