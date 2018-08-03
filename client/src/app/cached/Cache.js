export default class Cache {

  constructor() {
    this._entries = {};
  }

  get(key) {
    return this._entries[key];
  }

  add(key, value) {
    this._entries[key] = value;

    return value;
  }

  destroy(key) {
    Object.keys(this._entries).forEach((k) => {
      if (k.indexOf(key) === 0) {
        const entry = this._entries[k];

        if ('__destroy' in entry) {
          entry.__destroy();
        }

        delete this._entries[k];
      }
    });
  }
}

