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

import { fireEvent, render, waitFor, within } from '@testing-library/react';

import EmptyTab from '../EmptyTab';
import Settings from '../Settings';
import TabsProvider from '../TabsProvider';

import Flags, { DISABLE_DMN, DISABLE_FORM, DISABLE_ZEEBE, DISABLE_PLATFORM } from '../../util/Flags';

import {
  schema,
  SETTINGS_KEY_PREFER_CAMUNDA_7
} from '../../plugins/settings/useBuiltInSettings';


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

      const settings = createSettings({ [ SETTINGS_KEY_PREFER_CAMUNDA_7 ]: true });

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
      const settings = createSettings({ [ SETTINGS_KEY_PREFER_CAMUNDA_7 ]: true });

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
      expect(settings.get(SETTINGS_KEY_PREFER_CAMUNDA_7)).to.be.true;
    });


    it('should NOT offer the switch if set by flag', function() {

      // given
      stubFlags({ 'prefer-camunda-7': false });

      // when
      const { queryByRole } = createEmptyTab();

      // then
      expect(queryByRole('radio', { name: 'Camunda 7' })).not.to.exist;
    });

  });


  describe('running Camunda locally', function() {

    it('should offer to set up Camunda locally', function() {

      // when
      const { queryByRole } = createEmptyTab();

      // then
      expect(queryByRole('button', { name: 'Set up with c8ctl' })).to.exist;
    });


    it('should explain c8ctl if Camunda is not running', function() {

      // when
      const { getByRole } = createEmptyTab();

      // then
      expect(getByRole('link', { name: 'What is c8ctl?' }).getAttribute('href')).to.include('docs.camunda.io/docs/apis-tools/c8ctl');
    });


    it('should show setup commands', function() {

      // given
      const { getByRole } = createEmptyTab();

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

      // when
      const { findByText, getByTestId } = createEmptyTab({ zeebeApi });

      // then
      expect(await findByText(/Camunda 8\.10\.6 is running on your machine\./)).to.exist;
      expect(getByTestId('welcome-local-status').textContent).to.eql('Running');
    });


    it('should show that Camunda is not running locally', function() {

      // when
      const { getByTestId } = createEmptyTab();

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


    it('should open a file with recent files', function() {

      // given
      const onAction = sinon.spy();

      const recentTabs = [ { file: { name: 'a.bpmn', path: '/a.bpmn' } } ];

      const { getByRole } = createEmptyTab({ onAction, recentTabs });

      // when
      fireEvent.click(getByRole('button', { name: 'Open file' }));

      // then
      expect(onAction).to.have.been.calledOnceWith('open-diagram');
    });


    it('should NOT offer recent files without any', function() {

      // when
      const { queryByRole } = createEmptyTab({ recentTabs: [] });

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

      const { getByRole, findAllByRole } = createEmptyTab({ recentTabs });

      // when
      openDropdown(getByRole('button', { name: 'Open recent file' }));

      // then
      const items = await findAllByRole('menuitem');

      expect(items.map(item => item.getAttribute('title'))).to.eql([ '/b.dmn', '/a.bpmn' ]);
    });


    it('should title the recent files', async function() {

      // given
      const recentTabs = [ { file: { name: 'a.bpmn', path: '/a.bpmn' } } ];

      const { getByRole, findByText } = createEmptyTab({ recentTabs });

      // when
      openDropdown(getByRole('button', { name: 'Open recent file' }));

      // then
      expect(await findByText('Recent files')).to.exist;
    });


    it('should open a recent file', async function() {

      // given
      const onAction = sinon.spy();

      const recentTabs = [ { file: { name: 'a.bpmn', path: '/a.bpmn' } } ];

      const { getByRole, findByRole } = createEmptyTab({ onAction, recentTabs });

      openDropdown(getByRole('button', { name: 'Open recent file' }));

      // when
      fireEvent.click(await findByRole('menuitem'));

      // then
      expect(onAction).to.have.been.calledOnceWith('open-diagram', { path: '/a.bpmn' });
    });

  });


  describe('promotion', function() {

    it('should promote building an AI agent', function() {

      // when
      const { getByRole } = createEmptyTab();

      // then
      expect(getByRole('region', { name: 'Build your first AI agent' })).to.exist;
    });


    it('should open the AI agent blueprint as unsaved files', async function() {

      // given
      const onAction = sinon.stub().resolves();

      const { getByRole } = createEmptyTab({ onAction });

      // when
      fireEvent.click(getByRole('button', { name: 'Start from blueprint' }));

      // then
      await waitFor(() => {
        expect(onAction).to.have.been.calledWith('open-unsaved-files', sinon.match({
          files: [
            sinon.match({ name: 'ai-agent-chat-with-tools.bpmn' }),
            sinon.match({ name: 'ai-agent-chat-initial-request.form' }),
            sinon.match({ name: 'ai-agent-chat-user-feedback.form' })
          ]
        }));
      });
    });


    it('should explain how to run the AI agent blueprint', async function() {

      // given
      const onAction = sinon.stub().resolves();

      const { getByRole } = createEmptyTab({ onAction });

      // when
      fireEvent.click(getByRole('button', { name: 'Start from blueprint' }));

      // then
      await waitFor(() => {
        expect(onAction).to.have.been.calledWith('display-notification', sinon.match({
          title: 'Opened AI Agent Chat Quick Start'
        }));
      });
    });

  });


  function createEmptyTab(options = {}) {
    const tabsProvider = new TabsProvider();

    return render(
      <React.StrictMode>
        <EmptyTab
          emit={ options.emit || sinon.fake() }
          onAction={ options.onAction || sinon.fake() }
          onShown={ options.onShown || sinon.fake() }
          settings={ options.settings || createSettings() }
          tabsProvider={ tabsProvider }
          recentTabs={ options.recentTabs }
          zeebeApi={ options.zeebeApi || { checkConnection: sinon.stub().resolves({ success: false }) } }
        />
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

function openDropdown(trigger) {
  fireEvent.keyDown(trigger, { key: 'Enter' });
}
