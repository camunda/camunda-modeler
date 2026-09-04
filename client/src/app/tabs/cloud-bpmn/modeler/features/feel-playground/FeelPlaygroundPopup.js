/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/** @jsx h */

// the properties panel renders this component with the preact instance it
// bundles; importing preact from anywhere else breaks hooks
import { h } from '@bpmn-io/properties-panel/preact';
import { useLayoutEffect, useRef } from '@bpmn-io/properties-panel/preact/hooks';

import {
  Popup,
  PopupBody,
  PopupTitle
} from '@bpmn-io/properties-panel';

import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

import FeelPlaygroundEditor from './FeelPlaygroundEditor';

const POPUP_WIDTH = 900;
const POPUP_HEIGHT = 640;

/**
 * Preact-to-React boundary for the FEEL playground popup.
 *
 * The popup chrome is rendered by the properties panel (preact), the playground
 * itself by a React root mounted into an otherwise empty container.
 *
 * @param {import('./FeelPlayground').default} feelPlayground
 */
export function createFeelPlaygroundPopup(feelPlayground) {

  return function FeelPlaygroundPopup(props) {
    const {
      element,
      entryId,
      feelLanguageContext,
      links = [],
      onClose,
      onInput,
      position,
      sourceElement,
      title,
      value = '',
      variables = []
    } = props;

    const containerRef = useRef();
    const rootRef = useRef();

    const isAutoCompletionOpen = useRef(false);

    useLayoutEffect(() => {
      const root = rootRef.current = createRoot(containerRef.current);

      return () => {
        rootRef.current = null;

        root.unmount();
      };
    }, []);

    useLayoutEffect(() => {

      // createElement, not JSX: this file compiles JSX to preact
      rootRef.current.render(createElement(FeelPlaygroundEditor, {
        contextKey: `${ element ? element.id : '' }#${ entryId }`,
        feelLanguageContext,
        feelPlayground,
        onInput,
        value,
        variables
      }));
    });

    const handleKeyDownCapture = (event) => {

      // capture, so we know the state before the editor handles the event
      if (event.key === 'Escape') {
        isAutoCompletionOpen.current = autoCompletionOpen(event.target);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isAutoCompletionOpen.current) {
        onClose();
      }
    };

    const handleReturnFocus = () => {
      sourceElement && sourceElement.focus();
    };

    return (
      <Popup
        className="bio-properties-panel-feel-popup feel-playground-popup"
        position={ position }
        title={ title }
        returnFocus={ false }
        closeOnEscape={ false }
        delayInitialFocus={ false }
        allowFocusMove={ (event) => !isSnippetNavigation(event) }
        onPostDeactivate={ handleReturnFocus }
        onClose={ onClose }
        width={ POPUP_WIDTH }
        height={ POPUP_HEIGHT }
      >
        <PopupTitle
          title={ title }
          showCloseButton
          closeButtonTooltip="Save and close"
          onClose={ onClose }
          draggable
        >
          {links.map((link, index) => (
            <a
              key={ index }
              rel="noreferrer"
              href={ link.href }
              target="_blank"
              class="bio-properties-panel-feel-popup__title-link"
            >
              {link.title}
              <LaunchIcon />
            </a>
          ))}
        </PopupTitle>
        <PopupBody
          onKeyDownCapture={ handleKeyDownCapture }
          onKeyDown={ handleKeyDown }
          className="feel-playground-popup__body"
        >
          <div class="feel-playground-popup__content" ref={ containerRef } />
        </PopupBody>
      </Popup>
    );
  };
}


// helpers //////////

// inlined, as the modeler icons are React components
function LaunchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
      <path d="M26,28H6a2.0027,2.0027,0,0,1-2-2V6A2.0027,2.0027,0,0,1,6,4H16V6H6V26H26V16h2V26A2.0027,2.0027,0,0,1,26,28Z" />
      <polygon points="20 2 20 4 26.586 4 18 12.586 19.414 14 28 5.414 28 12 30 12 30 2 20 2" />
    </svg>
  );
}

function autoCompletionOpen(element) {
  const editor = element.closest('.cm-editor');

  return editor ? editor.querySelector('.cm-tooltip-autocomplete') : null;
}

// while a snippet is active, Tab navigates its placeholders inside the editor
export function isSnippetNavigation(event) {
  const editor = event.target.closest('.cm-editor');

  return !!(editor && editor.querySelector('.cm-snippetField'));
}
