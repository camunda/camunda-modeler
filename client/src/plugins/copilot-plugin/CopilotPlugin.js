/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { Fragment } from 'react';

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
    settings
  } = props;

  const toggleKapa = () => {
    window.Kapa.open();
  };

  const toggleCopilot = () => {
    document.getElementsByClassName('copilot-launcher')[0]?.click();
  };

  settings.register({
    id: 'copilotPlugin',
    title: 'Copilot Plugin',
    properties:{
      'copilotPlugin.mcpServers': {
        type: 'json',
        label: 'mcp json config',
        default: '{\n  "mcpServers": []\n}',
        hiddenPaths: [
          '*Authorization*'
        ]
      }
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
        <CopilotChatPanel />
      </Fill>
    </Fragment>
  );
}