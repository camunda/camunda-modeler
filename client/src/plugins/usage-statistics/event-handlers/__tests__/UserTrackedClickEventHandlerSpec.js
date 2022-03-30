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

import UserTrackedClickEventHandler from '../UserTrackedClickEventHandler';


describe('<UserTrackedClickEventHandler>', () => {

  let container, linkInside, linkOutside, linkHttp, button;

  beforeEach(function() {
    container = MochaTestContainer.get(this);

    const versionInfoOverlay = document.createElement('div');
    versionInfoOverlay.id = 'version-info-overlay';

    linkInside = createAnchor('inside');
    linkOutside = createAnchor('outside');
    linkHttp = createAnchor('http', 'https://camunda.com/');
    button = createButton('click-me');

    versionInfoOverlay.appendChild(linkInside);
    versionInfoOverlay.appendChild(linkHttp);
    versionInfoOverlay.appendChild(button);

    container.appendChild(linkOutside);
    container.appendChild(versionInfoOverlay);
  });


  afterEach(function() {
    container.innerHTML = '';
  });


  it('should send event on link clicked', () => {

    // given
    const onSend = sinon.spy();
    const handler = new UserTrackedClickEventHandler({ onSend });
    handler.enable();

    // when
    linkInside.click();

    // then
    expect(onSend).to.have.been.calledOnceWith({
      event: 'userTrackedClick', type: 'internal-link', label: 'inside', parent: 'version-info-overlay'
    });
  });


  it('should include link reference on http link clicked', () => {

    // given
    const onSend = sinon.spy();
    const handler = new UserTrackedClickEventHandler({ onSend });
    handler.enable();

    // when
    linkHttp.click();

    // then
    expect(onSend).to.have.been.calledOnceWith({
      event: 'userTrackedClick', type: 'external-link', label: 'http', link: 'https://camunda.com/', parent: 'version-info-overlay'
    });
  });


  it('should send event on button clicked', () => {

    // given
    const onSend = sinon.spy();
    const handler = new UserTrackedClickEventHandler({ onSend });
    handler.enable();

    // when
    button.click();

    // then
    expect(onSend).to.have.been.calledOnceWith({
      event: 'userTrackedClick', type: 'button', label: 'click-me', parent: 'version-info-overlay'
    });
  });


  it('should NOT send event when link outside of scope is clicked', () => {

    // given
    const onSend = sinon.spy();
    const handler = new UserTrackedClickEventHandler({ onSend });
    handler.enable();

    // when
    linkOutside.click();

    // then
    expect(onSend).not.to.have.been.called;
  });


  it('should send only one event when re-enabled', () => {

    // given
    const onSend = sinon.spy();
    const handler = new UserTrackedClickEventHandler({ onSend });
    handler.enable();

    // when
    handler.disable();
    handler.enable();
    linkInside.click();

    // then
    expect(onSend).to.have.been.calledOnceWith({
      event: 'userTrackedClick', type: 'internal-link', label: 'inside', parent: 'version-info-overlay'
    });
  });
});


function createAnchor(label, href = '#') {
  const anchor = document.createElement('a');
  anchor.textContent = label;
  anchor.href = href;

  // prevent redirect
  anchor.addEventListener('click', event => event.preventDefault());

  return anchor;
}

function createButton(label) {
  const button = document.createElement('button');
  button.textContent = label;
  return button;
}
