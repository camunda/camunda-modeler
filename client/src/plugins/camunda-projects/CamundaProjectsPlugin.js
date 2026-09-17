/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useRef, useState } from 'react';

import CamundaProjects from './CamundaProjects';
import CamundaProjectsStatusBar from './CamundaProjectsStatusBar';
import CamundaProjectsDeploymentPlugin from './CamundaProjectsDeploymentPlugin';
import CamundaProjectsStartInstancePlugin from './CamundaProjectsStartInstancePlugin';
import { ResourcesProviderModule } from './ResourcesProvider';

import { utmTag } from '../../util/utmTag';
import { useConnectionStatus } from '../../app/hooks/useConnectionStatus';


const camundaProjects = new CamundaProjects();

const DOCUMENTATION_URL = utmTag(
  'https://docs.camunda.io/docs/components/modeler/desktop-modeler/process-applications/'
);

export default function CamundaProjectsPlugin(props) {
  const {
    _getFromApp,
    _getGlobal,
    displayNotification,
    emit,
    log,
    subscribe,
    triggerAction
  } = props;

  const [ activeTab, setActiveTab ] = useState(null);
  const [ tabs, setTabs ] = useState([]);
  const [ items, setItems ] = useState([]);
  const [ camundaProject, setCamundaProject ] = useState(null);
  const [ camundaProjectItems, setCamundaProjectItems ] = useState([]);

  // active tab mirrored synchronously from `app.activeTabChanged`.
  const activeTabRef = useRef(null);

  const connectionCheckResult = useConnectionStatus(subscribe);

  useEffect(() => {
    const subscription = subscribe('app.activeTabChanged', (event) => {
      activeTabRef.current = event.activeTab;

      setActiveTab(event.activeTab);

      camundaProjects.emit('activeTab-changed', event.activeTab);
    });

    return () => subscription.cancel();
  }, [ subscribe ]);

  useEffect(() => {
    const subscription = subscribe('app.tabsChanged', (event) => {
      setTabs(event.tabs);
    });

    return () => subscription.cancel();
  }, [ subscribe ]);

  useEffect(() => {
    const subscription = subscribe('create-camunda-project', async () => {
      const dialog = _getGlobal('dialog');

      const [ directoryPath ] = await dialog.showOpenFilesDialog({
        activeFile: activeTab?.file,
        properties: [
          'createDirectory', // Allow creating new directories from dialog on macOS
          'openDirectory'
        ],
        title: 'Create Project'
      });

      if (!directoryPath) {
        return;
      }

      const file = createCamundaProjectFile();

      const fileSystem = _getGlobal('fileSystem');

      await fileSystem.writeFile(`${directoryPath}/${file.name}`, file);

      _getGlobal('backend').send('file-context:file-opened', `${directoryPath}/${file.name}`, undefined);

      triggerAction('display-notification', {
        type: 'success',
        title: 'Project created',
        content: <a href={ DOCUMENTATION_URL }>Learn more about projects</a>
      });
    });

    return () => subscription.cancel();
  }, [ subscribe, _getGlobal, triggerAction, activeTab ]);

  useEffect(() => {
    const backend = _getGlobal('backend');

    const onItemsChanged = (_, items) => {
      camundaProjects.emit('items-changed', items);

      setItems(items);
    };

    const subscription = backend.on('file-context:changed', onItemsChanged);

    return () => subscription.cancel();
  }, [ _getGlobal ]);

  useEffect(() => {
    const handleCamundaProjectsChanged = () => {
      const hasOpen = camundaProjects.hasOpen();

      if (hasOpen) {
        setCamundaProject(camundaProjects.getOpen());

        const items = camundaProjects.getItems();

        setCamundaProjectItems(items);
      } else {
        setCamundaProject(null);
        setCamundaProjectItems([]);
      }
    };

    camundaProjects.on('changed', handleCamundaProjectsChanged);

    return () => camundaProjects.off('changed', handleCamundaProjectsChanged);
  }, []);

  useEffect(() => {

    const subscription = subscribe('bpmn.modeler.configure', ({ middlewares, tab }) => {

      if (tab.type !== 'cloud-bpmn') {
        return;
      }

      const camundaProjectsHelper = {
        getItems() {
          return camundaProjects.getItems();
        }
      };

      middlewares.push(config => {
        return {
          ...config,
          additionalModules: [
            ...config.additionalModules || [],
            {
              camundaProjects: [ 'value', camundaProjectsHelper ]
            },
            ResourcesProviderModule
          ]
        };
      });

    });

    return () => subscription.cancel();
  }, [ subscribe ]);

  useEffect(() => {

    // only emit on cloud-bpmn tabs
    if (activeTabRef.current?.type === 'cloud-bpmn') {
      triggerAction('resources.reload');
    }
  }, [ activeTab, camundaProjectItems, triggerAction, _getFromApp ]);

  useEffect(() => {
    const tabGroups = tabs.reduce((tabGroups, tab) => {
      if (!tab.file) {
        return {
          ...tabGroups,
          [ tab.id ]: null
        };
      }

      const item = camundaProjects.findItem(tab.file.path);

      if (!item) {
        return {
          ...tabGroups,
          [ tab.id ]: null
        };
      }

      const camundaProjectItemForItem = camundaProjects.findCamundaProjectItemForItem(item);

      if (!camundaProjectItemForItem) {
        return {
          ...tabGroups,
          [ tab.id ]: null
        };
      }

      return {
        ...tabGroups,
        [ tab.id ]: camundaProjectItemForItem.file.path
      };
    }, {});

    triggerAction('set-tab-groups', tabGroups);
  }, [ items, tabs, triggerAction ]);

  return <>
    <CamundaProjectsStatusBar
      activeTab={ activeTab }
      camundaProject={ camundaProject }
      camundaProjectItems={ camundaProjectItems }
      onOpen={ (path) => triggerAction('open-diagram', { path }) }
      onRevealInFileExplorer={ (filePath) => triggerAction('reveal-in-file-explorer', { filePath }) }
      onCreateCamundaProject={ () => emit('create-camunda-project') }
      tabsProvider={ _getFromApp('props').tabsProvider }
    />
    <CamundaProjectsDeploymentPlugin
      _getFromApp={ _getFromApp }
      _getGlobal={ _getGlobal }
      activeTab={ activeTab }
      displayNotification={ displayNotification }
      emit={ emit }
      log={ log }
      camundaProject={ camundaProject }
      camundaProjectItems={ camundaProjectItems }
      triggerAction={ triggerAction }
      connectionCheckResult={ connectionCheckResult } />
    <CamundaProjectsStartInstancePlugin
      _getFromApp={ _getFromApp }
      _getGlobal={ _getGlobal }
      activeTab={ activeTab }
      displayNotification={ displayNotification }
      emit={ emit }
      log={ log }
      camundaProject={ camundaProject }
      camundaProjectItems={ camundaProjectItems }
      triggerAction={ triggerAction }
      connectionCheckResult={ connectionCheckResult } />
  </>;
}

function createCamundaProjectFile(contents = {}) {
  return {
    name: 'camunda-project.json',
    contents: JSON.stringify(contents, null, 2),
    path: null
  };
}
