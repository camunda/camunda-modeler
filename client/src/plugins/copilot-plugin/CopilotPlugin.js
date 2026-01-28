/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { Fragment, useState, useEffect } from 'react';

import { Fill } from '../../app/slot-fill';

import AiIcon from 'icons/Ai.svg';

import './CopilotPlugin.css';

import { CopilotChatPanel } from './copilot/CopilotChatPanel';

/**
 * @param {Object} props - Component properties
 * @param {import('../../app/Settings').default} props.settings
 *
 * @returns {JSX.Element}
 */
export default function CopilotPlugin(props) {

  const {
    subscribe,
    settings,
    triggerAction
  } = props;

  const [ activeTab, setActiveTab ] = useState(null);
  const [ modeler, setModeler ] = useState(null);

  useEffect(() => {
    const subscription = subscribe('app.activeTabChanged', ({ activeTab }) => {
      setActiveTab(activeTab);
    });

    return () => subscription.cancel();
  }, [ subscribe ]);

  useEffect(() => {
    const subscription = subscribe('bpmn.modeler.created', ({ modeler: newModeler }) => {
      setModeler(newModeler);
    });

    return () => subscription.cancel();
  }, [ subscribe ]);

  const toggleKapa = () => {
    window.Kapa.open();
  };

  const toggleCopilot = () => {
    document.getElementsByClassName('copilot-launcher')[0]?.click();
  };

  const [ mcpServers, setMcpServers ] = useState({});

  useEffect(() => {

    settings.register({
      id: 'copilotPlugin',
      title: 'Copilot Plugin',
      properties:{
        'copilotPlugin.mcpServers': {
          type: 'json',
          label: 'MCP JSON Configuration',
          default: '{\n  "mcpServers": {}\n}',
          hiddenPaths: [
            '*Authorization*'
          ]
        }
      }
    });

    const raw = settings.get('copilotPlugin.mcpServers',{});
    try {
      setMcpServers(JSON.parse(raw));
    } catch (e) {
      console.log(e);
      console.log({ raw });
      setMcpServers({});
    }
  }, []);

  settings.subscribe('copilotPlugin.mcpServers', (raw) => {
    try {
      setMcpServers(JSON.parse(raw.value));
    } catch (e) {
      console.log(e);
      console.log({ raw });
      setMcpServers({});
    }
  });

  return (
    <Fragment>
      <Fill slot="status-bar__app" group="9_ai">
        <button
          className="btn"
          title="Copilot"
          onClick={ toggleKapa }
        >
          <img
            src="https://avatars.githubusercontent.com/u/122976076?s=200&v=4"
            className="kapa-icon"
          />
        </button>
        <button
          className="btn"
          title="Copilot"
          onClick={ toggleCopilot }
        >
          <AiIcon className="icon" />
        </button>
        <CopilotChatPanel
          triggerAction={ triggerAction }
          activeTab={ activeTab }
          mcpServers={ mcpServers }
          modeler={ modeler } />
      </Fill>
    </Fragment>
  );
}
