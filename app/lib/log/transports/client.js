class ClientTransport {
  constructor(client, isClientReady) {
    this.client = client;
    this.isClientReady = isClientReady;

    this.buffer = [];
  }

  info() {}

  /**
   *
   * @param {string} message
   */
  error(message) {
    if (message.startsWith('client')) {
      return;
    }

    this.buffer.push(message);

    if (!this.isClientReady()) {
      return;
    }

    const files = this.buffer.slice();

    this.buffer.length = 0;

    files.forEach(bufferedMessage => this.client.send('backend:error', bufferedMessage));
  }
}

module.exports = ClientTransport;
