class ConsoleTransport {
  info(message) {
    console.info(message);
  }

  error(message) {
    console.error(message);
  }
}

module.exports = ConsoleTransport;
