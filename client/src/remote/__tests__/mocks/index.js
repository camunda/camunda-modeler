export class IpcRenderer {
  constructor() {
    this.response = null;

    this.listener = null;
  }

  setSendResponse(response) {
    this.sendResponse = response;
  }

  send(event, id, args) {
    this.listener(null, this.sendResponse);
  }

  on(event, callback) {
    this.listener = callback;
  }

  off(event) {
    this.listener = null;
  }

  once(event, callback) {
    this.listener = callback;
  }
}

export class Process {
  constructor() {
    this.platform = null;
  }

  setPlatform(platform) {
    this.platform = platform;
  }
}