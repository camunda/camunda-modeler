/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { Fragment, useEffect, useRef, useState } from 'react';

import Fill from 'camunda-modeler-plugin-helpers/components/Fill';

import CarbonModal from './CarbonModal';

const PLUGIN_NAME = 'test-client';

const PLUGIN_SETTINGS = {
  id: 'testClientPlugin',
  title: 'Test Client Plugin',
  properties: {
    'testClientPlugin.heartbeat': {
      type: 'boolean',
      default: true,
      label: 'Will My Heart Go On?',
      description: 'Enable the heart icon in the status bar.'
    },
    'testClientPlugin.iconColor': {
      type: 'text',
      default: '#10ad73',
      label: 'Icon color',
      description: 'Color of the lovely heart icon.'
    },
    'testClientPlugin.showAllFields': {
      type: 'boolean',
      default: false,
      label: 'Show all possible form fields',
    },

    'testClientPlugin.textInput': {
      type: 'text',
      label: 'Constrained Text Input with Hint',
      description: 'describing the text input',
      hint: 'Hint (must be URL)',

      // showcasing that also absolute path works
      condition: { property: 'testClientPlugin.showAllFields', equals: true },
      constraints:{
        notEmpty: 'This field must be filled',
        pattern:{
          value: /(https?:\/\/).*/,
          message: 'Must be a valid URL'
        }
      }
    },

    'testClientPlugin.passwordInput': {
      type: 'password',
      label: 'Password Input',
      description: 'describing the password',
      condition: { property: 'showAllFields', equals: true },
      constraints: {
        pattern:{
          value: 'secret',
          message: 'Password must be secret'
        }
      }
    },
    'testClientPlugin.boolean': {
      type: 'boolean',
      default: false,
      label: 'Checkbox',
      description: 'describing the checkbox',
      documentationUrl: 'https://docs.camunda.io/docs/apis-tools/camunda-8-api/overview/',
      condition: { property: 'showAllFields', equals: true },
      constraints: {
        pattern: {
          value: false,
          message: 'You must uncheck the box'
        }
      }
    },
    'testClientPlugin.select': {
      type: 'select',
      label: 'Select Dropdown',
      placeholder: 'You need to select second',
      description: 'describing the select',
      documentationUrl: 'https://docs.camunda.io/docs/apis-tools/camunda-8-api/overview/',
      options: [
        { label: 'First Option', value: 'first' },
        { label: 'Second Option', value: 'second' },
        { label: 'Third Option', value: 'third' }
      ],
      condition: { property: 'showAllFields', equals: true },
      constraints: {
        pattern: 'second'
      }
    },
    'testClientPlugin.radio': {
      type: 'radio',
      label: 'Radio for oneOf & matchAll condition',
      description: 'describing the radio',
      documentationUrl: 'https://docs.camunda.io/docs/apis-tools/camunda-8-api/overview/',


      options: [
        { label: 'First Option (show)', value: 'first' },
        { label: 'Second Option (hide)', value: 'second' },
        { label: 'Third Option (show)', value: 'third' }
      ],
      condition: { property: 'showAllFields', equals: true },
      constraints: {
        pattern: 'second'
      }
    },
    'testClientPlugin.conditionOneOfTextField': {
      type: 'text',
      label: 'allMatch(equals, oneOf) Text Field',
      condition: {
        allMatch: [
          { property: 'showAllFields', equals: true },
          { property: 'radio', oneOf: [ 'first', 'third' ] }
        ]
      }
    }
  }
};

export default function TestClient(props) {

  const {
    subscribe,
    config,
    settings
  } = props;

  const [ saveCounter, setSaveCounter ] = useState(0);
  const [ tabType, setTabType ] = useState(null);
  const [ showModal, setShowModal ] = useState(false);
  const [ color, setColor ] = useState('#10ad73');
  const [ heartbeat, setHeartbeat ] = useState(true);

  const saveCounterRef = useRef(saveCounter);
  saveCounterRef.current = saveCounter;

  useEffect(() => {
    settings.register(PLUGIN_SETTINGS);

    const initialValues = settings.get();
    setColor(initialValues['testClientPlugin.iconColor']);
    setHeartbeat(initialValues['testClientPlugin.heartbeat']);
  }, []);

  useEffect(() => {
    const unsubColor = settings.subscribe('testClientPlugin.iconColor', ({ value }) => {
      setColor(value);
    });

    const unsubHeartbeat = settings.subscribe('testClientPlugin.heartbeat', ({ value }) => {
      setHeartbeat(value);
    });

    return () => {
      unsubColor();
      unsubHeartbeat();
    };
  }, []);

  useEffect(() => {
    subscribe('tab.saved', (event) => {
      console.log('[TestClient]', 'Tab saved', event.tab);
      setSaveCounter(prev => prev + 1);
    });

    subscribe('app.activeTabChanged', ({ activeTab }) => {
      setTabType(activeTab.type);
    });
  }, []);

  useEffect(() => {
    config.getForPlugin(PLUGIN_NAME, 'saveCounter', 0).then((value) => {
      console.log('[TestClient]', 'last session save counter:', value);
    });

    // cleanup for next session
    config.setForPlugin(PLUGIN_NAME, 'saveCounter', 0);
  }, []);

  useEffect(() => {
    config.setForPlugin(PLUGIN_NAME, 'saveCounter', saveCounter);
  }, [ saveCounter ]);

  return (
    <Fragment>
      <Fill slot="toolbar">
        Saved: { saveCounter }
      </Fill>

      {heartbeat && (
        <Fill slot="status-bar__file">
          <button
            type="button"
            onClick={ () => setShowModal(true) }
            className="btn"
            title="Just an icon (test-client plug-in contributed)"
            style={ { color: '#10ad73' } }>
            <TestIcon color={ color } />
          </button>
        </Fill>
      )}

      <Fill slot="status-bar__app" group="0_first">
        <div className="btn" style={ { background: '#10ad73', color: '#FEFEFE' } }>
          Saved: { saveCounter }
        </div>
      </Fill>

      {tabType === 'cloud-bpmn' && <Fill slot="bottom-panel" label="Cloud Plugin" id="cloudPlugin">
        <h1>Hello World</h1>
      </Fill>
      }

      {showModal && <CarbonModal onClose={ () => setShowModal(false) } />}
    </Fragment>
  );
}


function TestIcon({ color }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path fill={ color } fillRule="evenodd" d="M7.655 14.916L8 14.25l.345.666a.752.752 0 01-.69 0zm0 0L8 14.25l.345.666.002-.001.006-.003.018-.01a7.643 7.643 0 00.31-.17 22.08 22.08 0 003.433-2.414C13.956 10.731 16 8.35 16 5.5 16 2.836 13.914 1 11.75 1 10.203 1 8.847 1.802 8 3.02 7.153 1.802 5.797 1 4.25 1 2.086 1 0 2.836 0 5.5c0 2.85 2.045 5.231 3.885 6.818a22.075 22.075 0 003.744 2.584l.018.01.006.003h.002z"></path></svg>
  );
}
