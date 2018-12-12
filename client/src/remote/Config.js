const GET_CLIENT_CONFIG = 'client-config:get';

/**
 * Config API used by client
 */
export default class Config {
  /**
   *
   * @param {Object} backend
   */
  constructor(backend) {
    this.backend = backend;
  }

  /**
   * Get a configuration entry by key.
   *
   * @param {String} key
   * @param {any[]} args
   * @returns {Promise<any>} config value
   */
  get(key, ...args) {
    if (typeof key !== 'string') {
      return Promise.reject(new Error('key must be a string'));
    }

    return this.backend.send(GET_CLIENT_CONFIG, key, ...args);
  }
}
