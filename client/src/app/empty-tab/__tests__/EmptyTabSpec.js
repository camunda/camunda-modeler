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
import React from 'react';

import { act, fireEvent, render, within } from '@testing-library/react';

import EmptyTab from '../EmptyTab';
import { EventsContext } from '../../EventsContext';
import Settings from '../../Settings';
import TabsProvider from '../../TabsProvider';

import Flags, { DISABLE_DMN, DISABLE_FORM, DISABLE_ZEEBE, DISABLE_PLATFORM } from '../../../util/Flags';

import {
  schema,
  SETTINGS_KEY_START_PAGE_PREFERRED_ENGINE
} from '../../../plugins/settings/useBuiltInSettings';

import { DEFAULT_ENDPOINT } from '../../../plugins/zeebe-plugin/connection-manager-plugin/ConnectionManagerPlugin';

import {
  CONNECTION_MANAGER_PLUGIN_ID,
  SETTINGS_KEY_CONNECTIONS
} from '../../../plugins/zeebe-plugin/connection-manager-plugin/ConnectionManagerSettings';

import { DELAYS } from '../../../plugins/zeebe-plugin/deployment-plugin/ConnectionChecker';


describe('<EmptyTab>', function() {

  afterEach(sinon.restore);


  describe('dispatching action', function() {

    it('should dispatch create-* actions for Camunda 8', function() {

      // given
      const onAction = sinon.spy();

      const { getByTestId } = createEmptyTab({ onAction });

      const buttons = within(getByTestId('welcome-page-cloud')).getAllByRole('button');

      // when
      buttons.forEach(btn => btn.click());

      // then
      expect(onAction.args).to.eql([
        [ 'create-cloud-bpmn-diagram', undefined ],
        [ 'create-cloud-dmn-diagram', undefined ],
        [ 'create-cloud-form', undefined ],
        [ 'create-diagram', { type: 'rpa' } ]
      ]);
    });


    it('should dispatch create-* actions for Camunda 7', function() {

      // given
      const onAction = sinon.spy();

      const settings = createSettings({ [ SETTINGS_KEY_START_PAGE_PREFERRED_ENGINE ]: '7' });

      const { getByTestId } = createEmptyTab({ onAction, settings });

      const buttons = within(getByTestId('welcome-page-platform')).getAllByRole('button');

      // when
      buttons.forEach(btn => btn.click());

      // then
      expect(onAction.args).to.eql([
        [ 'create-bpmn-diagram', undefined ],
        [ 'create-dmn-diagram', undefined ],
        [ 'create-form', undefined ]
      ]);
    });

  });


  describe('disabling dmn', function() {

    it('should NOT display dmn diagram on flag', function() {

      // given
      stubFlags({ [ DISABLE_DMN ]: true });

      // when
      const { queryAllByText } = createEmptyTab();

      // then
      expect(queryAllByText('DMN diagram')).to.be.empty;
    });


    it('should display dmn diagram without flag', function() {

      // when
      const { queryAllByText } = createEmptyTab();

      // then
      expect(queryAllByText('DMN diagram')).to.have.length(1);
    });

  });


  describe('disabling form', function() {

    it('should NOT display form on flag', function() {

      // given
      stubFlags({ [ DISABLE_FORM ]: true });

      // when
      const { queryAllByText } = createEmptyTab();

      // then
      expect(queryAllByText('Form')).to.be.empty;
    });


    it('should display form without flag', function() {

      // when
      const { queryAllByText } = createEmptyTab();

      // then
      expect(queryAllByText('Form')).to.have.length(1);
    });


    it('should NOT offer the blueprint project on flag', function() {

      // given
      stubFlags({ [ DISABLE_FORM ]: true });

      // when
      const { queryByRole } = createEmptyTab();

      // then
      expect(queryByRole('button', { name: 'Create blueprint project' })).not.to.exist;
    });

  });


  describe('disabling platform', function() {

    it('should offer Camunda 7 without flag', function() {

      // when
      const { queryByRole } = createEmptyTab();

      // then
      expect(queryByRole('radio', { name: 'Camunda 7' })).to.exist;
    });


    it('should NOT offer Camunda 7 with flag', function() {

      // given
      stubFlags({ [ DISABLE_PLATFORM ]: true });

      // when
      const { queryByRole, queryByTestId } = createEmptyTab();

      // then
      expect(queryByRole('radio', { name: 'Camunda 7' })).not.to.exist;
      expect(queryByTestId('welcome-page-platform')).not.to.exist;
    });

  });


  describe('disabling zeebe', function() {

    it('should display Camunda 8 without flag', function() {

      // when
      const { queryByTestId } = createEmptyTab();

      // then
      expect(queryByTestId('welcome-page-cloud')).to.exist;
    });


    it('should display only Camunda 7 with flag', function() {

      // given
      stubFlags({ [ DISABLE_ZEEBE ]: true });

      // when
      const { queryByTestId, queryByRole } = createEmptyTab();

      // then
      expect(queryByTestId('welcome-page-cloud')).not.to.exist;
      expect(queryByTestId('welcome-page-platform')).to.exist;
      expect(queryByRole('radio', { name: 'Camunda 7' })).not.to.exist;
    });


    it('should NOT offer to run Camunda locally with flag', function() {

      // given
      stubFlags({ [ DISABLE_ZEEBE ]: true });

      // when
      const { queryByRole } = createEmptyTab();

      // then
      expect(queryByRole('region', { name: 'Local environment' })).not.to.exist;
    });


    it('should show only Camunda 7 resources with flag', function() {

      // given
      stubFlags({ [ DISABLE_ZEEBE ]: true });

      // when
      const { getByRole } = createEmptyTab();

      // then
      const links = within(getByRole('navigation', { name: 'Learn more' })).getAllByRole('link');

      expect(links.map(link => link.textContent)).to.eql([
        'Model your first diagram',
        'Migrate from Camunda 7'
      ]);
    });

  });


  describe('Camunda 7 switch', function() {

    it('should show Camunda 8 by default', function() {

      // when
      const { getByRole, queryByTestId } = createEmptyTab();

      // then
      expect(getByRole('radio', { name: 'Camunda 8' }).getAttribute('aria-checked')).to.eql('true');
      expect(queryByTestId('welcome-page-platform')).not.to.exist;
    });


    it('should show Camunda 7 if preferred', function() {

      // given
      const settings = createSettings({ [ SETTINGS_KEY_START_PAGE_PREFERRED_ENGINE ]: '7' });

      // when
      const { queryByTestId } = createEmptyTab({ settings });

      // then
      expect(queryByTestId('welcome-page-platform')).to.exist;
      expect(queryByTestId('welcome-page-cloud')).not.to.exist;
    });


    it('should remember switching to Camunda 7', function() {

      // given
      const settings = createSettings();

      const { getByRole } = createEmptyTab({ settings });

      // when
      fireEvent.click(getByRole('radio', { name: 'Camunda 7' }));

      // then
      expect(settings.get(SETTINGS_KEY_START_PAGE_PREFERRED_ENGINE)).to.eql('7');
    });

  });


  describe('running Camunda locally', function() {

    let clock;

    beforeEach(function() {

      // excludes requestAnimationFrame used by React
      clock = sinon.useFakeTimers({
        toFake: [ 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval' ]
      });
    });

    afterEach(function() {
      clock.restore();
    });

    function waitForCheck(ms = DELAYS.SHORT) {
      return act(() => clock.tickAsync(ms));
    }


    it('should offer to set up Camunda locally', async function() {

      // given
      const { getByRole } = createEmptyTab();

      // when
      await waitForCheck();

      // then
      expect(getByRole('button', { name: 'Set up with c8ctl' })).to.exist;
    });


    it('should explain c8ctl if Camunda is not running', async function() {

      // given
      const { getByRole } = createEmptyTab();

      // when
      await waitForCheck();

      // then
      expect(getByRole('link', { name: 'What is c8ctl?' }).getAttribute('href')).to.include('docs.camunda.io/docs/apis-tools/c8ctl');
    });


    it('should show setup commands', async function() {

      // given
      const { getByRole } = createEmptyTab();

      await waitForCheck();

      // when
      fireEvent.click(getByRole('button', { name: 'Set up with c8ctl' }));

      // then
      expect(within(getByRole('dialog')).getByText('c8ctl cluster start')).to.exist;
    });


    it('should show that Camunda is running locally', async function() {

      // given
      const zeebeApi = {
        checkConnection: sinon.stub().resolves({ success: true, response: { gatewayVersion: '8.10.6' } })
      };

      const { getByText, getByTestId } = createEmptyTab({ zeebeApi });

      // when
      await waitForCheck();

      // then
      expect(getByText(/Camunda 8\.10\.6 is running on your machine\./)).to.exist;
      expect(getByTestId('welcome-local-status').textContent).to.eql('Running');
    });


    it('should show that Camunda is not running locally', async function() {

      // given
      const { getByText } = createEmptyTab();

      // when
      await waitForCheck();

      // then
      expect(getByText('Not running')).to.exist;
    });


    it('should show that the local status is checked', function() {

      // when
      const { getByTestId } = createEmptyTab();

      // then
      expect(getByTestId('welcome-local-status').textContent).to.eql('Checking');
    });


    it('should announce the local status', async function() {

      // given
      const zeebeApi = {
        checkConnection: sinon.stub().resolves({ success: true, response: { gatewayVersion: '8.10.6' } })
      };

      const { getByRole } = createEmptyTab({ zeebeApi });

      // when
      await waitForCheck();

      // then
      expect(getByRole('status').textContent).to.eql('Running');
    });


    it('should check the c8run connection of the user', async function() {

      // given
      const endpoint = {
        ...DEFAULT_ENDPOINT,
        id: 'user-c8run',
        operateUrl: 'http://localhost:8080/custom-operate'
      };

      const zeebeApi = {
        checkConnection: sinon.stub().resolves({ success: true, response: { gatewayVersion: '8.10.6' } })
      };

      const { getByRole } = createEmptyTab({
        deployment: { getDefaultEndpoint: () => endpoint },
        zeebeApi
      });

      // when
      await waitForCheck();

      // then
      expect(getByRole('link', { name: 'Open Operate' }).getAttribute('href')).to.eql('http://localhost:8080/custom-operate');
      expect(zeebeApi.checkConnection).to.have.been.calledWith(endpoint);
    });


    it('should check the default endpoint without a c8run connection', async function() {

      // given
      const zeebeApi = {
        checkConnection: sinon.stub().resolves({ success: false })
      };

      createEmptyTab({
        deployment: { getDefaultEndpoint: () => null },
        zeebeApi
      });

      // when
      await waitForCheck();

      // then
      expect(zeebeApi.checkConnection).to.have.been.calledWith(DEFAULT_ENDPOINT);
    });


    it('should check again when the connections are loaded', async function() {

      // given
      const endpoint = {
        ...DEFAULT_ENDPOINT,
        id: 'user-c8run'
      };

      const zeebeApi = {
        checkConnection: sinon.stub().resolves({ success: false })
      };

      const settings = createSettings();

      createEmptyTab({
        deployment: { getDefaultEndpoint: () => endpoint },
        settings,
        zeebeApi
      });

      await waitForCheck();

      zeebeApi.checkConnection.resetHistory();

      // when
      act(() => {
        settings.register({
          id: CONNECTION_MANAGER_PLUGIN_ID,
          properties: {
            [ SETTINGS_KEY_CONNECTIONS ]: { type: 'custom' }
          }
        });
      });

      await waitForCheck();

      // then
      expect(zeebeApi.checkConnection).to.have.been.calledOnceWith(endpoint);
    });


    it('should notice that Camunda stopped', async function() {

      // given
      const zeebeApi = {
        checkConnection: sinon.stub()
      };

      zeebeApi.checkConnection.resolves({ success: false });
      zeebeApi.checkConnection.onFirstCall().resolves({ success: true, response: { gatewayVersion: '8.10.6' } });

      const { getByTestId } = createEmptyTab({ zeebeApi });

      await waitForCheck();

      // when
      await waitForCheck(DELAYS.LONG);

      // then
      expect(getByTestId('welcome-local-status').textContent).to.eql('Not running');
    });

  });


  describe('header', function() {

    it('should open a file', function() {

      // given
      const onAction = sinon.spy();

      const { getByRole } = createEmptyTab({ onAction });

      // when
      fireEvent.click(getByRole('button', { name: 'Open file' }));

      // then
      expect(onAction).to.have.been.calledOnceWith('open-diagram');
    });


    it('should open a file with recent files', async function() {

      // given
      const onAction = sinon.spy();

      const recentTabs = [ { file: { name: 'a.bpmn', path: '/a.bpmn' } } ];

      const { getByRole, findByRole } = createEmptyTab({ onAction, recentTabs });

      await findByRole('button', { name: 'Open recent file' });

      // when
      fireEvent.click(getByRole('button', { name: 'Open file' }));

      // then
      expect(onAction).to.have.been.calledOnceWith('open-diagram');
    });


    it('should NOT offer recent files without any', async function() {

      // given
      const { queryByRole } = createEmptyTab({ recentTabs: [] });

      // when
      await act(async () => {});

      // then
      expect(queryByRole('button', { name: 'Open recent file' })).not.to.exist;
    });


    it('should list recent files, newest first', async function() {

      // given
      const recentTabs = [
        { file: { name: 'a.bpmn', path: '/a.bpmn' } },
        { file: { name: 'unsaved.bpmn', path: null } },
        { file: { name: 'b.dmn', path: '/b.dmn' } }
      ];

      const { findByRole, findAllByRole } = createEmptyTab({ recentTabs });

      // when
      openDropdown(await findByRole('button', { name: 'Open recent file' }));

      // then
      const items = await findAllByRole('menuitem');

      expect(items.map(item => item.getAttribute('title'))).to.eql([ '/b.dmn', '/a.bpmn' ]);
    });


    it('should title the recent files', async function() {

      // given
      const recentTabs = [ { file: { name: 'a.bpmn', path: '/a.bpmn' } } ];

      const { findByRole, findByText } = createEmptyTab({ recentTabs });

      // when
      openDropdown(await findByRole('button', { name: 'Open recent file' }));

      // then
      expect(await findByText('Recent files')).to.exist;
    });


    it('should open a recent file', async function() {

      // given
      const onAction = sinon.spy();

      const recentTabs = [ { file: { name: 'a.bpmn', path: '/a.bpmn' } } ];

      const { findByRole } = createEmptyTab({ onAction, recentTabs });

      openDropdown(await findByRole('button', { name: 'Open recent file' }));

      // when
      fireEvent.click(await findByRole('menuitem'));

      // then
      expect(onAction).to.have.been.calledOnceWith('open-diagram', { path: '/a.bpmn' });
    });


    it('should update recent files on <app.recentTabsChanged>', async function() {

      // given
      const recentTabs = [ { file: { name: 'a.bpmn', path: '/a.bpmn' } } ];

      const eventsContext = createEventsContext();

      const { findByRole, findAllByRole } = createEmptyTab({ eventsContext, recentTabs });

      await findByRole('button', { name: 'Open recent file' });

      // when
      act(() => {
        eventsContext.emit('app.recentTabsChanged', {
          recentTabs: [
            ...recentTabs,
            { file: { name: 'b.bpmn', path: '/b.bpmn' } }
          ]
        });
      });

      // then
      openDropdown(await findByRole('button', { name: 'Open recent file' }));

      const items = await findAllByRole('menuitem');

      expect(items.map(item => item.getAttribute('title'))).to.eql([ '/b.bpmn', '/a.bpmn' ]);
    });

  });


  describe('promotion', function() {

    it('should explain that the blueprint project needs a folder', async function() {

      // given
      const { getByRole, findByRole } = createEmptyTab();

      // when
      act(() => getByRole('button', { name: 'Create blueprint project' }).focus());

      // then
      expect((await findByRole('tooltip')).textContent).to.include('Saves the blueprint files to a folder you choose, and the blueprint opens as a project.');
    });


    it('should promote building an AI agent', function() {

      // when
      const { getByRole } = createEmptyTab();

      // then
      expect(getByRole('region', { name: 'Build your first AI agent' })).to.exist;
    });


    it('should open the AI agent blueprint as a project', function() {

      // given
      const emit = sinon.spy();

      const { getByRole } = createEmptyTab({ emit });

      // when
      fireEvent.click(getByRole('button', { name: 'Create blueprint project' }));

      // then
      expect(emit).to.have.been.calledWith('create-camunda-project', sinon.match({
        title: 'Create Project from AI Agent Chat Quick Start',
        files: [
          sinon.match({ name: 'ai-agent-chat-with-tools.bpmn' }),
          sinon.match({ name: 'ai-agent-chat-initial-request.form' }),
          sinon.match({ name: 'ai-agent-chat-user-feedback.form' })
        ]
      }));
    });

  });


  function createEmptyTab(options = {}) {
    const tabsProvider = new TabsProvider();

    return render(
      <React.StrictMode>
        <EventsContext.Provider value={ options.eventsContext || createEventsContext() }>
          <EmptyTab
            emit={ options.emit || sinon.fake() }
            onAction={ options.onAction || sinon.fake() }
            onShown={ options.onShown || sinon.fake() }
            settings={ options.settings || createSettings() }
            tabsProvider={ tabsProvider }
            deployment={ options.deployment }
            config={ createConfig({ recentTabs: options.recentTabs }) }
            zeebeApi={ options.zeebeApi || { checkConnection: sinon.stub().resolves({ success: false }) } }
          />
        </EventsContext.Provider>
      </React.StrictMode>
    );
  }
});


// helpers //////////

function createSettings(values = {}) {
  const settings = new Settings({
    config: {
      get: async () => ({}),
      set() {}
    }
  });

  settings.register(schema);
  settings.set(values);

  return settings;
}

function stubFlags(flags) {
  sinon.stub(Flags, 'get').callsFake(name => flags[name]);
}

function createConfig(values = {}) {
  return {
    get: async key => values[key] ?? null
  };
}

function createEventsContext() {
  const listeners = {};

  return {
    subscribe(event, listener) {
      (listeners[ event ] = listeners[ event ] || []).push(listener);

      return {
        cancel: () => listeners[ event ] = listeners[ event ].filter(l => l !== listener)
      };
    },
    emit(event, payload) {
      (listeners[ event ] || []).forEach(listener => listener(payload));
    }
  };
}

function openDropdown(trigger) {
  fireEvent.keyDown(trigger, { key: 'Enter' });
}
