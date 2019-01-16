const NOT_INITIALIZED = 'NOT_INITIALIZED';
const NOT_INITIALIZED_WARNING = `
  Metadata not initialized. Before usage pass metadata via Metadata#init.
`;

const defaultData = {
  get name() {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(NOT_INITIALIZED_WARNING);
    }

    return NOT_INITIALIZED;
  },

  get version() {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(NOT_INITIALIZED_WARNING);
    }

    return NOT_INITIALIZED;
  }
};


class Metadata {
  constructor() {
    this.data = defaultData;
  }

  init(data) {
    this.data = data;
  }

  get name() {
    return this.data.name;
  }

  get version() {
    return this.data.version;
  }
}

export default new Metadata();
