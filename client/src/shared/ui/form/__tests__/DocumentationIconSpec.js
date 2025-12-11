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

import React from 'react';

import { render } from '@testing-library/react';

import DocumentationIcon from '../DocumentationIcon';


describe('<DocumentationIcon>', function() {

  it('should render', function() {

    // when
    const { container } = createDocumentationIcon({ url: 'https://example.com' });

    // then
    const link = container.querySelector('.documentation-icon');
    expect(link).to.exist;
  });


  it('should not render when url is not provided', function() {

    // when
    const { container } = createDocumentationIcon();

    // then
    const link = container.querySelector('.documentation-icon');
    expect(link).to.not.exist;
  });


  it('should render tooltip with correct label', function() {

    // when
    const { container } = createDocumentationIcon({ url: 'https://example.com' });

    // then
    const tooltipContent = container.querySelector('.cds--popover-content');
    expect(tooltipContent).to.exist;
    expect(tooltipContent.textContent).to.equal('Open documentation');
  });


  it('should call onClick callback when clicked', function() {

    // given
    const onClick = sinon.spy();

    // when
    const { container } = createDocumentationIcon({
      url: 'https://example.com',
      onClick
    });

    const anchor = container.querySelector('.documentation-icon');
    anchor.click();

    // then
    expect(onClick).to.have.been.calledOnce;
  });

});


// helpers
function createDocumentationIcon(props = {}) {
  return render(<DocumentationIcon { ...props } />);
}
