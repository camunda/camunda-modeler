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

const {
  nightly,
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


let version = pkg.version;

if (nightly) {
  version = 'nightly';
} else if (onDemand) {
  version = process.env.BUILD_NAME;
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

function parseZipFile(sourceFile) {
  return new Promise((resolve, reject) => {
    let fileNames = [];
    yauzl.open(sourceFile, { lazyEntries: true }, (err, zipFile) => {
      if (err) {
        return reject(err);
      }
      zipFile.readEntry();
      zipFile.on('entry', function(entry) {
        fileNames.push(entry.fileName);
        zipFile.readEntry();
      });

      zipFile.once('end', function() {
        resolve(fileNames);
        zipFile.close();
      });
    });
  });
}

function parseTarFile(sourceFile) {
  return new Promise((resolve) => {
    let fileNames = [];
    const extract = tar.extract();

    extract.on('entry', function(header, stream, next) {

      fileNames.push(header.name);

      stream.on('end', function() {
        next();
      });

      stream.resume();
    });

    extract.on('finish', function() {
      resolve(fileNames);
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

        console.log('     > verifying contents');

        const files = await parseCompressedFile(archivePath);

        for (const expectedFile of contents) {

          const contained = files.some(file => file === expectedFile);

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
