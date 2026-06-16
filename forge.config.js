const path = require('path');
const fs = require('fs');

const execa = require('execa');

const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

const APP_DIR = path.resolve(__dirname, 'app');
const RESOURCES_SRC = path.resolve(__dirname, 'resources');
const RESOURCES_DEST = path.resolve(APP_DIR, 'resources');

module.exports = {
  packagerConfig: {
    asar: true,

    // Package from app/ so electron-packager prunes against app/package.json,
    // which is exactly the right production dependency list.
    dir: './app',

    name: 'Camunda Modeler',
    appBundleId: 'com.camunda.CamundaModeler',
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

    /**
     * Prepare app/ for packaging:
     * 1. Install production deps non-workspace so they land in app/node_modules/
     *    rather than being hoisted to root. electron-packager then prunes based on
     *    app/package.json — the correct production dependency list.
     * 2. Merge root resources/ into app/resources/ so the asar contains templates,
     *    diagrams and flags (app code looks for them at app.getAppPath() + '/resources').
     */
    prePackage: async () => {
      await execa('npm', [ 'install', '--workspaces=false' ], {
        stdio: 'inherit',
        cwd: APP_DIR,
      });

      fs.cpSync(RESOURCES_SRC, RESOURCES_DEST, { recursive: true });
    },

    /**
     * Restore app/ to its source state after packaging:
     * - Remove the resources that were merged in from root resources/
     *   (app/resources/icons and favicon.png are original; everything else was copied)
     * - app/node_modules/ is left as-is; it does not break the dev workflow since
     *   root node_modules/ still takes precedence via workspace hoisting.
     */
    postPackage: async () => {
      for (const entry of fs.readdirSync(RESOURCES_SRC)) {
        fs.rmSync(path.join(RESOURCES_DEST, entry), { recursive: true, force: true });
      }
    },
  },
};
