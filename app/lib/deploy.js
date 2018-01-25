'use strict';

var request = require('request');
var fs = require('fs');

module.exports = function(options) {
  var data   = options.data,
      done   = options.done,
      config = options.config;

  var file = data.file || {};
  if (!file.fileType || !file.name || !file.path) {
    return done('Failed to deploy process, file name and path must be provided.');
  }

  var url = (config.get('workspace').endpoints || [])[0];
  if (!url) {
    return done('Failed to deploy process, endpoint url must not be empty.');
  }

  var deploymentName = file.name.split('.'+file.fileType)[0];
  var formData = { 'deployment-name': deploymentName };
  formData[file.name] = fs.createReadStream(file.path);

  var DEPLOY_CONFIG = {
    url: url,
    formData: formData
  };

  request.post(DEPLOY_CONFIG, function(err, res, body) {
    if (err) {
      return done(JSON.stringify(err));
    } else if (res.statusCode !== 200) {
      return done('Failed to deploy process, server responded with status code ' + res.statusCode + '.');
    }
    return done(err, body);
  });
};
