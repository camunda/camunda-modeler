import Ids from 'ids';

import {
  isString
} from 'min-dash';

const ids = new Ids();


/**
 * Backend rendering abstraction.
 */
export default class Backend {

  constructor(ipcRenderer) {
    this.ipcRenderer = ipcRenderer;
  }

  /**
   * Send a message to the backend, awaiting the answer,
   * resolved as a promise.
   *
   * @param {Event} event
   * @param {...Object} args
   *
   * @return Promise<...>
   */
  send(event, ...args) {

    var id = ids.next();

    return new Promise((resolve, reject) => {

      this.once(event + ':response:' + id, function(evt, args) {
        if (typeof args[0] === 'string') {
          args[0] = new Error(args[0]);

          return reject(...args);
        }

        return resolve(...args);
      });

      this.ipcRenderer.send(event, id, args);
    });

  }

  on(event, callback) {
    this.ipcRenderer.on(event, callback);
  }

  once(event, callback) {
    this.ipcRenderer.once(event, callback);
  }

}