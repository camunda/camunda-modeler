/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';

import CamundaProjects from './CamundaProjects';
import CamundaProjectsStatusBar from './CamundaProjectsStatusBar';
import CamundaProjectsDeploymentPlugin from './CamundaProjectsDeploymentPlugin';
import CamundaProjectsStartInstancePlugin from './CamundaProjectsStartInstancePlugin';
import { ResourcesProviderModule } from './ResourcesProvider';

import { getTabGroupColors } from '../../app/primitives/TabLinks';
import { utmTag } from '../../util/utmTag';
import { useConnectionStatus } from '../../app/hooks/useConnectionStatus';


const camundaProjects = new CamundaProjects();

const DOCUMENTATION_URL = utmTag(
  'https://docs.camunda.io/docs/components/modeler/desktop-modeler/projects/'
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

    /**
     * @param {Object} [options]
     * @param {string} [options.title] title of the folder dialog
     * @param {Array<{ name: string, contents: string }>} [options.files] files to add, the first one is the main file
     */
    const subscription = subscribe('create-camunda-project', async ({ title = 'Create Project', files } = {}) => {
      const dialog = _getGlobal('dialog');

      const [ directoryPath ] = await dialog.showOpenFilesDialog({
        activeFile: activeTab?.file,
        properties: [
          'createDirectory', // Allow creating new directories from dialog on macOS
          'openDirectory'
        ],
        title
      });

      if (!directoryPath) {
        return;
      }

      if (files?.length) {
        return createProjectWithFiles({
          directoryPath,
          files,
          fileSystem: _getGlobal('fileSystem'),
          backend: _getGlobal('backend'),
          tabsProvider: _getFromApp('props').tabsProvider,
          triggerAction
        });
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
  }, [ subscribe, _getGlobal, _getFromApp, triggerAction, activeTab ]);

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

  const tabGroups = useMemo(() => {
    return tabs.reduce((tabGroups, tab) => {
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
  }, [ items, tabs ]);

  useEffect(() => {
    triggerAction('set-tab-groups', tabGroups);
  }, [ tabGroups, triggerAction ]);

  const camundaProjectColor = camundaProject && getTabGroupColors(tabs, tabGroups)[ camundaProject.file.path ];

  return <>
    <CamundaProjectsStatusBar
      activeTab={ activeTab }
      camundaProject={ camundaProject }
      camundaProjectColor={ camundaProjectColor }
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
      subscribe={ subscribe }
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
      subscribe={ subscribe }
      triggerAction={ triggerAction }
      connectionCheckResult={ connectionCheckResult } />
  </>;
}

function createCamundaProjectFile(contents = {}) {
  return {
    name: 'camunda.json',
    contents: JSON.stringify(contents, null, 2),
    path: null
  };
}

/**
 * Create a project with the given files and open them. Does not create files
 * without an editor or overwrite existing files, and keeps the project file
 * of a folder that is a project.
 *
 * @param {Object} options
 * @param {string} options.directoryPath
 * @param {Array<{ name: string, contents: string }>} options.files the first one is the main file
 * @param {Object} options.fileSystem
 * @param {Object} options.backend
 * @param {Object} options.tabsProvider
 * @param {Function} options.triggerAction
 */
async function createProjectWithFiles({ directoryPath, files, fileSystem, backend, tabsProvider, triggerAction }) {
  const unsupportedFiles = getUnsupportedFiles(tabsProvider, files);

  if (unsupportedFiles.length) {
    triggerAction('display-notification', {
      type: 'error',
      title: 'Project not created',
      content: `Camunda Modeler can't open ${ unsupportedFiles.join(', ') }.`
    });

    return;
  }

  const getPath = name => `${ directoryPath }/${ name }`;

  const existingFiles = await getExistingFiles(fileSystem, getPath, files);

  if (existingFiles.length) {
    triggerAction('display-notification', {
      type: 'error',
      title: 'Project not created',
      content: `The folder already contains ${ existingFiles.join(', ') }. Choose an empty folder.`
    });

    return;
  }

  const projectFile = createCamundaProjectFile();

  const projectFilePath = getPath(projectFile.name);

  try {
    if (!(await fileExists(fileSystem, projectFilePath))) {
      await fileSystem.writeFile(projectFilePath, projectFile);
    }

    for (const { name, contents } of files) {
      await fileSystem.writeFile(getPath(name), { name, contents, path: null });
    }
  } catch (error) {
    triggerAction('display-notification', {
      type: 'error',
      title: 'Project not created',
      content: `Writing the files failed: ${ error.message }`
    });

    return;
  }

  backend.send('file-context:file-opened', projectFilePath, undefined);

  // the last opened file is shown
  for (const { name } of [ ...files.slice(1), files[0] ]) {
    await triggerAction('open-diagram', { path: getPath(name) });
  }
}

/**
 * @param {Object} fileSystem
 * @param {string} path
 *
 * @return {Promise<boolean>}
 */
async function fileExists(fileSystem, path) {
  const { lastModified } = await fileSystem.readFileStats({ path });

  return !!lastModified;
}

/**
 * @param {Object} fileSystem
 * @param {(name: string) => string} getPath
 * @param {Array<{ name: string }>} files
 *
 * @return {Promise<Array<string>>} names of the files that exist in the folder
 */
async function getExistingFiles(fileSystem, getPath, files) {
  const existing = await Promise.all(
    files.map(({ name }) => fileExists(fileSystem, getPath(name)))
  );

  return files.filter((_, index) => existing[ index ]).map(({ name }) => name);
}

/**
 * @param {Object} tabsProvider
 * @param {Array<{ name: string }>} files
 *
 * @return {Array<string>} names of the files without an editor, e.g. forms with `disable-form`
 */
function getUnsupportedFiles(tabsProvider, files) {
  return files
    .filter(({ name }) => !tabsProvider.hasProvider(name.split('.').pop()))
    .map(({ name }) => name);
}
