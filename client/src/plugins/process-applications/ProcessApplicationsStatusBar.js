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

import ProcessApplicationIcon from '../../../resources/icons/file-types/ProcessApplication.svg';
import ErrorIcon from '../../../resources/icons/Error.svg';

import * as css from './ProcessApplicationsStatusBar.less';

export default function ProcessApplicationsStatusBar(props) {
  const ref = useRef();

  const [ isOpen, setIsOpen ] = useState(false);

  const {
    activeTab,
    onOpen,
    onRevealInFileExplorer,
    processApplication,
    processApplicationItems,
    tabsProvider
  } = props;

  useEffect(() => {
    if (!processApplication) {
      setIsOpen(false);
    }
  }, [ processApplication ]);

  if (!processApplication) {
    return null;
  }

  const onClick = (path) => {
    onOpen(path);

    setIsOpen(false);
  };

  return <>
    <Fill slot="status-bar__file" group="0_process-application">
      <button className={ classnames('btn', css.ProcessApplicationsButton) } ref={ ref } onClick={ () => setIsOpen(!isOpen) } title="This file is part of a process application">
        <ProcessApplicationIcon width="16" height="16" />
      </button>
    </Fill>
    {
      isOpen && <Overlay className={ css.ProcessApplicationsOverlay } id="process-application-overlay" anchor={ ref.current } onClose={ () => setIsOpen(false) }>
        <Section>
          <Section.Header>
            Process application
          </Section.Header>
          <Section.Body>
            <ul className="files process-application-file" role="menu">
              <li role="menuitem" className="file" key={ processApplication.file.path } title={ processApplication.file.path }>
                <button type="button" onClick={ () => onRevealInFileExplorer(processApplication.file.path) }>
                  <ProcessApplicationIcon className="file-icon" width="16" height="16" /><span className="file-name">{ processApplication.file.name }</span>
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
            <ul className="files process-application-files" role="menu">
              {
                sortByType(processApplicationItems.filter(item => item.metadata?.type !== 'processApplication')).map(item => {
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
                    <button type="button" onClick={ () => onClick(file.path) } disabled={ isActiveTab || error }>
                      {Icon && <Icon className="file-icon" width="16" height="16" />}
                      <span className="file-name">{ file.name }</span>
                    </button>
                  </li>;
                })
              }
            </ul>
          </Section.Body>
        </Section>
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