/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import { Formik } from 'formik';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { TemplateSources } from '../ElementTemplatesSettings';
import { SettingsForm } from '../SettingsForm';
import Flags from '../../../util/Flags';


describe('TemplateSources', function() {

  afterEach(function() {
    Flags.reset();
  });


  it('should list Camunda connectors and custom sources', function() {

    // when
    renderSources({
      disableConnectorTemplates: true,
      customTemplateSources: [
        { name: 'Team', url: 'https://example.com/team', enabled: true },
        { name: 'Disabled', url: 'https://example.com/disabled', enabled: false },
        { url: 'https://example.com/unnamed' }
      ]
    });

    // then
    const items = screen.getAllByRole('listitem');

    expect(items.map(item => [
      item.querySelector('.settings-list-item__name').firstChild.textContent,
      item.querySelector('.settings-list-item__description').textContent
    ])).to.eql([
      [ 'Camunda connectors', 'Camunda Marketplace' ],
      [ 'Team', 'https://example.com/team' ],
      [ 'Disabled', 'https://example.com/disabled' ],
      [ 'https://example.com/unnamed', 'https://example.com/unnamed' ]
    ]);
    expect(getSwitches()).to.eql({
      'Camunda connectors': false,
      'Team': true,
      'Disabled': false,
      'https://example.com/unnamed': true
    });
    expect(screen.queryByRole('button', { name: 'Options for Camunda connectors' })).not.to.exist;
    expect(screen.getAllByRole('button', { name: /^Options for / })).to.have.length(3);
  });


  [ true, false ].forEach(disabled => {
    it(`should toggle Camunda connectors (disabled=${ disabled })`, async function() {

      // given
      const { getValues } = renderSources({ disableConnectorTemplates: disabled, customTemplateSources: [] });

      // when
      fireEvent.click(screen.getByRole('switch', { name: 'Camunda connectors' }));

      // then
      await waitFor(() => expect(getValues().disableConnectorTemplates).to.equal(!disabled));
      expect(getValues().customTemplateSources).to.eql([]);
    });
  });


  it('should lock Camunda connectors when overridden by flag', function() {

    // given
    Flags.init({ 'disable-connector-templates': true });

    // when
    renderSources({ disableConnectorTemplates: true, customTemplateSources: [] });

    // then
    expect(screen.getByRole('switch', { name: 'Camunda connectors' }).disabled).to.be.true;
    expect(screen.getByText('disable-connector-templates', { selector: 'code' })).to.exist;
    expect(screen.getByRole('button', { name: 'Add source' }).disabled).to.be.false;
  });


  it('should toggle a custom source', async function() {

    // given
    const { getValues } = renderSources({
      customTemplateSources: [
        { name: 'Team', url: 'https://example.com/team', enabled: true, extra: 'kept' },
        { url: 'https://example.com/unnamed' }
      ]
    });

    // when
    fireEvent.click(screen.getByRole('switch', { name: 'Team' }));
    fireEvent.click(screen.getByRole('switch', { name: 'https://example.com/unnamed' }));

    // then
    await waitFor(() => expect(getValues().customTemplateSources).to.eql([
      { name: 'Team', url: 'https://example.com/team', enabled: false, extra: 'kept' },
      { url: 'https://example.com/unnamed', enabled: false }
    ]));
    expect(getValues().disableConnectorTemplates).not.to.exist;
  });


  it('should remove a custom source', async function() {

    // given
    const { getValues, onSubmit } = renderSources({
      customTemplateSources: [
        { name: 'A', url: 'https://example.com/a' },
        { name: 'B', url: 'https://example.com/b' }
      ]
    });

    // when
    selectAction('A', 'Remove');

    // then
    await waitFor(() => expect(getValues().customTemplateSources).to.eql([
      { name: 'B', url: 'https://example.com/b' }
    ]));
    expect(document.activeElement === screen.getByRole('button', { name: 'Add source' }), 'focus moved').to.be.true;
    expect(onSubmit).not.to.have.been.called;
  });


  it('should render invalid entries without echoing them', function() {

    // when
    const { getValues } = renderSources({
      customTemplateSources: [
        null,
        42,
        { name: 'Secret', url: 'https://user:secret@example.com/index' },
        { url: 'ftp://example.com/index' },
        'https://example.com/string'
      ]
    });

    // then
    expect(screen.getAllByText('Invalid source, it is ignored.')).to.have.length(5);
    expect(screen.getByRole('button', { name: 'Options for Secret' })).to.exist;
    expect(screen.getByRole('button', { name: 'Options for Invalid source 1' })).to.exist;
    expect(screen.getAllByRole('switch')).to.have.length(1);
    expect(document.body.textContent).not.to.include('secret@');
    expect(document.body.textContent).not.to.include('ftp://');
    expect(screen.getAllByRole('button', { name: /^Options for / })).to.have.length(5);
    expect(getValues().customTemplateSources).to.have.length(5);
  });


  [ null, {}, 'invalid list' ].forEach(value => {
    it(`should replace a malformed list only on add (${ JSON.stringify(value) })`, async function() {

      // given
      const { getValues } = renderSources({ customTemplateSources: value });
      expect(screen.getAllByRole('listitem')).to.have.length(1);
      expect(getValues().customTemplateSources).to.eql(value);

      // when
      addSource('Team', 'https://example.com/team');

      // then
      await waitFor(() => expect(getValues().customTemplateSources).to.eql([
        { name: 'Team', url: 'https://example.com/team', enabled: true }
      ]));
    });
  });


  describe('add dialog', function() {

    it('should add an enabled, normalized source', async function() {

      // given
      const { getValues, onSubmit } = renderSources({
        customTemplateSources: [ { name: 'A', url: 'https://example.com/a', enabled: false } ]
      });

      // when
      fireEvent.click(screen.getByRole('button', { name: 'Add source' }));

      // then
      const dialog = getDialog();
      expect(within(dialog).getByRole('heading').textContent).to.equal('Add element template source');
      expect(document.activeElement === within(dialog).getByRole('textbox', { name: 'Name' }), 'name focused').to.be.true;
      await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Add' }).disabled).to.be.true);

      // when
      fillSource(' Team ', ' HTTPS://EXAMPLE.COM:443/team#fragment ');
      fireEvent.submit(within(dialog).getByRole('button', { name: 'Add' }).closest('form'));

      // then
      await waitFor(() => expect(getValues().customTemplateSources).to.eql([
        { name: 'A', url: 'https://example.com/a', enabled: false },
        { name: 'Team', url: 'https://example.com/team', enabled: true }
      ]));
      expect(screen.queryByRole('dialog')).not.to.exist;
      expect(onSubmit).not.to.have.been.called;
    });


    [
      [ '', 'https://example.com/b', 'Enter a name.' ],
      [ 'A', 'https://example.com/b', 'A source with this name already exists.' ],
      [ 'Camunda connectors', 'https://example.com/b', 'A source with this name already exists.' ],
      [ 'B', '', 'Enter a URL.' ],
      [ 'B', 'example.com/b', 'Enter an HTTP(S) URL without credentials.' ],
      [ 'B', 'file:///tmp/index.json', 'Enter an HTTP(S) URL without credentials.' ],
      [ 'B', 'https://user:secret@example.com/b', 'Enter an HTTP(S) URL without credentials.' ],
      [ 'B', 'https://EXAMPLE.com/a#other', 'A source with this URL already exists.' ]
    ].forEach(([ name, url, error ]) => {
      it(`should reject ${ JSON.stringify({ name, url }) }`, async function() {

        // given
        const { getValues } = renderSources({
          customTemplateSources: [ { name: 'A', url: 'https://example.com/a' } ]
        });

        // when
        addSource(name, url);

        // then
        const dialog = getDialog();
        await waitFor(() => expect(within(dialog).getByText(error)).to.exist);
        expect(within(dialog).getByRole('button', { name: 'Add' }).disabled).to.be.true;
        expect(getValues().customTemplateSources).to.have.length(1);
      });
    });


    it('should allow name equal to an unnamed source\'s URL label', async function() {

      // given
      const { getValues } = renderSources({
        customTemplateSources: [ { url: 'https://example.com/a' } ]
      });

      // when
      addSource('https://example.com/a', 'https://example.com/b');

      // then
      await waitFor(() => expect(getValues().customTemplateSources).to.eql([
        { url: 'https://example.com/a' },
        { name: 'https://example.com/a', url: 'https://example.com/b', enabled: true }
      ]));
      expect(screen.queryByRole('dialog')).not.to.exist;
    });


    it('should cancel', async function() {

      // given
      const { getValues } = renderSources({ customTemplateSources: [] });
      const addButton = screen.getByRole('button', { name: 'Add source' });

      addButton.focus();
      fireEvent.click(addButton);
      fillSource('Team', 'https://example.com/team');

      // when
      fireEvent.click(within(getDialog()).getByRole('button', { name: 'Cancel' }));

      // then
      expect(screen.queryByRole('dialog')).not.to.exist;
      expect(getValues().customTemplateSources).to.eql([]);
      await waitFor(() => expect(document.activeElement === addButton, 'focus restored').to.be.true);
    });

  });

  describe('edit dialog', function() {

    it('should edit a source', async function() {

      // given
      const { getValues, onSubmit } = renderSources({
        customTemplateSources: [
          { name: 'A', url: 'https://example.com/a', enabled: false, extra: 'kept' },
          { name: 'B', url: 'https://example.com/b' }
        ]
      });

      // when
      selectAction('A', 'Edit');

      // then
      const dialog = getDialog();
      expect(within(dialog).getByRole('heading').textContent).to.equal('Edit element template source');
      expect(getInput('Name').value).to.equal('A');
      expect(getInput('Index URL').value).to.equal('https://example.com/a');
      await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Save' }).disabled, 'unchanged').to.be.true);

      // when
      fillSource(' Team ', 'https://example.com/team');
      fireEvent.submit(within(dialog).getByRole('button', { name: 'Save' }).closest('form'));

      // then
      await waitFor(() => expect(getValues().customTemplateSources).to.eql([
        { name: 'Team', url: 'https://example.com/team', enabled: false, extra: 'kept' },
        { name: 'B', url: 'https://example.com/b' }
      ]));
      expect(screen.queryByRole('dialog')).not.to.exist;
      expect(onSubmit).not.to.have.been.called;
    });


    it('should keep name or URL of the edited source', async function() {

      // given
      const { getValues } = renderSources({
        customTemplateSources: [ { name: 'A', url: 'https://example.com/a' } ]
      });

      // when
      selectAction('A', 'Edit');
      fillSource('A', 'https://example.com/a#changed');
      fireEvent.submit(within(getDialog()).getByRole('button', { name: 'Save' }).closest('form'));

      // then
      await waitFor(() => expect(screen.queryByRole('dialog')).not.to.exist);
      expect(getValues().customTemplateSources).to.eql([ { name: 'A', url: 'https://example.com/a' } ]);
    });


    it('should reject name or URL of another source', async function() {

      // given
      renderSources({
        customTemplateSources: [
          { name: 'A', url: 'https://example.com/a' },
          { name: 'B', url: 'https://example.com/b' }
        ]
      });

      // when
      selectAction('A', 'Edit');
      fillSource('B', 'https://example.com/b');

      // then
      const dialog = getDialog();
      await waitFor(() => expect(within(dialog).getByText('A source with this name already exists.')).to.exist);
      expect(within(dialog).getByText('A source with this URL already exists.')).to.exist;
      expect(within(dialog).getByRole('button', { name: 'Save' }).disabled).to.be.true;
    });


    it('should fix an invalid source without echoing its URL', async function() {

      // given
      const { getValues } = renderSources({
        customTemplateSources: [ { name: 'Secret', url: '******example.com/index', enabled: false } ]
      });

      // when
      selectAction('Secret', 'Edit');

      // then
      expect(getInput('Name').value).to.equal('Secret');
      expect(getInput('Index URL').value).to.equal('');

      // when
      fillSource('Secret', 'https://example.com/index');
      fireEvent.submit(within(getDialog()).getByRole('button', { name: 'Save' }).closest('form'));

      // then
      await waitFor(() => expect(getValues().customTemplateSources).to.eql([
        { name: 'Secret', url: 'https://example.com/index', enabled: false }
      ]));
    });


    it('should restore focus to the options menu on cancel', async function() {

      // given
      renderSources({ customTemplateSources: [ { name: 'A', url: 'https://example.com/a' } ] });

      selectAction('A', 'Edit');

      // when
      fireEvent.click(within(getDialog()).getByRole('button', { name: 'Cancel' }));

      // then
      expect(screen.queryByRole('dialog')).not.to.exist;
      await waitFor(() => expect(document.activeElement === screen.getByRole('button', { name: 'Options for A' }), 'focus restored').to.be.true);
    });

  });

});


