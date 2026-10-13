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

import { act, fireEvent, render, screen, within } from '@testing-library/react';

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
    expect(screen.getByRole('heading', { name: /^Element template sources\s*Camunda 8 only/ })).to.exist;
    expect(screen.getByText('Fetch element templates from these sources, in addition to local templates.')).to.exist;
    expect(screen.getByRole('switch', { name: 'Camunda connectors' }).checked).to.be.true;
    expect(screen.queryByRole('checkbox', { name: /Disable Camunda connector templates/ })).not.to.exist;
  });


  [ [], [ { name: 'A', url: 'https://example.com/a', enabled: true }, { url: 'http://internal.example/b' } ] ].forEach(sources => {
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
      expect(screen.getAllByRole('switch')).to.have.length(sources.length + 1);
    });
  });


  it('should persist added and removed sources with a restart notice', async function() {

    // given
    const { settings, saved, reopen, restart } = await renderSettings({
      'app.customTemplateSources': [ { name: 'A', url: 'https://example.com/a', enabled: true } ]
    });
    await flushSave();

    // when
    fireEvent.click(screen.getByRole('button', { name: 'Add source' }));
    const dialog = screen.getAllByRole('dialog')[1];
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Name' }), { target: { value: 'B' } });
    fireEvent.change(within(dialog).getByRole('textbox', { name: /^Index URL/ }), { target: { value: 'http://internal.example/b' } });
    await flushSave();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add' }));

    // submit and save
    await flushSave();
    await flushSave();

    // then
    expect(screen.getAllByRole('dialog')).to.have.length(1);
    expect(settings.get('app.customTemplateSources')).to.eql([
      { name: 'A', url: 'https://example.com/a', enabled: true },
      { name: 'B', url: 'http://internal.example/b', enabled: true }
    ]);
    expect(saved).to.have.been.calledOnce;
    expect(screen.getByText(/Restart the modeler to apply/)).to.exist;
    expect(settings.get('app.disableConnectorTemplates')).to.be.false;

    // when
    fireEvent.click(screen.getByRole('button', { name: 'Options for A' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remove' }));
    await flushSave();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    act(reopen);
    await flushSave();

    // then
    const expected = [ { name: 'B', url: 'http://internal.example/b', enabled: true } ];
    expect(settings.get('app.customTemplateSources')).to.eql(expected);
    expect(saved).to.have.been.calledTwice;
    expect(saved.lastCall.args[1]).to.eql({ 'app.customTemplateSources': expected });
    expect(screen.getByRole('switch', { name: 'B' }).checked).to.be.true;

    // when
    fireEvent.click(screen.getByRole('button', { name: 'Restart now.' }));

    // then
    expect(restart).to.have.been.calledWith('restart-modeler');
  });


  it('should close only the add dialog on Escape', async function() {

    // given
    await renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Add source' }));
    expect(screen.getAllByRole('dialog')).to.have.length(2);

    // when
    fireEvent.keyDown(document, { key: 'Escape' });

    // then
    expect(screen.getAllByRole('dialog')).to.have.length(1);

    // when
    fireEvent.keyDown(document, { key: 'Escape' });

    // then
    expect(screen.queryByRole('dialog')).not.to.exist;
  });


  it('should toggle a custom source', async function() {

    // given
    const { settings } = await renderSettings({
      'app.customTemplateSources': [ { name: 'A', url: 'https://example.com/a', enabled: true } ]
    });

    // when
    fireEvent.click(screen.getByRole('switch', { name: 'A' }));
    await flushSave();

    // then
    expect(settings.get('app.customTemplateSources')).to.eql([
      { name: 'A', url: 'https://example.com/a', enabled: false }
    ]);
    expect(screen.getByText(/Restart the modeler to apply/)).to.exist;
  });


  [ false, true ].forEach(disabled => {
    it(`should toggle Camunda connectors (disabled=${ disabled })`, async function() {

      // given
      const { settings } = await renderSettings({ 'app.disableConnectorTemplates': disabled });
      const toggle = screen.getByRole('switch', { name: 'Camunda connectors' });
      expect(toggle.checked).to.equal(!disabled);

      // when
      fireEvent.click(toggle);
      await flushSave();

      // then
      expect(settings.get('app.disableConnectorTemplates')).to.equal(!disabled);
      expect(toggle.checked).to.equal(disabled);
      expect(screen.getByText(/Restart the modeler to apply/)).to.exist;
    });
  });


  [ true, false ].forEach(flag => {
    it(`should lock only Camunda connectors when flagged (${ flag })`, async function() {

      // given
      Flags.init({ 'disable-connector-templates': flag });
      const { settings, saved } = await renderSettings({
        'app.disableConnectorTemplates': !flag,
        'app.customTemplateSources': [ { name: 'A', url: 'https://example.com/a', enabled: true } ]
      });
      await flushSave();
      const toggle = screen.getByRole('switch', { name: 'Camunda connectors' });

      // then
      expect(toggle.disabled).to.be.true;
      expect(toggle.checked).to.equal(!flag);
      expect(screen.getByText('disable-connector-templates', { selector: 'code' })).to.exist;
      expect(saved).not.to.have.been.called;

      // when
      fireEvent.click(screen.getByRole('switch', { name: 'A' }));
      await flushSave();

      // then
      expect(settings.get('app.customTemplateSources')).to.eql([
        { name: 'A', url: 'https://example.com/a', enabled: false }
      ]);
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
