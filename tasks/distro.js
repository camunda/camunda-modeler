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

const argv = require('mri')(process.argv);

const exec = require('execa').sync;

const getVersion = require('../app/util/get-version');

const pkg = require('../app/package');

const {
  nightly,
  publish,
  config,
  'on-demand': onDemand
} = argv;

console.log('PUBLISH:', typeof publish);

// in case of --nightly, update all package versions to the
// next minor version with the nightly preid. This will
// result in app and client being versioned like `v1.2.0-nightly.20191121`.
// A custom build name can also be used instead.
let buildName;
if (onDemand) {
  buildName = process.env.BUILD_NAME;
}

const version = (onDemand || nightly) && getVersion(pkg, {
  nightly,
  buildName
});

if (version) {

  const lernaPublishArgs = [
    'version',
    `${version}`,
    '--no-git-tag-version',
    '--no-push',
    '--yes'
  ];

  console.log(`
Bumping ${pkg.name} version to ${version}

---

lerna ${ lernaPublishArgs.join(' ') }

---
`);

  exec('lerna', lernaPublishArgs, {
    stdio: 'inherit'
  });
}

// ensure nightly releases are named ${appName}-nightly-${...}
// this allows expert users to always fetch the nightly artifacts
// from the same url

let replaceVersion = s => s;

if (nightly) {
  replaceVersion = s => s.replace('${version}', 'nightly');
} else if (onDemand) {
  replaceVersion = s => s.replace('${version}', buildName);
}

const artifactOptions = [
  '-c.artifactName=${name}-${version}-${os}-${arch}.${ext}',
  '-c.dmg.artifactName=${name}-${version}-${os}.${ext}',
  '-c.nsis.artifactName=${name}-${version}-${os}-setup.${ext}',
  '-c.nsisWeb.artifactName=${name}-${version}-${os}-web-setup.${ext}',
  argv.compress === false && '-c.compression=store'
].filter(f => f).map(replaceVersion);

// interpret shorthand target options
// --win, --linux, --mac
const platforms = [
  argv.win ? 'win' : null,
  argv.linux ? 'linux' : null,
  argv.mac ? 'mac' : null
].filter(f => f);

const platformOptions = platforms.map(p => `--${p}`);

const publishOptions = getPublishOptions(publish, onDemand);

const signingOptions = [
  `-c.forceCodeSigning=${false}`
];

const certificateFingerprint = process.env.WIN_CSC_FINGERPRINT;
if (certificateFingerprint) {
  signingOptions.push(`-c.win.certificateSha1=${certificateFingerprint}`);
}

if (publish && (argv.ia32 || argv.x64)) {
  console.error('Do not override arch; is manually pinned');
  process.exit(1);
}

const archOptions = [ 'x64', 'ia32' ].filter(a => argv[a]).map(a => `--${a}`);

const extraMetadataOptions = [
  `-c.extraMetadata.SENTRY_DSN=${ process.env.SENTRY_DSN || null }`
];

const args = [
  ...[ config && `-c=${config}` ].filter(f => f),
  ...archOptions,
  ...signingOptions,
  ...platformOptions,
  ...publishOptions,
  ...artifactOptions,
  ...extraMetadataOptions
];

console.log(`
Building ${pkg.name} distro

---

  version: ${version || pkg.version}
  platforms: [${ platforms.length && platforms || 'current' }]
  publish: ${publish || false}

---

electron-builder ${ args.join(' ') }
`
);

exec('electron-builder', args, {
  stdio: 'inherit'
});

function getPublishOptions(publish, onDemand) {
  if (onDemand) {
    const bucket = process.env.AWS_BUCKET;

    // region has to be set explicitly to avoid permissions problems
    const region = process.env.AWS_REGION;

    return [
      `--publish=${ publish ? 'always' : 'never' }`,
      publish && '-c.publish.provider=s3',
      publish && `-c.publish.bucket=${bucket}`,
      publish && buildName && `-c.publish.path=${buildName}`,
      publish && region && `-c.publish.region=${region}`
    ].filter(f => f);
  }

  return [
    `--publish=${ publish ? 'always' : 'never' }`
  ];
}
