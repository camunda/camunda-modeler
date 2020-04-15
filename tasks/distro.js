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
  config
} = argv;

// in case of --nightly, update all package versions to the
// next minor version with the nightly preid. This will
// result in app and client being versioned like `v1.2.0-nightly.20191121`.

const nightlyVersion = nightly && getVersion(pkg, {
  nightly: 'nightly'
});

if (nightlyVersion) {

  const publishNightlyArgs = [
    'publish',
    `--repo-version=${nightlyVersion}`,
    '--skip-npm',
    '--skip-git',
    '--yes'
  ];

  console.log(`
Bumping ${pkg.name} version to ${nightlyVersion}

---

lerna ${ publishNightlyArgs.join(' ') }

---
`);

  exec('lerna', publishNightlyArgs, {
    stdio: 'inherit'
  });
}

// ensure nightly releases are named ${appName}-nightly-${...}
// this allows expert users to always fetch the nightly artifacts
// from the same url

const replaceVersion = nightly
  ? s => s.replace('${version}', 'nightly')
  : s => s;

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

const publishOptions = typeof publish !== undefined ? [
  `--publish=${ publish ? 'always' : 'never' }`,
  publish && nightly && '-c.publish.provider=s3',
  publish && nightly && '-c.publish.bucket=camunda-modeler-nightly'
].filter(f => f) : [];

const signingOptions = [
  `-c.forceCodeSigning=${false}`
];

if (argv.certificateFingerprint) {
  signingOptions.push(`-c.win.certificateSha1=${argv.certificateFingerprint}`);
}

if (publish && (argv.ia32 || argv.x64)) {
  console.error('Do not override arch; is manually pinned');
  process.exit(1);
}

const archOptions = [ 'x64', 'ia32' ].filter(a => argv[a]).map(a => `--${a}`);

const args = [
  ...[ config && `-c=${config}` ].filter(f => f),
  ...archOptions,
  ...signingOptions,
  ...platformOptions,
  ...publishOptions,
  ...artifactOptions
];

console.log(`
Building ${pkg.name} distro

---

  version: ${nightlyVersion || pkg.version}
  platforms: [${ platforms.length && platforms || 'current' }]
  publish: ${publish || false}

---

electron-builder ${ args.join(' ') }
`
);

exec('electron-builder', args, {
  stdio: 'inherit'
});
