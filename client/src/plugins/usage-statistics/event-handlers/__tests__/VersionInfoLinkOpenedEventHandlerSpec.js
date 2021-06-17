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

import MochaTestContainer from 'mocha-test-container-support';

import VersionInfoLinkOpenedEventHandler from '../VersionInfoLinkOpenedEventHandler';


describe('<VersionInfoLinkOpenedEventHandler>', () => {

  let container, linkInside, linkOutside;

  beforeEach(function() {
    container = MochaTestContainer.get(this);

    const versionInfoOverlay = document.createElement('div');
    versionInfoOverlay.id = 'version-info-overlay';

    linkInside = createAnchor('inside');
    linkOutside = createAnchor('outside');

    versionInfoOverlay.appendChild(linkInside);

    container.appendChild(linkOutside);
    container.appendChild(versionInfoOverlay);
  });


  afterEach(function() {
    container.innerHTML = '';
  });


  it('should send event on link clicked', () => {

    // given
    const onSend = sinon.spy();
    const handler = new VersionInfoLinkOpenedEventHandler({ onSend });
    handler.enable();

    // when
    linkInside.click();

    // then
    expect(onSend).to.have.been.calledOnceWith({
      event: 'versionInfoLinkOpened', label: 'inside'
    });
  });


  it('should NOT send event when link outside of scope is clicked', () => {

    // given
    const onSend = sinon.spy();
    const handler = new VersionInfoLinkOpenedEventHandler({ onSend });
    handler.enable();

    // when
    linkOutside.click();

    // then
    expect(onSend).not.to.have.been.called;
  });


  it('should send only one event when re-enabled', () => {

    // given
    const onSend = sinon.spy();
    const handler = new VersionInfoLinkOpenedEventHandler({ onSend });
    handler.enable();

    // when
    handler.disable();
    handler.enable();
    linkInside.click();

    // then
    expect(onSend).to.have.been.calledOnceWith({
      event: 'versionInfoLinkOpened', label: 'inside'
    });
  });
});


function createAnchor(label, href = 'test') {
  const anchor = document.createElement('a');
  anchor.textContent = label;
  anchor.href = href;

  // prevent redirect
  anchor.addEventListener('click', event => event.preventDefault());

  return anchor;
}
