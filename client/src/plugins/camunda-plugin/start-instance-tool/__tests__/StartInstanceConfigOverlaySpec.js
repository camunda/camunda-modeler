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

import { render } from '@testing-library/react';

import StartInstanceConfigOverlay from '../StartInstanceConfigOverlay';

describe('<StartInstanceConfigOverlay>', function() {

  it('should render', function() {
    createOverlay();
  });


  it('should render with customizations', function() {

    // given
    const options = {
      title: 'title',
    };

    // when
    const { getByText } = createOverlay(options);

    // then
    expect(getByText(options.title)).to.exist;
  });

});


// helpers //////////

function createOverlay(props = {}) {

  const {
    configuration,
    onClose,
    title,
  } = props;

  const { container } = render(<button />);
  const anchor = container.firstChild;

  return render(
    <StartInstanceConfigOverlay
      configuration={ configuration || getDefaultConfiguration() }
      onClose={ onClose || noop }
      title={ title }
      anchor={ anchor }
    />
  );
}

function noop() {}

function getDefaultConfiguration() {
  return {
    businessKey: 'default'
  };
}
