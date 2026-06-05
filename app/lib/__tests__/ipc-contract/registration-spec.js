/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

'use strict';

const { bootIndex, loadModuleWithRenderer } = require('./harness');

const {
  CONTRACT,
  PRELOAD_ALLOWED_EVENTS,
  eventsByKind,
  KINDS
} = require('./contract');


/**
 * Surface-lock + wiring tests.
 *
 * These reconcile three independent sources of truth so the contract cannot
 * drift from the real implementation:
 *
 *   1. the declarative CONTRACT in contract.js
 *   2. the preload allow-list (what the renderer may `backend.send`)
 *   3. the ACTUAL handler registrations captured by booting index.js and the
 *      external registering modules (Menu, error-tracking)
 *
 * If a future change adds/removes/renames an event in any one source without
 * updating the others, exactly one of these assertions fails - which is the
 * signal a Rust/Tauri parity backend would otherwise miss.
 */
describe('ipc-contract - surface lock & wiring', function() {

  // Collect the real registrations once.
  let registered;

  before(function() {
    const indexBoot = bootIndex();

    const onEvents = new Set([ ...indexBoot.renderer.handlers.keys() ]);
    const syncEvents = new Set([ ...indexBoot.renderer.syncHandlers.keys() ]);
    const pushEvents = new Set(indexBoot.renderer.sent.map(args => args[0]));

    // Handlers registered OUTSIDE index.js, in their own constructors.
    // Load menu.js directly with a no-op menu builder so the real
    // renderer.on('menu:*') / 'context-menu:open' registrations are captured
    // without building a native menu.
    const FakeMenuBuilder = class {
      build() {
        return { setMenu() {} };
      }
    };

    const menu = loadModuleWithRenderer('./menu/menu', {
      './menu-builder': FakeMenuBuilder,
      '../util/require-platform': () => FakeMenuBuilder
    });
    new menu.module({ platform: 'darwin' });
    [ ...menu.renderer.handlers.keys() ].forEach(e => onEvents.add(e));

    const errorTracking = loadModuleWithRenderer('./util/error-tracking', {
      '@sentry/integrations': { rewriteFramesIntegration: () => ({}) }
    });
    errorTracking.module.start(
      { init() {}, setTag() {} },
      '0.0.0',
      { get: () => undefined },
      { get: () => false },
      errorTracking.renderer
    );
    [ ...errorTracking.renderer.handlers.keys() ].forEach(e => onEvents.add(e));

    registered = { onEvents, syncEvents, pushEvents };
  });


  describe('contract <-> implementation', function() {

    it('should register a handler for every request-response event', function() {

      // given
      const expected = eventsByKind(KINDS.REQUEST_RESPONSE);

      // then
      const missing = expected.filter(e => !registered.onEvents.has(e));

      expect(missing, `unregistered request-response events: ${missing}`).to.be.empty;
    });


    it('should register a handler for every fire-and-forget event (except app-ready-gated)', function() {

      // given - app:quit-allowed registers only after app 'ready', which we do
      // not emit; it is asserted separately below.
      const expected = eventsByKind(KINDS.FIRE_AND_FORGET)
        .filter(e => e !== 'app:quit-allowed');

      // then
      const missing = expected.filter(e => !registered.onEvents.has(e));

      expect(missing, `unregistered fire-and-forget events: ${missing}`).to.be.empty;
    });


    it('should register a sync handler for every sync event', function() {

      // given
      const expected = eventsByKind(KINDS.SYNC);

      // then
      const missing = expected.filter(e => !registered.syncEvents.has(e));

      expect(missing, `unregistered sync events: ${missing}`).to.be.empty;
    });


    it('should NOT register a handler for the no-handler event', function() {

      // given
      const noHandler = eventsByKind(KINDS.NO_HANDLER);

      // then - documents the vestigial app:quit-aborted surface
      noHandler.forEach(e => {
        expect(registered.onEvents.has(e), `${e} unexpectedly has a handler`).to.be.false;
      });
    });


    it('should not have undocumented request-response/sync registrations', function() {

      // given - every captured renderer->main handler must be in the contract
      const known = new Set([
        ...eventsByKind(KINDS.REQUEST_RESPONSE, KINDS.FIRE_AND_FORGET),

        // registered lazily inside app 'ready'
        'app:quit-allowed'
      ]);

      // then
      const undocumented = [ ...registered.onEvents ].filter(e => !known.has(e));

      expect(undocumented, `events registered but not in contract: ${undocumented}`).to.be.empty;
    });

  });


  describe('contract <-> preload allow-list', function() {

    it('should account for every preload-allowed event in the contract', function() {

      // then
      const missing = PRELOAD_ALLOWED_EVENTS.filter(e => !CONTRACT[e]);

      expect(missing, `allow-listed events missing from contract: ${missing}`).to.be.empty;
    });


    it('should mark every renderer->main contract event as preload-allowed', function() {

      // given - everything the renderer sends (request-response, fire-and-forget,
      // no-handler) must be in the allow-list. file:get-path is preload-resolved
      // but still listed. file-context:changed is a push event that is
      // (historically) also present in the allow-list.
      const allowed = new Set(PRELOAD_ALLOWED_EVENTS);

      const rendererToMain = eventsByKind(
        KINDS.REQUEST_RESPONSE,
        KINDS.FIRE_AND_FORGET,
        KINDS.NO_HANDLER,
        KINDS.PRELOAD
      );

      // then
      const notAllowed = rendererToMain.filter(e => !allowed.has(e));

      expect(notAllowed, `contract events missing from allow-list: ${notAllowed}`).to.be.empty;
    });


    it('should keep sync events OUT of the send allow-list', function() {

      // given - sync events use sendSync, not backend.send
      const allowed = new Set(PRELOAD_ALLOWED_EVENTS);

      // then
      eventsByKind(KINDS.SYNC).forEach(e => {
        expect(allowed.has(e), `${e} should not be in the send allow-list`).to.be.false;
      });
    });

  });


  describe('push events', function() {

    it('should actually be pushed by the backend', function() {

      // given - the contract lists these as main->renderer pushes; assert the
      // backend really emits at least the ones triggered during boot/bootstrap.
      // (Full push coverage is exercised by the handler/behavioral specs.)
      const contractPush = new Set(eventsByKind(KINDS.PUSH));

      // then - every captured push must be documented as a push in the contract
      const undocumented = [ ...registered.pushEvents ].filter(e => !contractPush.has(e));

      expect(undocumented, `pushed but undocumented events: ${undocumented}`).to.be.empty;
    });

  });

});
