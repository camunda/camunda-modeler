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
  pr
} = argv;

// in case of --nightly, update all package versions to the
// next minor version with the nightly preid. This will
// result in app and client being versioned like `v1.2.0-nightly.20191121`.

const version = (pr || nightly) && getVersion(pkg, {
  nightly,
  pr
});

if (version) {

  const lernaPublishArgs = [
    'publish',
    `--repo-version=${version}`,
    '--skip-npm',
    '--skip-git',
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
} else if (pr) {
  replaceVersion = s => s.replace('${version}', `pr-${pr}`);
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
  argv.linux ? 'linux': null,
  argv.mac ? 'mac' : null
].filter(f => f);

const platformOptions = platforms.map(p => `--${p}`);

let publishOptions = getPublishOptions(publish, nightly, pr);

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

function getPublishOptions(publish, nightly, pr) {
  if (typeof publish === undefined) {
    return [];
  }

  if (nightly) {
    return [
      `--publish=${ publish ? 'always' : 'never' }`,
      publish && '-c.publish.provider=s3',
      publish && '-c.publish.bucket=camunda-modeler-nightly'
    ].filter(f => f);
  } else if (pr) {
    return [
      `--publish=${ publish ? 'always' : 'never' }`,
      publish && '-c.publish.provider=s3',
      publish && '-c.publish.bucket=camunda-modeler-pr',
      publish && `-c.publish.path=pr-${pr}`,
      publish && '-c.publish.endpoint=http://127.0.0.1:4568'
    ].filter(f => f);
  }

  return [
    `--publish=${ publish ? 'always' : 'never' }`
  ];
}
