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
  WithCache,
  WithCachedState,
} from '../../cached';

import BpmnEditorBase, {
  SidePanel,
  Settings,
  Loader,
  PropertiesTab,
  PropertiesPanelTabActionItem,
  EngineProfile,
} from '../bpmn-shared/BpmnEditorBase';

import BpmnModeler from './modeler';

import * as css from './BpmnEditor.less';

import {
  findUsages as findNamespaceUsages,
  replaceUsages as replaceNamespaceUsages
} from '../util/namespace';

import {
  ENGINES
} from '../../../util/Engines';

import { getPlatformTemplates } from '../../../util/elementTemplates';

const NAMESPACE_URL_ACTIVITI = 'http://activiti.org/bpmn';

const NAMESPACE_CAMUNDA = {
  uri: 'http://camunda.org/schema/1.0/bpmn',
  prefix: 'camunda'
};

export const DEFAULT_ENGINE_PROFILE = {
  executionPlatform: ENGINES.PLATFORM
};


export class BpmnEditor extends BpmnEditorBase {

  getDefaultEngineProfile() {
    return DEFAULT_ENGINE_PROFILE;
  }

  getPlatformString() {
    return 'platform';
  }

  async preProcessXML(xml) {
    return this.handleNamespace(xml);
  }

  handleNamespace = async (xml) => {
    const used = findNamespaceUsages(xml, NAMESPACE_URL_ACTIVITI);

    if (!used) {
      return xml;
    }

    const shouldConvert = await this.shouldConvert();

    if (!shouldConvert) {
      return xml;
    }

    const {
      onContentUpdated
    } = this.props;

    const convertedXML = await replaceNamespaceUsages(xml, used, NAMESPACE_CAMUNDA);

    onContentUpdated(convertedXML);

    return convertedXML;
  };

  async shouldConvert() {
    const { button } = await this.props.onAction('show-dialog', getNamespaceDialog());

    return button === 'yes';
  }

  async loadTemplates() {
    const { getConfig } = this.props;

    const modeler = this.getModeler();

    const templatesLoader = modeler.get('elementTemplatesLoader');

    const templates = await getConfig('bpmn.elementTemplates');

    templatesLoader.setTemplates(getPlatformTemplates(templates));
  }

  render() {
    const engineProfile = this.engineProfile.getCached();

    const { layout } = this.props;

    const imported = this.getModeler().getDefinitions();

    const {
      importing
    } = this.state;

    return (
      <div className={ css.BpmnEditor }>

        <Loader hidden={ imported && !importing } />

        <div className="editor">
          <div
            className="diagram"
            ref={ this.ref }
            onFocus={ this.handleChanged }
            onContextMenu={ this.handleContextMenu }
          ></div>

          <SidePanel
            layout={ layout }
            onLayoutChanged={ this.handleLayoutChange }
          >
            <SidePanel.Tab id="properties" label="Properties" icon={ Settings }>
              <PropertiesTab propertiesPanelRef={ this.propertiesPanelRef } />
            </SidePanel.Tab>
          </SidePanel>
        </div>

        <PropertiesPanelTabActionItem
          layout={ layout }
          onLayoutChanged={ this.handleLayoutChange }
        />

        { engineProfile && <EngineProfile
          type="bpmn"
          engineProfile={ engineProfile }
          onChange={ (engineProfile) => this.engineProfile.set(engineProfile) } />
        }
      </div>
    );
  }

  static createCachedState(props) {
    return BpmnEditorBase.createModelerForCachedState(props, {
      BpmnModeler,
      configureModelerType: 'platform',
      changeTemplateCommand: 'propertiesPanel.camunda.changeTemplate',
      extraModelerOptions: {
        propertiesPanel: {
          layout: (props.layout || {}).propertiesPanel
        }
      },
      cachedStateExtras: {
        namespaceDialogShown: false
      }
    });
  }

}


export default WithCache(WithCachedState(BpmnEditor));

// helpers //////////

function getNamespaceDialog() {
  return {
    type: 'warning',
    title: 'Deprecated <activiti> namespace detected',
    buttons: [
      { id: 'cancel', label: 'Cancel' },
      { id: 'yes', label: 'Yes' }
    ],
    message: 'Would you like to convert your diagram to the <camunda> namespace?',
    detail: [
      'This will allow you to maintain execution related properties.',
      '',
      '<camunda> namespace support works from Camunda BPM versions 7.4.0, 7.3.3, 7.2.6 onwards.'
    ].join('\n')
  };
}
