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

import {
  debounce
} from '../../../util';

import BpmnEditorBase, {
  SIDE_PANEL_DEFAULT_LAYOUT,
  Loader,
  Settings,
  SidePanel,
  PropertiesTab,
  PropertiesPanelTabActionItem,
  EngineProfile,
  Metadata,
} from '../bpmn-shared/BpmnEditorBase';

import SidePanelTitleBar from '../../side-panel/SidePanelTitleBar';
import TaskTestingTabActionItem from './side-panel/tabs/task-testing/TaskTestingTabActionItem';

import TaskTestingTab from './side-panel/tabs/task-testing/TaskTestingTab';
import TaskTestingIcon from '../../../../resources/icons/TaskTesting.svg';
import SidePanelHeader from './side-panel/SidePanelHeader';

import VariablesSidePanel, { DEFAULT_LAYOUT as VARIABLES_PANEL_DEFAULT_LAYOUT } from './variables-side-panel/VariablesSidePanel';
import VariablesTabActionItem from './variables-side-panel/VariablesTabActionItem';

import BpmnModeler from './modeler';

import * as css from './BpmnEditor.less';

import {
  ENGINES
} from '../../../util/Engines';

import { getCloudTemplates } from '../../../util/elementTemplates';

export const DEFAULT_ENGINE_PROFILE = {
  executionPlatform: ENGINES.CLOUD
};


export class BpmnEditor extends BpmnEditorBase {

  getDefaultEngineProfile() {
    return DEFAULT_ENGINE_PROFILE;
  }

  getPlatformString() {
    return 'cloud';
  }

  setupConstructorExtras() {
    this.handleEngineProfileChange = this.handleEngineProfileChange.bind(this);
    this.handleEngineProfileChangeDebounced = debounce(this.handleEngineProfileChange);
  }

  onEngineProfileSet(engineProfile) {
    const {
      executionPlatform,
      executionPlatformVersion
    } = engineProfile;

    this.props.onAction('emit-event', {
      type: 'tab.engineProfileChanged',
      payload: {
        executionPlatform,
        executionPlatformVersion
      }
    });
  }

  createEngineProfileSetCached() {
    return ({ engineProfile }) => {
      this.handleEngineProfileChangeDebounced({ engineProfile });

      this.setCached({ engineProfile });
    };
  }

  onImportSuccess(engineProfile) {
    if (engineProfile) {
      const { executionPlatform, executionPlatformVersion } = engineProfile;

      this.props.onAction('emit-event', {
        type: 'tab.engineProfileChanged',
        payload: {
          executionPlatform,
          executionPlatformVersion
        }
      });
    }
  }

  getAdditionalListeners() {
    return [
      [ 'propertiesPanel.showEntry', this.handleShowEntry ]
    ];
  }

  getExtraChangedState() {
    return {
      variablesPanel: true
    };
  }

  handleToggleProperties(layout, sidePanelLayout) {
    let mergedLayout = { ...SIDE_PANEL_DEFAULT_LAYOUT, ...sidePanelLayout };

    return {
      sidePanel: {
        ...mergedLayout,
        open: mergedLayout.tab === 'properties' ? !mergedLayout.open : true,
        tab: 'properties'
      }
    };
  }

  handleExtraAction(action, context, layout, modeler) {
    if (action === 'toggleVariables') {
      let { variablesSidePanel: variablesSidePanelLayout = VARIABLES_PANEL_DEFAULT_LAYOUT } = layout;

      variablesSidePanelLayout = { ...VARIABLES_PANEL_DEFAULT_LAYOUT, ...variablesSidePanelLayout };

      const newLayout = {
        variablesSidePanel: {
          ...VARIABLES_PANEL_DEFAULT_LAYOUT,
          ...variablesSidePanelLayout,
          open: !variablesSidePanelLayout.open
        }
      };

      return this.handleLayoutChange(newLayout);
    }

    if (action === 'set-engine-profile') {
      const currentProfile = this.engineProfile.get();

      return this.engineProfile.set({
        executionPlatform: currentProfile.executionPlatform,
        executionPlatformVersion: context.executionPlatformVersion
      });
    }

    if (action === 'resources.reload') {
      return modeler.get('resources.resourceLoader').reload();
    }

    return null;
  }

