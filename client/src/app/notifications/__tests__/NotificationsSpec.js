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

import { render, fireEvent, waitFor } from '@testing-library/react';

import Notifications from '..';


describe('<Notifications>', function() {

  it('should render', function() {
    render(<Notifications notifications={ [] } />);
  });


  it('should display notification', async function() {

    // given
    const notification = createNotification({ title: 'display' });

    // when
    const { findByText } = render(<Notifications notifications={ [ notification ] } />);

    // then
    expect(await findByText('display')).to.exist;
  });


  it('should display content', async function() {

    // given
    const notification = createNotification({
      title: 'content',
      content: <span>Some content</span>
    });

    // when
    const { findByText } = render(<Notifications notifications={ [ notification ] } />);

    // then
    expect(await findByText('Some content')).to.exist;
  });


  it('should close on action button click', async function() {

    // given
    const onClick = sinon.spy();
    const close = sinon.spy();

    const notification = createNotification({
      title: 'action',
      content: <button onClick={ onClick }>Do it</button>,
      close
    });

    const { findByRole } = render(<Notifications notifications={ [ notification ] } />);

    // when
    fireEvent.click(await findByRole('button', { name: 'Do it' }));

    // then
    expect(onClick).to.have.been.calledOnce;
    expect(close).to.have.been.calledOnce;
  });


  it('should remove closed notification', async function() {

    // given
    const notification = createNotification({ title: 'closed' });

    const { findByText, queryByText, rerender } = render(<Notifications notifications={ [ notification ] } />);

    await findByText('closed');

    // when
    rerender(<Notifications notifications={ [] } />);

    // then
    await waitFor(() => expect(queryByText('closed')).not.to.exist);
  });


  it('should show updated notification', async function() {

    // given
    const notification = createNotification({ title: 'before update' });

    const { findByText, queryByText, rerender } = render(<Notifications notifications={ [ notification ] } />);

    await findByText('before update');

    // when
    rerender(<Notifications notifications={ [ { ...notification, title: 'after update' } ] } />);

    // then
    expect(await findByText('after update')).to.exist;

    await waitFor(() => expect(queryByText('before update')).not.to.exist);
  });

});


// helpers //////////

function createNotification({
  close = () => {},
  content,
  duration = 0,
  id = 0,
  title = 'title',
  type = 'info'
} = {}) {
  return {
    close,
    content,
    duration,
    id,
    title,
    type
  };
}
