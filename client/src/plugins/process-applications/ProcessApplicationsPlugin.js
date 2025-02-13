/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useState } from 'react';

import ProcessApplications from './ProcessApplications';
import ProcessApplicationsStatusBar from './ProcessApplicationsStatusBar';

const processApplications = new ProcessApplications();

const DOCUMENTATION_URL = 'https://docs.camunda.io/docs/components/modeler/web-modeler/process-applications/';

export default function ProcessApplicationsPlugin(props) {
  const {
    _getFromApp: getFromApp,
    _getGlobal: getGlobal,
    subscribe,
    triggerAction
  } = props;

  const [ activeTab, setActiveTab ] = useState(null);
  const [ tabs, setTabs ] = useState([]);
  const [ items, setItems ] = useState([]);
  const [ processApplication, setProcessApplication ] = useState(null);
  const [ processApplicationItems, setProcessApplicationItems ] = useState([]);

  useEffect(() => {
    subscribe('app.activeTabChanged', (event) => {
      setActiveTab(event.activeTab);

      processApplications.emit('activeTab-changed', event.activeTab);
    });

    subscribe('app.tabsChanged', (event) => {
      setTabs(event.tabs);
    });

    subscribe('create-process-application', async () => {
      const dialog = getGlobal('dialog');

      const [ directoryPath ] = await dialog.showOpenFilesDialog({
        properties: [ 'openDirectory' ],
        title: 'Create Process Application'
      });

      if (!directoryPath) {
        return;
      }

      const file = createProcessApplicationFile();

      const fileSystem = getGlobal('fileSystem');

      await fileSystem.writeFile(`${directoryPath}/${file.name}`, file);

      getGlobal('backend').send('file-context:file-opened', `${directoryPath}/${file.name}`, undefined);

      triggerAction('display-notification', {
        type: 'success',
        title: 'Process application created',
        content: <a href={ DOCUMENTATION_URL }>Learn more about process applications</a>
      });
    });

    getGlobal('backend').on('file-context:changed', (_, items) => {
      console.log('file-context:changed', items);

      processApplications.emit('items-changed', items);

      setItems(items);
    });

    processApplications.on('changed', () => {
      const hasOpen = processApplications.hasOpen();

      if (hasOpen) {
        setProcessApplication(processApplications.getOpen());

        const items = processApplications.getItems();

        setProcessApplicationItems(items);
      } else {
        setProcessApplication(null);
        setProcessApplicationItems([]);
      }
    });
  }, []);

  useEffect(() => {
    const tabGroups = tabs.reduce((tabGroups, tab) => {
      if (!tab.file) {
        return {
          ...tabGroups,
          [ tab.id ]: null
        };
      }

      const item = processApplications.findItem(tab.file.path);

      if (!item) {
        return {
          ...tabGroups,
          [ tab.id ]: null
        };
      }

      const processApplicationItemForItem = processApplications.findProcessApplicationItemForItem(item);

      if (!processApplicationItemForItem) {
        return {
          ...tabGroups,
          [ tab.id ]: null
        };
      }

      return {
        ...tabGroups,
        [ tab.id ]: processApplicationItemForItem.file.path
      };
    }, {});

    for (const [ id, group ] of Object.entries(tabGroups)) {
      triggerAction('set-tab-group', {
        id,
        group
      });
    }
  }, [ items, tabs ]);

  return <ProcessApplicationsStatusBar
    activeTab={ activeTab }
    processApplication={ processApplication }
    processApplicationItems={ processApplicationItems }
    onOpen={ (path) => triggerAction('open-diagram', { path }) }
    onRevealInFileExplorer={ (filePath) => triggerAction('reveal-in-file-explorer', { filePath }) }
    tabsProvider={ getFromApp('props').tabsProvider }
  />;
}

function createProcessApplicationFile(contents = {}) {
  return {
    name: '.process-application',
    contents: JSON.stringify(contents, null, 2),
    path: null
  };
}