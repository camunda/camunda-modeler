/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';

import {
  TreeView,
  TreeNode
} from '@carbon/react';

import classNames from 'classnames';

import { Fill } from './slot-fill';

import BPMNIcon from '../../resources/icons/file-types/BPMN.svg';
import DMNIcon from '../../resources/icons/file-types/DMN.svg';
import FormIcon from '../../resources/icons/file-types/Form.svg';
import FileIcon from '../../resources/icons/File.svg';
import FolderIcon from '../../resources/icons/Folder.svg';
import CrossIcon from '../../resources/icons/Cross.svg';

import * as css from './Explorer.less';

export default function Explorer(props) {
  const {
    tabs,
    activeTab,
    folders,
    triggerAction
  } = props;

  return <>
    <Fill slot="left-panel_nav">
      <button className="active">
        <FolderIcon />
      </button>
    </Fill>
    <Fill slot="left-panel_content">
      <div className={ css.Explorer }>
        <div className="open-editors">
          {/* <TreeView label="Open Editors" size="xs" selected={ [] }>
            {
              tabs.map(tab => {
                return <TreeNode
                  depth={ 0 }
                  key={ tab.id }
                  id={ tab.id }
                  label={ <span>{ tab.name }</span> }
                  renderIcon={ CrossIcon }
                  value={ tab.id }
                  selected={ [] }
                  onSelect={ () => triggerAction('show-tab', { tab }) }
                />;
              })
            }
          </TreeView> */}
        </div>
        <div className={ classNames('folder', { 'folder-empty': !folders.length }) }>
          {/* <Folders folders={ folders } triggerAction={ triggerAction } /> */}
          {
            !folders.length
              ? <button className="btn btn-primary" onClick={ () => triggerAction('open-folder') }>Open Process Application</button>
              : null
          }
        </div>
      </div>
    </Fill>
  </>;
}

function Folders(props) {
  const {
    folders,
    triggerAction
  } = props;

  let label;

  if (!folders.length) {
    label = 'No open folder';
  } else if (folders.length > 1) {
    label = `${ folders[ 0 ].name } (Project)`;
  } else {
    label = folders[ 0 ].name;
  }

  return <TreeView label={ label } size="xs" selected={ [] }>
    {
      folders.length
        ? (
          <FolderChildren
            children={ folders.length > 1 ? folders : folders[ 0 ].children }
            triggerAction={ triggerAction } />
        )
        : null
    }
  </TreeView>;
}

function Folder(props) {
  let {
    depth = 0,
    folder,
    triggerAction
  } = props;

  folder = simplifyFolder(folder);

  return <TreeNode
    depth={ depth }
    key={ folder.path }
    id={ folder.path }
    label={ <span>{ folder.name }</span> }
    renderIcon={ getIcon(folder) }
    value={ folder.path }
    selected={ [] }
    onSelect={ () => console.log('TODO') }
    isExpanded={ true }>
    <FolderChildren children={ folder.children } depth={ depth + 1 } triggerAction={ triggerAction } />
  </TreeNode>;
}

function FolderChildren(props) {
  const {
    children = [],
    depth = 0,
    triggerAction
  } = props;

  if (!children.length) {
    return null;
  }

  return sortChildren(children).map(child => {
    if (child.children) {
      return <Folder key={ child.path } depth={ depth } folder={ child } triggerAction={ triggerAction } />;
    }

    return (
      <TreeNode
        depth={ depth }
        key={ child.path }
        id={ child.path }
        label={ <span>{ child.name }</span> }
        renderIcon={ getIcon(child) }
        value={ child.path }
        selected={ [] }
        onSelect={ () => triggerAction('show-tab', { path: child.path }) } />
    );
  });
}

function getIcon(node) {
  const {
    children,
    name
  } = node;

  if (children) {
    return FolderIcon;
  }

  const extension = name.split('.').pop();

  if (extension === 'bpmn') {
    return BPMNIcon;
  } else if (extension === 'dmn') {
    return DMNIcon;
  } else if (extension === 'form') {
    return FormIcon;
  }

  return FileIcon;
}

function simplifyFolder(folder) {
  if (folder.children.length === 1 && folder.children[ 0 ].children) {
    return simplifyFolder({
      ...folder.children[ 0 ],
      name: `${ folder.name }/${ folder.children[ 0 ].name }`
    });
  }

  return folder;
}

function sortChildren(children) {
  return children.sort((a, b) => {
    if (a.children) {
      return -1;
    } else if (b.children) {
      return 1;
    }

    return 0;
  });
}
