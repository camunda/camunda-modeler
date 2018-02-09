'use strict';

var fs = require('fs');

var got = require('got');
var FormData = require('form-data');


module.exports = function(options, done) {
  var data = options.data,
      config = options.config;

  var file = data.file || {};
  if (!file.fileType || !file.name || !file.path) {
    return done(
      new Error(
        'Failed to deploy process, file name and path must be provided.'
      )
    );
  }

  var url = (config.get('workspace').endpoints || [])[0];
  if (!url) {
    return done(
      new Error(
        'Failed to deploy process, endpoint url must not be empty.'
      )
    );
  }

  var deploymentName = file.name.split('.' + file.fileType)[0];

  const form = new FormData();

  form.append('deployment-name', deploymentName);
  form.append(file.name, fs.createReadStream(file.path));

  got.post(url, {
    body: form
  }).then(function(response) {
    done(null, response.body);
  }).catch(function(error) {
    done(error);
  });
};
