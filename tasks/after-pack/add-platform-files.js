/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fs = require('fs');

const {
  copy: _copyGlob
} = require('cpx');

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

  const tag = version.endsWith('-nightly') ? 'master' : `v${version}`;

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
        if (encoding === 'utf8') {
          try {
            chunk = Buffer.from(
              chunk.toString(encoding).replace(/\$\{TAG\}/g, tag),
              'utf8'
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