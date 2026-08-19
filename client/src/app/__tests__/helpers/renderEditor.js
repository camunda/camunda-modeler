/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';

import React, { createRef } from 'react';

import EventEmitter from 'events';

import { render, waitFor } from '@testing-library/react';

import { SlotFillRoot } from '../../slot-fill';
import Panel from '../../panel/Panel';

import { EventsContext } from '../../EventsContext';

import { WithCachedState } from '../../cached';
import Cache from '../../cached/Cache';

import { Settings, Config } from '../mocks';


function noop() { }

export default async function renderEditor(EditorComponent, xml, options = {}) {

  const onImportSpy = sinon.spy(options.onImport || (() => { }));

  const defaultLayout = {
    minimap: {
      open: false
    },
    propertiesPanel: {},
    sidePanel: {
      open: true,
      tab: 'properties'
    }
  };

  const props = {
    cache: new Cache(),
    config: new Config(),
    emit: noop,
    getConfig: noop,
    getPlugins: () => [],
    id: 'editor',
    isNew: true,
    layout: defaultLayout,
    linting: [],
    onAction: noop,
    onChanged: noop,
    onContentUpdated: noop,
    onError: noop,
    onLayoutChanged: noop,
    onModal: noop,
    onWarning: noop,
    settings: new Settings(),
    waitForImport: true,
    xml: xml,
    ...options,
    onImport: onImportSpy,
  };

  const ref = createRef(null);

  const TestEditor = WithCachedState(EditorComponent);

  const eventBus = options.eventBus || new EventEmitter();

  const eventsContext = {
    subscribe: (event, listener) => {
      eventBus.on(event, listener);

      return {
        cancel: () => eventBus.off(event, listener)
      };
    }
  };

  const {
    rerender,
    ...renderResults
  } = render(
    <EventsContext.Provider value={ eventsContext }>
      <SlotFillRoot>
        <TestEditor ref={ ref } { ...props } />
        <Panel layout={ props.layout } />
      </SlotFillRoot>
    </EventsContext.Provider>
  );

  if (props.waitForImport) {
    await waitFor(() => {
      expect(onImportSpy).to.have.been.called;
    });
  }

  return {
    ...renderResults,
    instance: ref.current,
    emit: (event, ...args) => eventBus.emit(event, ...args),
    rerender: (newXML, newOptions = {}) => {
      rerender(
        <EventsContext.Provider value={ eventsContext }>
          <SlotFillRoot>
            <TestEditor
              ref={ ref }
              { ...props }
              xml={ newXML || xml }
              { ...newOptions }
            />
            <Panel layout={ props.layout } />
          </SlotFillRoot>
        </EventsContext.Provider>
      );
    }
  };
}
