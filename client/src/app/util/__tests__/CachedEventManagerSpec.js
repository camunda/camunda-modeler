/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { CachedEventManager } from '../CachedEventManager';
import EventEmitter from 'events';


describe('CachedEventManager', function() {

  describe('constructor', function() {

    it('should initialize with empty events list', function() {

      // when
      const manager = new CachedEventManager();

      // then
      expect(manager.cachedEventNames.size).to.equal(0);
      expect(manager.cache.size).to.equal(0);
    });

    it('should initialize with provided event names', function() {

      // when
      const manager = new CachedEventManager([
        'event1',
        'event2'
      ]);

      // then
      expect(manager.cachedEventNames.size).to.equal(2);
      expect(manager.shouldCache('event1')).to.be.true;
      expect(manager.shouldCache('event2')).to.be.true;
    });

  });

  describe('addCachedEvent', function() {

    it('should add a single event to be cached', function() {

      // given
      const manager = new CachedEventManager();

      // assume
      expect(manager.shouldCache('myEvent')).to.be.false;

      // when
      manager.addCachedEvent('myEvent');

      // then
      expect(manager.shouldCache('myEvent')).to.be.true;
    });

    it('should not add duplicates', function() {

      // given
      const manager = new CachedEventManager([ 'event1' ]);

      // assume
      expect(manager.cachedEventNames.size).to.equal(1);

      // when
      manager.addCachedEvent('event1');

      // then
      expect(manager.cachedEventNames.size).to.equal(1);
    });

  });

  describe('addCachedEvents', function() {

    it('should add multiple events to be cached', function() {

      // given
      const manager = new CachedEventManager();

      // when
      manager.addCachedEvents([ 'event1', 'event2', 'event3' ]);

      // then
      expect(manager.shouldCache('event1')).to.be.true;
      expect(manager.shouldCache('event2')).to.be.true;
      expect(manager.shouldCache('event3')).to.be.true;
      expect(manager.cachedEventNames.size).to.equal(3);
    });

    it('should handle empty array', function() {

      // given
      const manager = new CachedEventManager();

      // when
      manager.addCachedEvents([]);

      // then
      expect(manager.cachedEventNames.size).to.equal(0);
    });

  });

  describe('shouldCache', function() {

    it('should return true for registered events', function() {

      // given
      const manager = new CachedEventManager([ 'trackedEvent' ]);

      // when & then
      expect(manager.shouldCache('trackedEvent')).to.be.true;
    });

    it('should return false for unregistered events', function() {

      // given
      const manager = new CachedEventManager();

      // when & then
      expect(manager.shouldCache('unknownEvent')).to.be.false;
    });

  });

  describe('cacheEvent', function() {

    it('should cache event data if event is registered', function() {

      // given
      const manager = new CachedEventManager([ 'myEvent' ]);
      const data = { status: 'connected' };

      // when
      manager.cacheEvent('myEvent', data);

      // then
      expect(manager.getCachedValue('myEvent')).to.equal(data);
    });

    it('should not cache unregistered events', function() {

      // given
      const manager = new CachedEventManager();
      const data = { status: 'connected' };

      // when
      manager.cacheEvent('unknownEvent', data);

      // then
      expect(manager.hasCachedValue('unknownEvent')).to.be.false;
    });

    it('should cache only the first argument', function() {

      // given
      const manager = new CachedEventManager([ 'myEvent' ]);
      const firstArg = { id: 1 };
      const secondArg = { id: 2 };

      // when
      manager.cacheEvent('myEvent', firstArg, secondArg);

      // then
      expect(manager.getCachedValue('myEvent')).to.equal(firstArg);
    });

    it('should overwrite previous cached value', function() {

      // given
      const manager = new CachedEventManager([ 'myEvent' ]);
      const firstData = { version: 1 };
      const secondData = { version: 2 };

      // when
      manager.cacheEvent('myEvent', firstData);
      manager.cacheEvent('myEvent', secondData);

      // then
      expect(manager.getCachedValue('myEvent')).to.equal(secondData);
    });

  });

  describe('getCachedValue', function() {

    it('should return cached value', function() {

      // given
      const manager = new CachedEventManager([ 'myEvent' ]);
      const data = { status: 'online' };

      // when
      manager.cacheEvent('myEvent', data);

      // then
      expect(manager.getCachedValue('myEvent')).to.equal(data);
    });

    it('should return undefined for non-existent cache entry', function() {

      // given
      const manager = new CachedEventManager();

      // when & then
      expect(manager.getCachedValue('unknownEvent')).to.be.undefined;
    });

  });

  describe('hasCachedValue', function() {

    it('should return true if event is cached', function() {

      // given
      const manager = new CachedEventManager([ 'myEvent' ]);

      // when
      manager.cacheEvent('myEvent', 'data');

      // then
      expect(manager.hasCachedValue('myEvent')).to.be.true;
    });

    it('should return false if event is not cached', function() {

      // given
      const manager = new CachedEventManager([ 'myEvent' ]);

      // when & then
      expect(manager.hasCachedValue('myEvent')).to.be.false;
    });

  });

  describe('clearCachedValue', function() {

    it('should clear a specific cached value', function() {

      // given
      const manager = new CachedEventManager([ 'event1', 'event2' ]);
      manager.cacheEvent('event1', 'data1');
      manager.cacheEvent('event2', 'data2');

      // assume
      expect(manager.hasCachedValue('event1')).to.be.true;
      expect(manager.hasCachedValue('event2')).to.be.true;

      // when
      manager.clearCachedValue('event1');

      // then
      expect(manager.hasCachedValue('event1')).to.be.false;
      expect(manager.hasCachedValue('event2')).to.be.true;
    });

    it('should handle clearing non-existent values', function() {

      // given
      const manager = new CachedEventManager();

      // when & then (should not throw)
      expect(() => manager.clearCachedValue('unknownEvent')).to.not.throw();
    });

  });

  describe('clearAll', function() {

    it('should clear all cached values', function() {

      // given
      const manager = new CachedEventManager([ 'event1', 'event2', 'event3' ]);
      manager.cacheEvent('event1', 'data1');
      manager.cacheEvent('event2', 'data2');
      manager.cacheEvent('event3', 'data3');

      // assume
      expect(manager.cache.size).to.equal(3);

      // when
      manager.clearAll();

      // then
      expect(manager.cache.size).to.equal(0);
      expect(manager.hasCachedValue('event1')).to.be.false;
      expect(manager.hasCachedValue('event2')).to.be.false;
      expect(manager.hasCachedValue('event3')).to.be.false;
    });

  });

  describe('createEmitWrapper', function() {

    it('should create wrapper that calls original emit', function() {

      // given
      const manager = new CachedEventManager([ 'myEvent' ]);
      let originalEmitCalled = false;
      const originalEmit = () => {
        originalEmitCalled = true;
      };

      // when
      const wrappedEmit = manager.createEmitWrapper(originalEmit);
      wrappedEmit('myEvent', {});

      // then
      expect(originalEmitCalled).to.be.true;
    });

    it('should cache events while emitting', function() {

      // given
      const manager = new CachedEventManager([ 'myEvent' ]);
      const originalEmit = () => {};

      // when
      const wrappedEmit = manager.createEmitWrapper(originalEmit);
      const data = { status: 'connected' };
      wrappedEmit('myEvent', data);

      // then
      expect(manager.getCachedValue('myEvent')).to.equal(data);
    });

    it('should pass through arguments to original emit', function() {

      // given
      const manager = new CachedEventManager([ 'myEvent' ]);
      let emittedArgs = [];
      const originalEmit = (event, ...args) => {
        emittedArgs = [ event, ...args ];
      };

      // when
      const wrappedEmit = manager.createEmitWrapper(originalEmit);
      const data = { id: 1 };
      wrappedEmit('myEvent', data);

      // then
      expect(emittedArgs).to.eql([ 'myEvent', data ]);
    });

    it('should return result from original emit', function() {

      // given
      const manager = new CachedEventManager([ 'myEvent' ]);
      const originalEmit = () => 'emit-result';

      // when
      const wrappedEmit = manager.createEmitWrapper(originalEmit);
      const result = wrappedEmit('myEvent', {});

      // then
      expect(result).to.equal('emit-result');
    });

  });

  describe('createEventsContext', function() {

    it('should create events context with subscribe method', function() {

      // given
      const manager = new CachedEventManager();
      const emitter = new EventEmitter();

      // when
      const context = manager.createEventsContext(emitter);

      // then
      expect(context).to.exist;
      expect(context.subscribe).to.be.a('function');
    });

    it('should subscribe listener to event', function() {

      // given
      const manager = new CachedEventManager([ 'myEvent' ]);
      const emitter = new EventEmitter();
      const context = manager.createEventsContext(emitter);
      let listenerCalled = false;

      // when
      context.subscribe('myEvent', () => {
        listenerCalled = true;
      });
      emitter.emit('myEvent', {});

      // then
      expect(listenerCalled).to.be.true;
    });

    it('should immediately call listener with cached value', function() {

      // given
      const manager = new CachedEventManager([ 'myEvent' ]);
      const emitter = new EventEmitter();
      const data = { status: 'connected' };
      manager.cacheEvent('myEvent', data);

      // when
      const context = manager.createEventsContext(emitter);
      let receivedData;
      context.subscribe('myEvent', (value) => {
        receivedData = value;
      });

      // then
      expect(receivedData).to.equal(data);
    });

    it('should not call listener immediately if no cached value', function() {

      // given
      const manager = new CachedEventManager([ 'myEvent' ]);
      const emitter = new EventEmitter();
      const context = manager.createEventsContext(emitter);
      let callCount = 0;

      // when
      context.subscribe('myEvent', () => {
        callCount++;
      });

      // then
      expect(callCount).to.equal(0);
    });

    it('should return subscription object with cancel method', function() {

      // given
      const manager = new CachedEventManager([ 'myEvent' ]);
      const emitter = new EventEmitter();
      const context = manager.createEventsContext(emitter);

      // when
      const subscription = context.subscribe('myEvent', () => {});

      // then
      expect(subscription).to.exist;
      expect(subscription.cancel).to.be.a('function');
    });

    it('should allow unsubscribing via cancel', function() {

      // given
      const manager = new CachedEventManager([ 'myEvent' ]);
      const emitter = new EventEmitter();
      const context = manager.createEventsContext(emitter);
      let callCount = 0;

      // when
      const subscription = context.subscribe('myEvent', () => {
        callCount++;
      });
      emitter.emit('myEvent', {});

      // assume
      expect(callCount).to.equal(1);

      // when
      subscription.cancel();
      emitter.emit('myEvent', {});

      // then
      expect(callCount).to.equal(1);
    });

    it('should handle multiple subscriptions', function() {

      // given
      const manager = new CachedEventManager([ 'myEvent' ]);
      const emitter = new EventEmitter();
      const context = manager.createEventsContext(emitter);
      let firstListenerCalls = 0;
      let secondListenerCalls = 0;

      // when
      context.subscribe('myEvent', () => {
        firstListenerCalls++;
      });
      context.subscribe('myEvent', () => {
        secondListenerCalls++;
      });
      emitter.emit('myEvent', {});

      // then
      expect(firstListenerCalls).to.equal(1);
      expect(secondListenerCalls).to.equal(1);
    });

  });

  describe('integration', function() {

    it('should work end-to-end with emit wrapper and events context', function() {

      // given
      const manager = new CachedEventManager([ 'connectionStatus' ]);
      const emitter = new EventEmitter();

      // when - wrap emit
      const originalEmit = emitter.emit.bind(emitter);
      emitter.emit = manager.createEmitWrapper(originalEmit);

      // and - emit an event
      const connectionData = { isConnected: true };
      emitter.emit('connectionStatus', connectionData);

      // and - create events context
      const context = manager.createEventsContext(emitter);

      // then - new subscriber gets cached value immediately
      let receivedData;
      context.subscribe('connectionStatus', (value) => {
        receivedData = value;
      });

      expect(receivedData).to.equal(connectionData);
    });

    it('should handle multiple events independently', function() {

      // given
      const manager = new CachedEventManager([
        'event1',
        'event2',
        'event3'
      ]);

      // when
      manager.cacheEvent('event1', 'data1');
      manager.cacheEvent('event2', 'data2');
      manager.cacheEvent('event3', 'data3');

      // then
      expect(manager.getCachedValue('event1')).to.equal('data1');
      expect(manager.getCachedValue('event2')).to.equal('data2');
      expect(manager.getCachedValue('event3')).to.equal('data3');
    });

  });

});
