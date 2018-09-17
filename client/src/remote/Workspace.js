/**
 * Workspace API used by app.
 */
export default class Workspace {
  constructor(backend) {
    this.backend = backend;
  }

  save(config) {
    return this.backend.send('workspace:save', config);
  }

  restore(defaultConfig) {
    return this.backend.send('workspace:restore', defaultConfig);
  }
}