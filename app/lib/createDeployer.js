'use strict';

/**
 * Create deploy API factory fn.
 */
function createDeployer({ fetch, fs, FormData }) {

  /**
   * Deploy diagram to the given endpoint URL.
   */
  return async function deploy(url, { deploymentName, tenantId, file = {} }, cb) {

    try {
      // callback is optional
      cb = cb || noop;

      if (!deploymentName) {
        throw new Error('Failed to deploy process, deployment name must be provided.');
      }

      if (!file.name || !file.path) {
        throw new Error('Failed to deploy process, file name and path must be provided.');
      }

      if (!url) {
        throw new Error('Failed to deploy process, endpoint url must not be empty.');
      }

      const form = new FormData();

      form.append('deployment-name', deploymentName);

      if (tenantId) {
        form.append('tenant-id', tenantId);
      }

      form.append(file.name, fs.createReadStream(file.path));

      const serverResponse = await fetch(url, { method: 'POST', body: form });

      if (!serverResponse.ok) {
        const error = await getErrorFromResponse(serverResponse);
        throw error;
      }

      let response;

      try {
        response = await serverResponse.json();
      } catch (error) {
        response = serverResponse.statusText;
      }

      return cb(null, response);
    } catch (error) {
      error.deploymentName = deploymentName;

      return cb(error);
    }

  };
}

module.exports = createDeployer;


// helpers //////
function noop() { }


async function getErrorFromResponse(response) {
  const error = new Error();

  try {
    const body = await response.json();
    error.message = body.message;
  } catch (_) {
    error.message = response.statusText;
  }

  error.status = response.status;
  error.statusText = response.statusText;
  error.url = response.url;

  return error;
}
