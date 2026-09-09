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
import React from 'react';
import sinon from 'sinon';

import { act, fireEvent, render, screen } from '@testing-library/react';

import SettingsPlugin from '../SettingsPlugin';
import Settings from '../../../app/Settings';
import Flags from '../../../util/Flags';


describe('SettingsPlugin', function() {

  let clock;

  beforeEach(function() {
    clock = sinon.useFakeTimers({ toFake: [ 'setTimeout', 'clearTimeout', 'Date' ] });
    Flags.reset();
  });

  afterEach(function() {
    clock.restore();
    Flags.reset();
  });


  it('should render', async function() {

    // when
    await renderSettings();

    // then
    expect(screen.getByRole('dialog')).to.exist;
    expect(screen.getByText('Camunda 8 only')).to.exist;
    expect(screen.queryByLabelText('Disable connector templates')).not.to.exist;
  });


  [ [], [ 'https://example.com/a', 'http://internal.example/b' ] ].forEach(sources => {
    it(`should not save or require restart for unchanged sources (${ sources.length })`, async function() {

      // given
      const { saved, reopen } = await renderSettings({ 'app.customTemplateSources': sources });

      // when
      await flushSave();
      fireEvent.click(screen.getByRole('button', { name: 'Done' }));
      act(reopen);
      await flushSave();

      // then
      expect(saved).not.to.have.been.called;
      expect(screen.queryByText(/Restart the modeler to apply/)).not.to.exist;
      expect(screen.queryAllByRole('textbox').map(input => input.value)).to.eql(sources);
    });
  });


  it('should persist source edits and removals intact with a restart notice', async function() {

    // given
    const { settings, saved, reopen, restart } = await renderSettings({ 'app.customTemplateSources': [ 'https://example.com/a' ] });
    await flushSave();

    // when
    fireEvent.click(screen.getByRole('button', { name: 'Add source' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Source 2 URL' }), { target: { value: 'http://internal.example/b' } });
    await flushSave();

    // then
    expect(settings.get('app.customTemplateSources')).to.eql([ 'https://example.com/a', 'http://internal.example/b' ]);
    expect(saved).to.have.been.calledOnce;
    expect(screen.getByText(/Restart the modeler to apply/)).to.exist;
    expect(settings.get('app.disableConnectorTemplates')).to.be.false;

    // when
    fireEvent.click(screen.getByRole('button', { name: 'Remove source 1' }));
    await flushSave();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    act(reopen);
    await flushSave();

    // then
    expect(settings.get('app.customTemplateSources')).to.eql([ 'http://internal.example/b' ]);
    expect(saved).to.have.been.calledTwice;
    expect(screen.getByRole('textbox', { name: 'Source 1 URL' }).value).to.equal('http://internal.example/b');
    expect(saved.lastCall.args[1]).to.eql({ 'app.customTemplateSources': [ 'http://internal.example/b' ] });

    // when
    fireEvent.click(screen.getByRole('button', { name: 'Restart now.' }));

    // then
    expect(restart).to.have.been.calledWith('restart-modeler');
  });


  it('should preserve autosave of invalid URL drafts', async function() {

    // given
    const { settings } = await renderSettings();

    // when
    fireEvent.click(screen.getByRole('button', { name: 'Add source' }));
    await flushSave();

    // then
    expect(settings.get('app.customTemplateSources')).to.eql([ '' ]);
    expect(screen.getByText('Enter an HTTP(S) URL without credentials.')).to.exist;
    expect(screen.getByText(/Restart the modeler to apply/)).to.exist;
  });


  [ false, true ].forEach(disabled => {
    it(`should invert the OOTB setting (disabled=${ disabled })`, async function() {

      // given
      const { settings } = await renderSettings({ 'app.disableConnectorTemplates': disabled });
      const toggle = screen.getByRole('checkbox', { name: 'OOTB connector templates' });
      expect(toggle.checked).to.equal(!disabled);

      // when
      fireEvent.click(toggle);
      await flushSave();

      // then
      expect(settings.get('app.disableConnectorTemplates')).to.equal(!disabled);
      expect(toggle.checked).to.equal(disabled);
      expect(screen.getByRole('button', { name: 'Add source' }).disabled).to.be.false;
      expect(screen.getByText(/Restart the modeler to apply/)).to.exist;
    });
  });


  [ true, false ].forEach(flag => {
    it(`should lock only the OOTB toggle when flagged (${ flag })`, async function() {

      // given
      Flags.init({ 'disable-connector-templates': flag });
      const { settings, saved } = await renderSettings({ 'app.disableConnectorTemplates': !flag });
      await flushSave();
      const toggle = screen.getByRole('checkbox', { name: 'OOTB connector templates' });

      // then
      expect(toggle.disabled).to.be.true;
      expect(toggle.checked).to.equal(!flag);
      expect(screen.getByText('disable-connector-templates', { selector: 'code' })).to.exist;
      expect(saved).not.to.have.been.called;

      // when
      fireEvent.click(screen.getByRole('button', { name: 'Add source' }));
      fireEvent.change(screen.getByRole('textbox', { name: 'Source 1 URL' }), { target: { value: 'https://example.com/a' } });
      await flushSave();

      // then
      expect(settings.get('app.customTemplateSources')).to.eql([ 'https://example.com/a' ]);
      expect(saved.lastCall.args[1]['app.disableConnectorTemplates']).to.equal(!flag);
    });
  });


  async function flushSave() {
    await act(async () => {
      await clock.tickAsync(250);
    });
  }
});


// helpers //////////

const noop = () => {};

async function renderSettings(values = {}) {
  const saved = sinon.spy();
  const settings = new Settings({ config: { get: () => values, set: saved } });

  // Let the real Settings provider finish loading before the modal is opened.
  await Promise.resolve();

  let open;
  const subscribe = (_, cb) => {
    open = cb;
    return { cancel: noop };
  };
  const restart = sinon.spy();

  render(<SettingsPlugin
    subscribe={ subscribe }
    triggerAction={ restart }
    emit={ noop }
    _getGlobal={ () => settings }
  />);

  const reopen = () => open({});
  act(reopen);

  return { settings, saved, reopen, restart };
}
