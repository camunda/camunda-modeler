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

import classnames from 'classnames';

import { omit } from 'min-dash';

import { Fill } from '../../app/slot-fill';

import { Overlay, Section } from '../../shared/ui';

import { utmTag } from '../../util/utmTag';

import CamundaProjectIcon from '../../../resources/icons/file-types/CamundaProject.svg';
import ErrorIcon from '../../../resources/icons/Error.svg';

import * as css from './CamundaProjectsStatusBar.css';

export default function CamundaProjectsStatusBar(props) {
  const ref = useRef();

  const [ isOpen, setIsOpen ] = useState(false);

  const {
    activeTab,
    onOpen,
    onRevealInFileExplorer,
    onCreateCamundaProject,
    camundaProject,
    camundaProjectItems,
    tabsProvider
  } = props;

  useEffect(() => {
    if (!camundaProject) {
      setIsOpen(false);
    }
  }, [ camundaProject ]);

  const onClickOpenPath = (path) => {
    onOpen(path);

    setIsOpen(false);
  };

  const onClickCreateCamundaProject = () => {
    onCreateCamundaProject();

    setIsOpen(false);
  };

  return <>
    {
      isCamundaProjectAllowed(activeTab) && <Fill slot="status-bar__file" group="0_camunda-project">
        <button
          className={ classnames('btn', css.CamundaProjectsButton, { 'has-camunda-project': !!camundaProject }) }
          ref={ ref }
          onClick={ () => setIsOpen(!isOpen) }
          title={ camundaProject ? 'This file is part of a project' : 'New project...' }
        >
          <CamundaProjectIcon width="16" height="16" />
        </button>
      </Fill>
    }
    {
      isOpen && <Overlay className={ classnames(css.CamundaProjectsOverlay, {
        'camunda-project': camundaProject,
        'no-camunda-project': !camundaProject
      }) } id="camunda-project-overlay" anchor={ ref.current } maxHeight="calc(100vh - 40px)" onClose={ () => setIsOpen(false) }>
        {
          !camundaProject
            ? <>
              <Section className="camunda-project-section">
                <Section.Body>
                  <p>Create a <a href={ utmTag('https://docs.camunda.io/docs/components/modeler/desktop-modeler/process-applications/') }>project</a>:</p>
                  <ul>
                    <li>Deploy and test resources (BPMN, DMN, forms) as a single unit</li>
                    <li>Benefit from cross-file editor intelligence and improved discovery</li>
                  </ul>
                  <p>
                    <button type="button" className="btn btn-primary create-camunda-project-btn" onClick={ onClickCreateCamundaProject }>
                      Create a new project
                    </button>
                  </p>
                </Section.Body>
              </Section>
            </>
            : <>
              <Section>
                <Section.Header>
                  Project
                </Section.Header>
                <Section.Body>
                  <ul className="files camunda-project-file" role="menu">
                    <li role="menuitem" className="file" key={ camundaProject.file.path } title={ camundaProject.file.path }>
                      <button type="button" onClick={ () => onRevealInFileExplorer(camundaProject.file.path) }>
                        <CamundaProjectIcon className="file-icon" width="16" height="16" /><span className="file-name">{ camundaProject.file.name }</span>
                      </button>
                    </li>
                  </ul>
                </Section.Body>
              </Section>
              <Section>
                <Section.Header>
                  Files
                </Section.Header>
                <Section.Body>
                  <ul className="files camunda-project-files" role="menu">
                    {
                      sortByType(camundaProjectItems.filter(item => item.metadata?.type !== 'camundaProject')).map(item => {
                        const { file } = item;

                        const error = hasErrorMessage(item);

                        let Icon;

                        if (error) {
                          Icon = ErrorIcon;
                        } else {
                          const provider = tabsProvider.getProviderForFile(file);

                          Icon = provider?.getIcon(file);
                        }

                        const isActiveTab = activeTab && activeTab.file.path === file.path;

                        const title = error ? `${ file.path} (${ getErrorMessages(item) })` : file.path;

                        return <li role="menuitem" className={
                          classnames('file', {
                            'file-active': isActiveTab,
                            'file-error': error
                          })
                        } key={ file.path } title={ title }>
                          <button type="button" onClick={ () => onClickOpenPath(file.path) } disabled={ isActiveTab || error }>
                            {Icon && <Icon className="file-icon" width="16" height="16" />}
                            <span className="file-name">{ file.name }</span>
                          </button>
                        </li>;
                      })
                    }
                  </ul>
                </Section.Body>
              </Section>
            </>
        }
      </Overlay>
    }
  </>;
}

function sortByType(items) {
  const groupedByType = items.reduce((acc, item) => {
    const { metadata } = item;

    let type;

    if (hasErrorMessage(item)) {
      type = 'error';
    } else {
      type = metadata?.type;
    }

    if (!acc[type]) {
      acc[type] = [];
    }

    acc[type].push(item);

    return acc;
  }, {});

  for (const type in groupedByType) {
    groupedByType[type].sort((a, b) => a.file.name.localeCompare(b.file.name));
  }

  return Object.values(omit(groupedByType, 'error')).flat().concat(groupedByType.error || []);
}

function hasErrorMessage(item) {
  return item.file.messages?.some(({ error }) => error);
}

function getErrorMessages(item) {
  return item.file.messages?.filter(({ error }) => error).map(({ message }) => message).join(', ');
}

function isCamundaProjectAllowed(tab) {
  if (!tab) {
    return false;
  }

  const { type } = tab;

  return [
    'cloud-bpmn',
    'cloud-dmn',
    'cloud-form',
    'rpa'
  ].includes(type);
}