  handleEngineProfileChange({ engineProfile }) {
    const { executionPlatformVersion: version } = engineProfile;

    if (!version) {
      return;
    }

    const elementTemplates = this.getModeler().get('elementTemplates');

    const engines = {
      ...elementTemplates.getEngines(),
      camunda: version
    };

    elementTemplates.setEngines(engines);
  }

  handleShowEntry = (event) => {
    const { layout = {} } = this.props;

    let { sidePanel: sidePanelLayout = SIDE_PANEL_DEFAULT_LAYOUT } = layout;

    sidePanelLayout = { ...SIDE_PANEL_DEFAULT_LAYOUT, ...sidePanelLayout };

    if (sidePanelLayout.tab === 'properties' && sidePanelLayout.open) {
      return;
    }

    this.handleLayoutChange({
      sidePanel: {
        ...sidePanelLayout,
        open: true,
        tab: 'properties'
      }
    });
  };

  async loadTemplates() {
    const { getConfig } = this.props;

    const modeler = this.getModeler();

    const templatesLoader = modeler.get('elementTemplatesLoader');

    let templates = await getConfig('bpmn.elementTemplates');

    templatesLoader.setTemplates(getCloudTemplates(templates));
  }

  render() {
    const engineProfile = this.engineProfile.getCached();

    const {
      config,
      deployment,
      file,
      id,
      layout,
      onAction,
      startInstance,
      zeebeApi
    } = this.props;

    const modeler = this.getModeler();
    const imported = modeler.getDefinitions();
    const injector = modeler.get('injector');

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

          <VariablesSidePanel
            injector={ injector }
            layout={ layout }
            onAction={ onAction }
            onLayoutChanged={ this.handleLayoutChange }
          />

          <VariablesTabActionItem
            layout={ layout }
            onLayoutChanged={ this.handleLayoutChange }
          />

          <SidePanel
            layout={ layout }
            onLayoutChanged={ this.handleLayoutChange }
          >
            <SidePanel.Header>
              <SidePanelTitleBar
                title="Details"
                onClose={ () => this.handleLayoutChange({
                  sidePanel: {
                    ...SIDE_PANEL_DEFAULT_LAYOUT,
                    ...layout.sidePanel,
                    open: false
                  }
                }) }
              />
            </SidePanel.Header>
            <SidePanel.Header>
              <SidePanelHeader injector={ injector } />
            </SidePanel.Header>
            <SidePanel.Tab id="properties" label="Properties" icon={ Settings }>
              <PropertiesTab propertiesPanelRef={ this.propertiesPanelRef } />
            </SidePanel.Tab>
            <SidePanel.Tab id="test" label="Test" icon={ TaskTestingIcon }>
              <TaskTestingTab
                config={ config }
                deployment={ deployment }
                file={ file }
                id={ id }
                injector={ injector }
                layout={ layout }
                onAction={ onAction }
                startInstance={ startInstance }
                zeebeApi={ zeebeApi }
              />
            </SidePanel.Tab>
          </SidePanel>

          <PropertiesPanelTabActionItem
            layout={ layout }
            onLayoutChanged={ this.handleLayoutChange }
          />
          <TaskTestingTabActionItem
            layout={ layout }
            onLayoutChanged={ this.handleLayoutChange }
          />
        </div>

        { engineProfile && <EngineProfile
          type="bpmn"
          engineProfile={ engineProfile }
          onChange={ (engineProfile) => this.engineProfile.set(engineProfile) } />
        }
      </div>
    );
  }

  static createCachedState(props) {
    const { version } = Metadata;

    return BpmnEditorBase.createModelerForCachedState(props, {
      BpmnModeler,
      configureModelerType: 'cloud',
      changeTemplateCommand: 'propertiesPanel.zeebe.changeTemplate',
      extraModelerOptions: {
        propertiesPanel: {
          feelTooltipContainer: '.editor',
          feelPopupContainer: '.bjs-container',
          layout: (props.layout || {}).propertiesPanel
        },
        elementTemplateChooser: false,
        elementTemplates: {
          engines: {
            camundaDesktopModeler: version
          }
        }
      },
      onModelerCreated: (modeler) => {
        modeler.on('elementTemplates.errors', (event) => {
          console.warn('Element templates errors', event.errors);
        });
      }
    });
  }

}


export default WithCache(WithCachedState(BpmnEditor));
