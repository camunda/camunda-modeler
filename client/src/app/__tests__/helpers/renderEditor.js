/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* global sinon */

import React, { createRef } from 'react';

import { render, waitFor } from '@testing-library/react';

import { SlotFillRoot } from '../../slot-fill';
import Panel from '../../panel/Panel';

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

  const {
    rerender,
    ...renderResults
  } = render(
    <SlotFillRoot>
      <TestEditor ref={ ref } { ...props } />
      <Panel layout={ props.layout } />
    </SlotFillRoot>
  );

  if (props.waitForImport) {
    await waitFor(() => {
      expect(onImportSpy).to.have.been.called;
    });
  }

  return {
    ...renderResults,
    instance: ref.current,
    rerender: (newXML, newOptions = {}) => {
      rerender(
        <SlotFillRoot>
          <TestEditor
            ref={ ref }
            { ...props }
            xml={ newXML || xml }
            { ...newOptions }
          />
          <Panel layout={ props.layout } />
        </SlotFillRoot>
      );
    }
  };
}