// helpers //////////

function renderSources(app) {
  let current;
  const onSubmit = sinon.spy();
  const schema = {
    app: {
      id: 'app',
      properties: { 'app.customTemplateSources': { type: 'custom', component: TemplateSources } }
    }
  };

  render(<Formik initialValues={ { app } } onSubmit={ onSubmit }>
    { ({ values }) => {
      current = values.app;
      return <SettingsForm schema={ schema } onChange={ () => {} } />;
    } }
  </Formik>);

  return { getValues: () => current, onSubmit };
}

function getDialog() {
  return screen.getByRole('dialog');
}

function getSwitches() {
  return Object.fromEntries(
    screen.getAllByRole('switch').map(input => [ input.getAttribute('aria-label'), input.getAttribute('aria-checked') === 'true' ])
  );
}

function getInput(label) {
  return within(getDialog()).getByRole('textbox', { name: new RegExp(`^${ label }`) });
}

function fillSource(name, url) {
  for (const [ label, value ] of [ [ 'Name', name ], [ 'Index URL', url ] ]) {
    const input = getInput(label);
    fireEvent.change(input, { target: { value } });
    fireEvent.blur(input);
  }
}

function selectAction(label, action) {
  fireEvent.keyDown(screen.getByRole('button', { name: `Options for ${ label }` }), { key: 'Enter' });
  fireEvent.click(screen.getByRole('menuitem', { name: action }));
}

function addSource(name, url) {
  fireEvent.click(screen.getByRole('button', { name: 'Add source' }));
  fillSource(name, url);
  fireEvent.submit(within(getDialog()).getByRole('button', { name: 'Add' }).closest('form'));
}
