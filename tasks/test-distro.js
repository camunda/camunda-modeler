#!/usr/bin/env node

/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const argv = require('yargs').argv;

const pkg = require('../app/package');

const fs = require('fs');
const path = require('path');

const decompress = require('decompress');

function currentPlatform() {
  const platform = require('os').platform();

  if (platform === 'win32') {
    return 'win';
  }

  if (platform === 'darwin') {
    return 'mac';
  }

  return 'linux';
}

const {
  nightly,
  win,
  linux,
  mac
} = argv;

const archs = [
  (argv.ia32 || !argv.x64) && 'ia32',
  (argv.x64 || !argv.ia32) && 'x64'
].filter(f => f);

const platforms = [
  win && 'win',
  linux && 'linux',
  mac && 'mac',
  !(win || linux || mac) && currentPlatform()
].filter(f => f);

const expectedFiles = {
  win: [
    {
      name: 'camunda-modeler-${version}-win-${arch}.zip',
      archs,
      contents: [
        'Camunda Modeler.exe',
        'support/register_fileassoc.bat',
        'VERSION'
      ]
    }
  ],
  linux: [
    {
      name: 'camunda-modeler-${version}-linux-${arch}.tar.gz',
      archs,
      contents: [
        'camunda-modeler-${version}-linux-${arch}/camunda-modeler',
        'camunda-modeler-${version}-linux-${arch}/support/xdg_register.sh',
        'camunda-modeler-${version}-linux-${arch}/VERSION'
      ]
    }
  ],
  mac: [
    'camunda-modeler-${version}-mac.dmg',
    {
      name: 'camunda-modeler-${version}-mac.zip',
      archs: [ 'x64' ],
      contents: [
        'Camunda Modeler.app/Contents/Info.plist'
      ]
    }
  ]
};


const version = nightly ? 'nightly' : pkg.version;

// execute tests
verifyArchives(platforms, version).then(
  () => console.log('SUCCESS'),
  (e) => {
    console.error('FAILURE', e);
    process.exit(1);
  }
);


function expandExpected(platform, version) {

  function createReplacer(version, arch) {
    return function(name) {
      return name
        .replace('${version}', version)
        .replace('${arch}', arch);
    };
  }

  return expectedFiles[platform].reduce(function(expectedFiles, expectedFile) {

    if (typeof expectedFile === 'string') {
      return [
        ...expectedFiles,
        { name: createReplacer(version, '')(expectedFile) }
      ];
    }

    const {
      name,
      contents,
      archs
    } = expectedFile;

    return [
      ...expectedFiles,
      ...(archs.map(function(arch) {
        const replaceVariables = createReplacer(version, arch);

        return {
          name: replaceVariables(name),
          contents: contents && contents.map(replaceVariables)
        };
      }))
    ];
  }, []);
}

// helpers ///////////


async function verifyArchives(platforms, version) {

  function replaceVersion(name) {
    return name.replace('${version}', version);
  }

  const distroDir = path.join(__dirname, '../dist');

  for (const platform of platforms) {

    const distributables = expandExpected(platform, version);

    console.log(`Verifying <${platform}> distributables`);
    console.log();

    for (const distributable of distributables) {

      const {
        name,
        contents
      } = distributable;

      const archivePath = `${distroDir}/${replaceVersion(name)}`;

      console.log(` - ${name}`);

      // (0): verify name exists
      if (!fs.existsSync(archivePath)) {
        throw new Error(`expected <${name}> to exist`);
      }


      // (1): verify correct contents for archive
      if (contents) {

        console.log('     > extracting');

        const files = await decompress(archivePath, `${archivePath}_extracted`);

        console.log('     > verifying contents');

        for (const expectedFile of contents) {

          const contained = files.some(file => file.path === expectedFile);

          if (!contained) {
            throw new Error(`expected <${name}> to contain <${expectedFile}>`);
          }
        }

        console.log('     > ok');
      }
    }

    console.log();
  }
}