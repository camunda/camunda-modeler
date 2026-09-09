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
import { Formik } from 'formik';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { CustomTemplateSources } from '../ElementTemplatesSettings';
import { SettingsForm } from '../SettingsForm';


describe('CustomTemplateSources', function() {

  it('should add, focus, edit and remove URL-only rows', async function() {

    // given
    const { getSources } = renderSources([]);

    // when
    fireEvent.click(screen.getByRole('button', { name: 'Add source' }));
    const input = screen.getByRole('textbox', { name: 'Source 1 URL' });

    // then
    expect(document.activeElement).to.equal(input);

    // when
    fireEvent.change(input, { target: { value: 'https://example.com/index' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add source' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Source 2 URL' }), { target: { value: 'http://internal.example/index' } });
    fireEvent.click(screen.getByRole('button', { name: 'Remove source 1' }));

    // then
    await waitFor(() => expect(getSources()).to.eql([ 'http://internal.example/index' ]));
    expect(screen.getByRole('textbox', { name: 'Source 1 URL' }).value).to.equal('http://internal.example/index');
  });


  [ '', '  ', 'not a URL', '/index', 'file:///tmp/index', 'ftp://example.com/index', 'https://user:secret@example.com/index', 'https://:secret@example.com/index' ].forEach(value => {
    it(`should show an inline error for ${ JSON.stringify(value) }`, async function() {

      // when
      renderSources([ value ]);

      // then
      expect(await screen.findByText('Enter an HTTP(S) URL without credentials.')).to.exist;
    });
  });


  it('should detect normalized duplicates without changing the typed URLs', async function() {

    // given
    const sources = [ ' HTTPS://EXAMPLE.COM:443/a/../index?group=1#one ', 'https://example.com/index?group=1#two' ];
    const { getSources } = renderSources(sources);

    // then
    expect(await screen.findByText('This source URL is already configured.')).to.exist;
    expect(getSources()).to.eql(sources);

    // when
    fireEvent.change(screen.getByRole('textbox', { name: 'Source 1 URL' }), { target: { value: 'https://example.com/index?group=2' } });

    // then
    await waitFor(() => expect(screen.queryByText('This source URL is already configured.')).not.to.exist);
    expect(screen.getByRole('textbox', { name: 'Source 2 URL' }).value).to.equal(sources[1]);
  });


  it('should render malformed list entries without changing them', async function() {

    // given
    const sources = [ {}, null, 7 ];

    // when
    const { getSources } = renderSources(sources);

    // then
    expect(screen.getAllByRole('textbox')).to.have.length(3);
    await waitFor(() => expect(screen.getAllByText('Enter an HTTP(S) URL without credentials.')).to.have.length(3));
    expect(getSources()).to.eql(sources);
  });


  [ null, {}, 'invalid list' ].forEach(value => {
    it(`should safely replace a malformed list only on Add (${ JSON.stringify(value) })`, async function() {

      // given
      const { getSources } = renderSources(value);
      expect(screen.getByText('Invalid source list. Add a source to replace it.')).to.exist;
      expect(getSources()).to.eql(value);

      // when
      fireEvent.click(screen.getByRole('button', { name: 'Add source' }));

      // then
      await waitFor(() => expect(getSources()).to.eql([ '' ]));
      expect(screen.getByRole('textbox', { name: 'Source 1 URL' })).to.equal(document.activeElement);
    });
  });

});


// helpers //////////

function renderSources(sources) {
  let current;
  const schema = {
    app: {
      id: 'app',
      properties: { 'app.customTemplateSources': { type: 'custom', component: CustomTemplateSources } }
    }
  };
  const noop = () => {};

  render(<Formik initialValues={ { app: { customTemplateSources: sources } } } onSubmit={ noop }>
    { ({ values }) => {
      current = values.app.customTemplateSources;
      return <SettingsForm schema={ schema } onChange={ noop } />;
    } }
  </Formik>);

  return { getSources: () => current };
}
