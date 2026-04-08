/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, {
  useCallback,
  useEffect,
  useState
} from 'react';

import { Close } from '@carbon/icons-react';

import { Overlay } from '../../shared/ui';

import * as css from './PanelToggleHint.less';


const CONFIG_KEY = 'hints';

const OVERLAY_OFFSET = { top: 10, right: 2 };

const ALLOWED_TAB_TYPES = [ 'cloud-bpmn', 'cloud-dmn', 'rpa', 'bpmn', 'dmn' ];


export function PanelToggleHint(props) {
  const {
    activeTab,
    anchor,
    config
  } = props;

  const tabType = activeTab && activeTab.type;

  const [ dismissed, setDismissed ] = useState(false);

  const dismiss = useCallback(async () => {
    if (dismissed) {
      return;
    }

    setDismissed(true);

    const oldConfig = await config.get(CONFIG_KEY);
    await config.set(CONFIG_KEY, { ...oldConfig, panelToggleDismissed: true });
  }, [ config, dismissed ]);

  useEffect(() => {
    async function fetchDismissed() {
      const hintConfig = await config.get(CONFIG_KEY);

      if (hintConfig && hintConfig.panelToggleDismissed) {
        setDismissed(true);
      }
    }

    fetchDismissed();
  }, [ config ]);

  useEffect(() => {
    if (!anchor || !ALLOWED_TAB_TYPES.includes(tabType)) {
      return;
    }

    const handleClick = () => dismiss();

    anchor.addEventListener('click', handleClick);

    return () => anchor.removeEventListener('click', handleClick);
  }, [ anchor, tabType, dismiss ]);

  if (dismissed || !ALLOWED_TAB_TYPES.includes(tabType) || !anchor) {
    return null;
  }

  return (
    <Overlay
      className={ css.PanelToggleHintOverlay }
      anchor={ anchor }
      offset={ OVERLAY_OFFSET }
      enableFocusTrap={ false }
      enableEscapeTrap={ false }
      enableGlobalClickTrap={ false }
      enableCloseTrap={ false }
      enableKeyboardTrap={ false }
    >
      <button
        className={ css.PanelToggleHintClose }
        onClick={ dismiss }
        aria-label="Close"
      >
        <Close size={ 16 } />
      </button>
      <Overlay.Title>
        { tabType === 'cloud-bpmn'
          ? 'Panel toggle buttons'
          : 'Panel toggle button'
        }
      </Overlay.Title>
      <Overlay.Body>
        <p>
          { tabType === 'cloud-bpmn'
            ? 'Toggle the Variables, Properties, and Test panels using these buttons.'
            : 'Toggle the Properties panel using this button.'
          }
        </p>
      </Overlay.Body>
    </Overlay>
  );
}
