const path = require('path');

const execa = require('execa');

const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    name: 'Camunda Modeler',
    appBundleId: 'com.camunda.CamundaModeler',

    // TODO: monorepo workspace hoisting means production deps of app/ are pruned
    // with the default prune:true. Fix: prePackage hook that flattens app/ deps
    // via `npm install --workspaces=false`. See knowledge/02-monorepo-prune-issue.md.
    prune: false,
  },
  rebuildConfig: {},
  makers: [
    {
      // Windows: zip (matches electron-builder target)
      name: '@electron-forge/maker-zip',
      platforms: [ 'win32' ],
    },
    {
      // macOS: zip (matches electron-builder target)
      // TODO: add @electron-forge/maker-dmg for the dmg target
      name: '@electron-forge/maker-zip',
      platforms: [ 'darwin' ],
    },
    {
      // Linux: deb (electron-builder used tar.gz — no native tar.gz maker in Forge)
      // TODO: write a custom maker or postMake hook that repackages as tar.gz
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          categories: [ 'Development' ],
        },
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  hooks: {
    /**
     * Build the preload bundle and the renderer before packaging or starting.
     * This keeps the existing webpack pipeline intact — Forge only takes over
     * packaging and distribution, not bundling.
     *
     * Note: for active development use `npm run dev` (parallel webpack watch +
     * electron) rather than `electron-forge start`, which does a full build each time.
     */
    generateAssets: async () => {
      await execa('npm', [ 'run', 'preload:build' ], { stdio: 'inherit', cwd: path.resolve(__dirname) });
      await execa('npm', [ 'run', 'client:build' ], { stdio: 'inherit', cwd: path.resolve(__dirname) });
    },
  },
};
