'use strict';

/**
 * Create deploy API factory fn.
 */
function createDeployer({ fetch, fs, FormData }) {

  /**
   * Deploy diagram to the given endpoint URL.
   */
  return function deploy(url, { deploymentName, tenantId, file = {} }, cb) {

    // callback is optional
    cb = cb || noop;

    if (!deploymentName) {
      return cb(
        new Error(
          'Failed to deploy process, deployment name must be provided.'
        )
      );
    }

    if (!file.fileType || !file.name || !file.path) {
      return cb(
        new Error(
          'Failed to deploy process, file name and path must be provided.'
        )
      );
    }

    if (!url) {
      return cb(
        new Error(
          'Failed to deploy process, endpoint url must not be empty.'
        )
      );
    }

    const form = new FormData();

    form.append('deployment-name', deploymentName);

    if (tenantId) {
      form.append('tenant-id', tenantId);
    }

    form.append(file.name, fs.createReadStream(file.path));

    fetch(url, { method: 'POST', body: form })
      .then(res => res.json())
      .then(json => cb(null, json))
      .catch(function(error) {
        cb(error);
      });
  };
}

module.exports = createDeployer;


function noop() { }