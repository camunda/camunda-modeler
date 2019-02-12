export default class Log {

  constructor(backend) {
    this.backend = backend;
  }

  error(...args) {
    this.backend.send('client:error', ...args);
  }
}
