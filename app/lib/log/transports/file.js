const { Console } = require('console');
const fs = require('fs');

class FileTransport {
  constructor(logPath) {
    this.console = new Console({
      stdout: fs.createWriteStream(logPath, { flags: 'a' })
    });
  }

  info(message) {
    this.console.log('[' + new Date().toISOString() + '] ' + message);
  }

  error(message) {
    this.info(message);
  }
}

module.exports = FileTransport;
