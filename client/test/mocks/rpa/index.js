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
    this.listeners[event]?.(...payload);
  }
}

export class RPACodeEditor {
  constructor({
    state = {},
    eventBus = new MockEventBus(),
    value = '{}'
  } = {}) {

    this.eventBus = eventBus;
    this.value = value;
    this.canUndo = false;
    this.canRedo = false;
    this._state = state;
  }

  editor = {
    trigger: () => {},
    getAction: () => {},
    getModel: () => ({
      canRedo: () => this.canRedo,
      canUndo: () => this.canUndo
    })
  };

  getValue = () => this.value;

  destroy = () => {};

  setState = () => {};

  getState = () => this._state;

  on = () => {};
  off = () => {};
}