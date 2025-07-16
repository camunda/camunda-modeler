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
import ProcessApplicationsDeploymentPlugin from './ProcessApplicationsDeploymentPlugin';
import ProcessApplicationsStartInstancePlugin from './ProcessApplicationsStartInstancePlugin';
import { ResourcesProviderModule } from './ResourcesProvider';

const processApplications = new ProcessApplications();

const DOCUMENTATION_URL = 'https://docs.camunda.io/docs/components/modeler/desktop-modeler/process-applications/';

export default function ProcessApplicationsPlugin(props) {
  const {
    _getFromApp,
    _getGlobal,
    displayNotification,
    log,
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
      const dialog = _getGlobal('dialog');

      const [ directoryPath ] = await dialog.showOpenFilesDialog({
        properties: [
          'createDirectory', // Allow creating new directories from dialog on macOS
          'openDirectory'
        ],
        title: 'Create Process Application'
      });

      if (!directoryPath) {
        return;
      }

      const file = createProcessApplicationFile();

      const fileSystem = _getGlobal('fileSystem');

      await fileSystem.writeFile(`${directoryPath}/${file.name}`, file);

      _getGlobal('backend').send('file-context:file-opened', `${directoryPath}/${file.name}`, undefined);

      triggerAction('display-notification', {
        type: 'success',
        title: 'Process application created',
        content: <a href={ DOCUMENTATION_URL }>Learn more about process applications</a>
      });
    });

    _getGlobal('backend').on('file-context:changed', (_, items) => {
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

    subscribe('bpmn.modeler.configure', ({ middlewares, tab }) => {

      if (tab.type !== 'cloud-bpmn') {
        return;
      }

      const processApplicationsHelper = {
        getItems() {
          return processApplications.getItems();
        }
      };

      middlewares.push(config => {
        return {
          ...config,
          additionalModules: [
            ...config.additionalModules || [],
            {
              processApplications: [ 'value', processApplicationsHelper ]
            },
            ResourcesProviderModule
          ]
        };
      });

    });
  }, []);

  useEffect(() => {
    if (activeTab?.type === 'cloud-bpmn') {
      triggerAction('resources.reload');
    }
  }, [ activeTab, processApplicationItems ]);

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

  return <>
    <ProcessApplicationsStatusBar
      activeTab={ activeTab }
      processApplication={ processApplication }
      processApplicationItems={ processApplicationItems }
      onOpen={ (path) => triggerAction('open-diagram', { path }) }
      onRevealInFileExplorer={ (filePath) => triggerAction('reveal-in-file-explorer', { filePath }) }
      tabsProvider={ _getFromApp('props').tabsProvider }
    />
    <ProcessApplicationsDeploymentPlugin
      _getGlobal={ _getGlobal }
      activeTab={ activeTab }
      displayNotification={ displayNotification }
      log={ log }
      processApplication={ processApplication }
      processApplicationItems={ processApplicationItems }
      triggerAction={ triggerAction } />
    <ProcessApplicationsStartInstancePlugin
      _getGlobal={ _getGlobal }
      activeTab={ activeTab }
      displayNotification={ displayNotification }
      log={ log }
      processApplication={ processApplication }
      processApplicationItems={ processApplicationItems }
      triggerAction={ triggerAction } />
  </>;
}

function createProcessApplicationFile(contents = {}) {
  return {
    name: '.process-application',
    contents: JSON.stringify(contents, null, 2),
    path: null
  };
}
