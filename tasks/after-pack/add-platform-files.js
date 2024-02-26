/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const fs = require('fs');

const {
  copy: _copyGlob
} = require('cpx2');

const { promisify } = require('util');

const {
  Transform: TransformStream
} = require('stream');

const copyGlob = promisify(_copyGlob);

const {
  name,
  version
} = require('../../app/package');


module.exports = async function(context) {

  const {
    appOutDir,
    electronPlatformName
  } = context;

  const tag = version.endsWith('-nightly') ? 'main' : `v${version}`;

  const options = {
    transform: replaceTag(tag)
  };

  await copyGlob('resources/platform/base/**', appOutDir, options);
  await copyGlob(`resources/platform/${electronPlatformName}/**`, appOutDir, options);

  copy('LICENSE', `${appOutDir}/LICENSE.${name}.txt`);
  copy('THIRD_PARTY_NOTICES', `${appOutDir}/THIRD_PARTY_NOTICES.${name}.txt`);
};


// helpers ///////////////////////

function copy(src, dest) {
  fs.copyFileSync(src, dest);
}

function replaceTag(tag) {

  return (filename) => {
    return new TransformStream({
      objectMode: true,
      transform(chunk, encoding, callback) {

        // only handle text files
        if (/(\.txt|\.md)$/.test(filename)) {
          try {
            chunk = Buffer.from(
              chunk.toString(encoding).replace(/\$\{TAG\}/g, tag),
              encoding
            );
          } catch (e) {
            return callback(e);
          }
        }

        this.push(chunk);
        callback();
      }
    });
  };
}
