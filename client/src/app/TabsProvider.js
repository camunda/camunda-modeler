import Ids from 'ids';

import bpmnDiagram from './tabs/bpmn/diagram.bpmn';
import cmmnDiagram from './tabs/cmmn/diagram.cmmn';
import dmnDiagram from './tabs/dmn/diagram.dmn';
import dmnTable from './tabs/dmn/table.dmn';

import EmptyTab from './EmptyTab';

const ids = new Ids([ 32, 36, 1 ]);
const createdByType = {};

const noopProvider = {
  getComponent() {
    return null;
  },
  getInitialContents() {
    return null;
  }
};


/**
 * A provider that allows us to customize available tabs.
 */
export default class TabsProvider {

  constructor() {

    this.providers = {
      empty: {
        getComponent() {
          return EmptyTab;
        }
      },
      bpmn: {
        name: 'BPMN',
        getComponent(options) {
          return import('./tabs/bpmn');
        },
        getInitialContents(options) {
          return bpmnDiagram;
        }
      },
      cmmn: {
        name: 'CMMN',
        getComponent(options) {
          return import('./tabs/cmmn');
        },
        getInitialContents(options) {
          return cmmnDiagram;
        }
      },
      dmn: {
        name: 'DMN',
        getComponent(options) {
          return import('./tabs/dmn');
        },
        getInitialContents(options) {
          return options && options.table ? dmnTable : dmnDiagram;
        }
      }
    };

  }

  getProvider(type) {
    return (this.providers[type] || noopProvider);
  }

  getTabComponent(type, options) {
    return this.getProvider(type).getComponent(options);
  }

  getInitialFileContents(type, options) {
    return this.getProvider(type).getInitialContents(options);
  }

  createFile(type, options) {

    const counter = (
      type in createdByType
        ? (++createdByType[type])
        : (createdByType[type] = 1)
    );

    const name = `diagram_${counter}.${type}`;

    const rawContents = this.getInitialFileContents(type, options);

    const contents = rawContents && rawContents.replace('{{ ID }}', ids.next());

    return {
      name,
      contents,
      path: null
    };
  }

  createTab(type, options) {

    const file = this.createFile(type, options);

    return this.createTabForFile(file);
  }

  createTabForFile(file) {

    const id = ids.next();

    const type = file.name.substring(file.name.lastIndexOf('.') + 1);

    return {
      file,
      id,
      get name() {
        return this.file.name;
      },
      get title() {
        return this.file.path || 'unsaved';
      },
      type
    };

  }

}