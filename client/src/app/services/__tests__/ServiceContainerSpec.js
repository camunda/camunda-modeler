/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import ServiceContainer from '../ServiceContainer';
import ActionRegistry from '../ActionRegistry';


describe('ServiceContainer', function() {

  function createEventEmitter() {
    const listeners = {};

    return {
      on(event, handler) {
        listeners[event] = listeners[event] || [];
        listeners[event].push(handler);
      },
      off(event, handler) {
        listeners[event] = (listeners[event] || []).filter(h => h !== handler);
      },
      emit(event, ...args) {
        (listeners[event] || []).forEach(h => h(...args));
      },
      listeners
    };
  }


  describe('constructor', function() {

    it('should instantiate services from descriptors', function() {

      // given
      const descriptor = {
        name: 'test',
        create() {
          return { value: 42 };
        }
      };

      // when
      const container = new ServiceContainer({
        descriptors: [ descriptor ],
        deps: {}
      });

      // then
      expect(container.get('test')).to.eql({ value: 42 });
    });


    it('should pass shared deps to service factory', function() {

      // given
      let receivedDeps;

      const descriptor = {
        name: 'test',
        create(deps) {
          receivedDeps = deps;
          return {};
        }
      };

      const deps = { foo: 'bar', baz: 123 };

      // when
      new ServiceContainer({
        descriptors: [ descriptor ],
        deps
      });

      // then
      expect(receivedDeps.foo).to.equal('bar');
      expect(receivedDeps.baz).to.equal(123);
    });


    it('should make earlier services available to later factories', function() {

      // given
      const firstService = { id: 'first' };
      let receivedDeps;

      const first = {
        name: 'first',
        create() {
          return firstService;
        }
      };

      const second = {
        name: 'second',
        create(deps) {
          receivedDeps = deps;
          return { id: 'second' };
        }
      };

      // when
      new ServiceContainer({
        descriptors: [ first, second ],
        deps: {}
      });

      // then
      expect(receivedDeps.first).to.equal(firstService);
    });


    it('should auto-resolve order from declared deps', function() {

      // given
      const layoutService = { id: 'layout' };
      let receivedDeps;

      const notification = {
        name: 'notification',
        deps: [ 'layout' ],
        create(deps) {
          receivedDeps = deps;
          return { id: 'notification' };
        }
      };

      const layout = {
        name: 'layout',
        create() {
          return layoutService;
        }
      };

      // when — notification listed before layout
      new ServiceContainer({
        descriptors: [ notification, layout ],
        deps: {}
      });

      // then — layout was still resolved first
      expect(receivedDeps.layout).to.equal(layoutService);
    });


    it('should throw on circular dependency', function() {

      // given
      const a = {
        name: 'a',
        deps: [ 'b' ],
        create() {
          return {};
        }
      };

      const b = {
        name: 'b',
        deps: [ 'a' ],
        create() {
          return {};
        }
      };

      // then
      expect(() => {
        new ServiceContainer({
          descriptors: [ a, b ],
          deps: {}
        });
      }).to.throw(/Circular dependency detected/);
    });


    it('should ignore deps that reference external (non-descriptor) names', function() {

      // given
      let receivedDeps;

      const descriptor = {
        name: 'test',
        deps: [ 'unknownService' ],
        create(deps) {
          receivedDeps = deps;
          return {};
        }
      };

      // when — should not throw
      new ServiceContainer({
        descriptors: [ descriptor ],
        deps: { foo: 'bar' }
      });

      // then
      expect(receivedDeps.foo).to.equal('bar');
    });

  });


  describe('actions', function() {

    it('should register actions from descriptor', function() {

      // given
      const actionRegistry = new ActionRegistry();

      const descriptor = {
        name: 'test',
        create() {
          return {};
        },
        actions() {
          return {
            'do-thing': () => 'done'
          };
        }
      };

      // when
      new ServiceContainer({
        descriptors: [ descriptor ],
        deps: {},
        actionRegistry
      });

      // then
      expect(actionRegistry.has('do-thing')).to.be.true;
      expect(actionRegistry.dispatch('do-thing')).to.equal('done');
    });


    it('should pass service instance to actions factory', function() {

      // given
      const actionRegistry = new ActionRegistry();
      const service = { greet: () => 'hello' };

      const descriptor = {
        name: 'test',
        create() {
          return service;
        },
        actions(svc) {
          return {
            'greet': () => svc.greet()
          };
        }
      };

      // when
      new ServiceContainer({
        descriptors: [ descriptor ],
        deps: {},
        actionRegistry
      });

      // then
      expect(actionRegistry.dispatch('greet')).to.equal('hello');
    });


    it('should skip actions when actionRegistry is not provided', function() {

      // given
      const descriptor = {
        name: 'test',
        create() {
          return {};
        },
        actions() {
          return { 'do-thing': () => 'done' };
        }
      };

      // when / then — should not throw
      const container = new ServiceContainer({
        descriptors: [ descriptor ],
        deps: {}
      });

      expect(container.get('test')).to.exist;
    });

  });


  describe('events', function() {

    it('should subscribe to events from descriptor', function() {

      // given
      const emitter = createEventEmitter();
      const handlerSpy = sinon.spy();

      const descriptor = {
        name: 'test',
        create() {
          return {};
        },
        events() {
          return {
            'some.event': handlerSpy
          };
        }
      };

      // when
      new ServiceContainer({
        descriptors: [ descriptor ],
        deps: {},
        eventEmitter: emitter
      });

      emitter.emit('some.event', 'payload');

      // then
      expect(handlerSpy).to.have.been.calledWith('payload');
    });


    it('should skip events when eventEmitter is not provided', function() {

      // given
      const descriptor = {
        name: 'test',
        create() {
          return {};
        },
        events() {
          return { 'some.event': () => {} };
        }
      };

      // when / then — should not throw
      new ServiceContainer({
        descriptors: [ descriptor ],
        deps: {}
      });
    });

  });


  describe('#get', function() {

    it('should return undefined for unregistered service', function() {

      // given
      const container = new ServiceContainer({
        descriptors: [],
        deps: {}
      });

      // then
      expect(container.get('nonexistent')).to.be.undefined;
    });

  });


  describe('#destroy', function() {

    it('should remove event subscriptions', function() {

      // given
      const emitter = createEventEmitter();
      const handlerSpy = sinon.spy();

      const descriptor = {
        name: 'test',
        create() {
          return {};
        },
        events() {
          return {
            'some.event': handlerSpy
          };
        }
      };

      const container = new ServiceContainer({
        descriptors: [ descriptor ],
        deps: {},
        eventEmitter: emitter
      });

      // when
      container.destroy(emitter);

      emitter.emit('some.event', 'payload');

      // then
      expect(handlerSpy).not.to.have.been.called;
    });

  });


  describe('descriptor without optional hooks', function() {

    it('should work with descriptor that has only name and create', function() {

      // given
      const descriptor = {
        name: 'minimal',
        create() {
          return { minimal: true };
        }
      };

      // when
      const container = new ServiceContainer({
        descriptors: [ descriptor ],
        deps: {},
        actionRegistry: new ActionRegistry(),
        eventEmitter: createEventEmitter()
      });

      // then
      expect(container.get('minimal')).to.eql({ minimal: true });
    });

  });

});
