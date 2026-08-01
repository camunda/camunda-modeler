#!/usr/bin/env node

/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const argv = require('yargs').argv;

const pkg = require('../app/package');

const fs = require('fs');
const path = require('path');

const yauzl = require('yauzl');
const tar = require('tar-stream');
const zlib = require('zlib');

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

const nightly = process.env.NIGHTLY;
const dev = process.env.NODE_ENV !== 'production';

const {
  win,
  linux,
  mac,
  'on-demand': onDemand
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
        'LICENSE.camunda-modeler.txt',
        'THIRD_PARTY_NOTICES.camunda-modeler.txt',
        'VERSION'
      ]
    }
  ],
  linux: [
    {
      name: 'camunda-modeler-${version}-linux-${arch}.tar.gz',
      archs: [ 'x64' ],
      contents: [
        'camunda-modeler-${version}-linux-${arch}/camunda-modeler',
        'camunda-modeler-${version}-linux-${arch}/support/xdg_register.sh',
        'camunda-modeler-${version}-linux-${arch}/VERSION'
      ],
      executables: [
        'camunda-modeler-${version}-linux-${arch}/camunda-modeler',
        'camunda-modeler-${version}-linux-${arch}/chrome_crashpad_handler',
        'camunda-modeler-${version}-linux-${arch}/chrome-sandbox',
        'camunda-modeler-${version}-linux-${arch}/support/xdg_register.sh'
      ]
    }
  ],
  mac: [
    {
      name: 'camunda-modeler-${version}-mac-${arch}.dmg',
      archs: [ 'x64', 'arm64' ]
    },
    {
      name: 'camunda-modeler-${version}-mac-${arch}.zip',
      archs: [ 'x64', 'arm64' ],
      contents: [
        'Camunda Modeler.app/Contents/Info.plist'
      ]
    }
  ]
};


let version = pkg.version;

if (nightly) {
  version = 'nightly';
} else if (onDemand) {
  version = process.env.BUILD_NAME;
} else if (dev) {
  version = `${version}-dev`;
}

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
      executables,
      archs
    } = expectedFile;

    return [
      ...expectedFiles,
      ...(archs.map(function(arch) {
        const replaceVariables = createReplacer(version, arch);

        return {
          name: replaceVariables(name),
          contents: contents && contents.map(replaceVariables),
          executables: executables && executables.map(replaceVariables)
        };
      }))
    ];
  }, []);
}

// helpers ///////////

// extract unix permission bits from zip external file attributes
// eslint-disable-next-line no-bitwise
const zipEntryMode = (entry) => (entry.externalFileAttributes >>> 16) & 0o777;

// whether the owner executable bit is set
// eslint-disable-next-line no-bitwise
const isExecutable = (mode) => Boolean(mode & 0o100);

function parseZipFile(sourceFile) {
  return new Promise((resolve, reject) => {
    let entries = [];
    yauzl.open(sourceFile, { lazyEntries: true }, (err, zipFile) => {
      if (err) {
        return reject(err);
      }
      zipFile.readEntry();
      zipFile.on('entry', function(entry) {
        entries.push({
          name: entry.fileName,
          mode: zipEntryMode(entry)
        });
        zipFile.readEntry();
      });

      zipFile.once('end', function() {
        resolve(entries);
        zipFile.close();
      });
    });
  });
}

function parseTarFile(sourceFile) {
  return new Promise((resolve) => {
    let entries = [];
    const extract = tar.extract();

    extract.on('entry', function(header, stream, next) {

      entries.push({
        name: header.name,
        mode: header.mode
      });

      stream.on('end', function() {
        next();
      });

      stream.resume();
    });

    extract.on('finish', function() {
      resolve(entries);
    });

    fs.createReadStream(sourceFile).pipe(zlib.createUnzip()).pipe(extract);
  });
}

function parseCompressedFile(sourceFile) {
  if (sourceFile.endsWith('.zip')) {
    return parseZipFile(sourceFile);
  }
  return parseTarFile(sourceFile);
}

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
        contents,
        executables
      } = distributable;

      const archivePath = `${distroDir}/${replaceVersion(name)}`;

      console.log(` - ${name}`);

      // (0): verify name exists
      if (!fs.existsSync(archivePath)) {
        throw new Error(`expected <${name}> to exist`);
      }


      // (1): verify correct contents + permissions for archive
      if (contents || executables) {

        const entries = await parseCompressedFile(archivePath);

        if (contents) {

          console.log('     > verifying contents');

          for (const expectedFile of contents) {

            const contained = entries.some(entry => entry.name === expectedFile);

            if (!contained) {
              throw new Error(`expected <${name}> to contain <${expectedFile}>`);
            }
          }

          console.log('     > ok');
        }

        if (executables) {

          console.log('     > verifying executables');

          for (const expectedFile of executables) {

            const entry = entries.find(entry => entry.name === expectedFile);

            if (!entry) {
              throw new Error(`expected <${name}> to contain <${expectedFile}>`);
            }

            // verify owner executable bit is set
            if (!isExecutable(entry.mode)) {
              throw new Error(
                `expected <${expectedFile}> in <${name}> to be executable, ` +
                `found mode <${entry.mode.toString(8)}>`
              );
            }
          }

          console.log('     > ok');
        }
      }
    }

    console.log();
  }
}
