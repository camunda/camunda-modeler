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
        if (isString(args[0])) {
          return reject(new Error(args[0]));
        }

        var actualArgs = args.slice(1);

        return resolve(...actualArgs);
      });

      this.ipcRenderer.send(event, id, args);
    });

  }

  on(event, callback) {
    this.ipcRenderer.on(event, callback);
  }

  off(event, callback) {
    this.ipcRenderer.off(event, callback);
  }

  once(event, callback) {
    this.ipcRenderer.once(event, callback);
  }

  sendQuitAllowed = () => {
    this.send('app:quit-allowed');
  }

  sendQuitAborted = () => {
    this.send('app:quit-aborted');
  }

  sendReady = () => {
    this.send('client:ready');
  }

  showContextMenu = (type, options) => {
    this.send('context-menu:open', type, options);
  }

  updateMenu = (state) => {
    this.send('menu:update', state);
  }

}