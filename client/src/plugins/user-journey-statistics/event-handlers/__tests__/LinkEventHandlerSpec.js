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
import MixpanelHandler from '../../MixpanelHandler';

import LinkEventHandler from '../LinkEventHandler';


describe('<LinkEventHandler>', function() {

  let container, linkInside, linkOutside, linkHttp, button, buttonOutside, track;

  beforeEach(function() {
    container = MochaTestContainer.get(this);

    const versionInfoOverlay = document.createElement('div');
    versionInfoOverlay.id = 'version-info-overlay';

    linkInside = createAnchor('inside');
    linkOutside = createAnchor('outside');

    linkHttp = createAnchor('http', 'https://camunda.com/');
    button = createButton('click-me');
    buttonOutside = createButton('click-outside');

    versionInfoOverlay.appendChild(linkInside);
    versionInfoOverlay.appendChild(linkHttp);
    versionInfoOverlay.appendChild(button);

    container.appendChild(linkOutside);
    container.appendChild(versionInfoOverlay);

    MixpanelHandler.getInstance().enable('token', 'id', 'stage');

    track = sinon.spy();
    new LinkEventHandler({ track });
  });


  afterEach(function() {
    container.innerHTML = '';
  });


  describe('should send', function() {

    it('internal link', function() {

      // when
      linkInside.click();

      // then
      expect(track).to.have.been.calledOnceWith('link:opened', {
        type: 'internal-link',
        label: 'inside',
        parent: 'version-info-overlay'
      });
    });


    it('external link', function() {

      // when
      linkHttp.click();

      // then
      expect(track).to.have.been.calledOnceWith('link:opened', {
        type: 'external-link',
        label: 'http',
        link: 'https://camunda.com/',
        parent: 'version-info-overlay'
      });
    });


    it('button', function() {

      // when
      button.click();

      // then
      expect(track).to.have.been.calledOnceWith('button:clicked', {
        type: 'button',
        label: 'click-me',
        parent: 'version-info-overlay'
      });
    });

  });


  describe('should not send if out of scope', function() {

    it('link', function() {

      // when
      linkOutside.click();

      // then
      expect(track).not.to.have.been.called;
    });


    it('button', function() {

      // when
      buttonOutside.click();

      // then
      expect(track).not.to.have.been.called;
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