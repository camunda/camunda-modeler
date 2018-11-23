var RESPONSE_OK = { mocked: true };

module.exports = function(url, options) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(RESPONSE_OK)
  });
};

module.exports.RESPONSE_OK = RESPONSE_OK;