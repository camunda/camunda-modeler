#!/usr/bin/env node

const argv = require('yargs').argv;

const exec = require('execa').sync;

const getVersion = require('../app/util/get-version');

const pkg = require('../app/package');

const {
  nightly,
  publish
} = argv;

let nightlyVersion = nightly && getVersion(pkg, {
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
Setting ${pkg.name} version to nightly

---

lerna ${ publishNightlyArgs.join(' ') }

---
`);

  exec('lerna', publishNightlyArgs, {
    stdio: 'inherit'
  });
}

const replaceVersion = nightlyVersion
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
  `--publish=${ publish ? 'always' : 'never' }`
] : [];

const signingOptions = [
  `-c.forceCodeSigning=${!!publish}`
];

if (publish && (argv.ia32 || argv.x64)) {
  console.error('Do not override arch; is manually pinned');
  process.exit(1);
}

const archOptions = [ 'x64', 'ia32' ].filter(a => argv[a]).map(a => `--${a}`);

const args = [
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