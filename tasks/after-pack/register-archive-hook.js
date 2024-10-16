/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const archiver = require('archiver');

const fs = require('fs');

/* eslint no-undef: 0, no-unused-vars: 0 */

/**
 * An initializer that extends electron-builder to
 * suite our needs:
 *
 *   * consistent archive contents + naming on
 *     all platforms
 *
 * @param {PackagerContext} context
 *
 * @return {Promise<any>}
 */
module.exports = function registerArchiveHook(context) {

  const {
    targets,
    packager
  } = context;

  const {
    platform
  } = packager;

  if (packager.__extended) {
    return;
  }

  packager.__extended = true;

  targets.forEach(function(target) {

    postBuild(target, async function(outDir, arch) {

      const platformName = platform.name === 'windows' ? 'win' : platform.name;
      const targetName = target.name;

      const artifactName = packager.expandArtifactNamePattern(
        target.options, targetName, arch, 'NOOP', false
      );

      const unpackedPath =
        `dist/${ platformName }-${ arch === 0 ? 'ia32-' : ''}unpacked`;

      const archivePath = `dist/${artifactName}`;

      // Linux + Mac distro
      if (targetName === 'tar.gz') {
        await archive(unpackedPath, archivePath, 'tar.gz');
      }

      // Windows distro
      if (targetName === 'zip' && platformName === 'win') {
        await archive(unpackedPath, archivePath, 'zip');
      }
    });

  });

};


/**
 * Register target postBuild hook.
 */
function postBuild(target, fn) {

  const originalBuild = target.build;

  target.build = async function(appOutDir, arch) {
    await originalBuild.call(target, appOutDir, arch);

    await fn(appOutDir, arch);
  };
}


async function archive(path, archivePath, archiveType) {

  console.log(`  • re-building     file=${archivePath}, archiveType=${archiveType}`);

  await del(archivePath);

  return new Promise(function(resolve, reject) {
    var archive,
        output;

    if (archiveType === 'zip') {
      archive = archiver('zip', {
        zlib: {
          level: 9
        }
      });
    } else {
      archive = archiver('tar', {
        gzip: true,
        gzipOptions: {
          level: 9
        }
      });
    }

    output = fs.createWriteStream(archivePath);

    archive.pipe(output);
    archive.on('end', resolve);
    archive.on('error', reject);

    archive.directory(path, 'camunda-modeler').finalize();
  });
}

async function del(path) {
  const delModule = await import('del');

  return delModule.deleteAsync(path);
}
