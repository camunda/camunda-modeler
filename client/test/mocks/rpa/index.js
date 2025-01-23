export class MockEventBus {
  constructor() {
    this.listeners = {};
  }

  on(event, listener) {
    this.listeners[event] = listener;
  }

  off(event) {
    delete this.listeners[event];
  }

  fire(event, ...payload) {
    this.listeners[event](...payload);
  }
}

export class RPACodeEditor {
  constructor({
    eventBus = new MockEventBus(),
    value = '{}'
  } = {}) {

    this.eventBus = eventBus;
    this.value = value;
    this.canUndo = false;
    this.canRedo = false;
  }

  editor = {
    execCommand: () => {},
    getModel: () => ({
      canRedo: () => this.canRedo,
      canUndo: () => this.canUndo
    })
  };

  getValue = () => this.value;

  destroy = () => {};

  setState = () => {};

  getState = () => {};


  on = () => {};
  off = () => {};
}