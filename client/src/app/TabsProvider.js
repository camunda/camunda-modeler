import Ids from 'ids';

import bpmnDiagram from './tabs/bpmn/diagram.bpmn';
import cmmnDiagram from './tabs/cmmn/diagram.cmmn';
import dmnDiagram from './tabs/dmn/diagram.dmn';
import dmnTable from './tabs/dmn/table.dmn';

const ids = new Ids([ 32, 36, 1 ]);
const createdByType = {};


/**
 * A provider that allows us to customize available tabs.
 */
export default class TabsProvider {

  getTabComponent(type, options) {

    if (type === 'bpmn') {
      return import('./tabs/bpmn');
    }

    if (type === 'dmn') {
      return import('./tabs/dmn');
    }
  }

  getInitialFileContents(type, options) {

    let contents;

    if (type === 'bpmn') {
      contents = bpmnDiagram;
    }

    if (type === 'cmmn') {
      contents = cmmnDiagram;
    }

    if (type === 'dmn') {
      contents = options && options.table ? dmnTable : dmnDiagram;
    }

    return contents && contents.replace('{{ ID }}', ids.next());
  }

  createFile(type, options) {

    const counter = (
      type in createdByType
        ? (createdByType[type]++)
        : (createdByType[type] = 1)
    );

    const name = `diagram_${counter}.${type}`;

    const contents = this.getInitialFileContents(type, options);

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