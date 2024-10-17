/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const fs = require('fs');
const { shellSync } = require('execa');
const path = require('path');

const customLinkersMap = {
  'bpmn-io/bpmn-js': linkWithYarn,
  'bpmn-io/dmn-js': linkDmnJs,
  'bpmn-io/diagram-js': linkWithYarn,
  'bpmn-io/form-js': linkFormJs
};

const builderDir = path.join(__dirname, '..');
const dependenciesDir = path.join(__dirname, '.linked-dependencies');

const dependencies = getDependencies();
linkDependencies(dependencies);

/**
 * @typedef Dependency
 * @property {string} repo
 * @property {string} ref - branch or tag or commit
 */


/**
 * Parse and return dependencies stored in LINKED_DEPENDENCIES environment variable.
 * It expects that dependencies are passed in form of:
 * `LINKED_DEPENDENCIES=bpmn-io/dmn-js#main,bpmn-io/bpmn-js#develop`
 *
 * @returns {Dependency[]>}
 */
function getDependencies() {
  const rawDependencies = process.env.LINKED_DEPENDENCIES || '';
  const dependenciesList = rawDependencies.split(',').filter(Boolean);

  const unsortedDependencies = dependenciesList.map(dependency => {
    const [ repo, ref ] = dependency.split('#');

    return { repo, ref };
  });

  return sortDependencies(unsortedDependencies);
}

function sortDependencies(dependencies) {
  const diagramJs = dependencies.find(({ repo }) => repo === 'bpmn-io/diagram-js');

  if (diagramJs) {
    dependencies.splice(dependencies.indexOf(diagramJs), 1);
    dependencies.unshift(diagramJs);
  }

  return dependencies;
}

/**
 * Link client dependencies from specified repo and reference.
 *
 * @param {Dependency[]} dependencies
 */
async function linkDependencies(dependencies) {
  if (!dependencies.length) {
    console.log('No dependencies to link detected, exiting.');
    return;
  }

  await del(dependenciesDir);
  fs.mkdirSync(dependenciesDir);

  for (const dependency of dependencies) {
    const link = customLinkersMap[dependency.repo] || linkFromGitHub;
    const dependencyName = `${dependency.repo}#${dependency.ref}`;

    console.log(`Linking ${dependencyName}...`);
    try {
      await link(dependency);
      console.log(`Linked ${dependencyName}.`);
    } catch (error) {
      console.error(`Unable to link ${dependencyName} due to error:`, error);
      console.log('Exiting.');
      process.exit(1);
    }
  }
}

/**
 *
 * @param {Dependency} dependency
 */
function linkFromGitHub({ repo, ref }) {
  exec(`npm i ${repo}#${ref}`, { cwd: builderDir });
}

/**
 *
 * @param {Dependency} dependency
 */
function linkDmnJs({ repo, ref }) {
  gitClone(repo);
  console.log(`Cloned ${repo}.`);

  const rootDir = path.join(dependenciesDir, 'dmn-js');
  exec(`git checkout ${ref}`, { cwd: rootDir });
  console.log(`Checked out ${ref}.`);

  exec('npm ci', { cwd: rootDir });
  console.log('Installed dependencies.');

  try {
    exec('yarn link diagram-js', { cwd: rootDir });
    console.log('Linked diagram-js.');
  } catch (error) {
    console.log('Unable to link diagram-js.');
  }

  exec('npm run build-distro', { cwd: rootDir });
  console.log('Built distro.');

  const dmnJsDir = path.join(rootDir, 'packages', 'dmn-js');
  exec('yarn link', { cwd: dmnJsDir });

  exec('yarn link dmn-js', { cwd: builderDir });
}

/**
 *
 * @param {Dependency} dependency
 */
function linkWithYarn({ repo, ref }) {
  const targetDir = toDirName(repo);

  gitClone(repo, targetDir);
  console.log(`Cloned ${repo}.`);

  const rootDir = path.join(dependenciesDir, targetDir);
  exec(`git checkout ${ref}`, { cwd: rootDir });
  console.log(`Checked out ${ref}.`);

  exec('npm ci', { cwd: rootDir });
  console.log('Installed dependencies.');

  exec('yarn link', { cwd: rootDir });

  const packageJson = path.join(rootDir, 'package.json');
  const packageName = getPackageName(packageJson);

  exec(`yarn link ${packageName}`, { cwd: builderDir });

  console.log(`Linked ${packageName}.`);
}

/**
 *
 * @param {Dependency} dependency
 */
function linkFormJs({ repo, ref }) {
  gitClone(repo);
  console.log(`Cloned ${repo}.`);

  const rootDir = path.join(dependenciesDir, 'form-js');
  exec(`git checkout ${ref}`, { cwd: rootDir });
  console.log(`Checked out ${ref}.`);

  exec('npm ci', { cwd: rootDir });
  console.log('Installed dependencies.');

  try {
    exec('yarn link diagram-js', { cwd: rootDir });
    console.log('Linked diagram-js.');
  } catch (error) {
    console.log('Unable to link diagram-js.');
  }

  exec('npm run build-distro', { cwd: rootDir });
  console.log('Built distro.');

  const formJsDir = path.join(rootDir, 'packages', 'form-js');
  exec('yarn link', { cwd: formJsDir });

  exec('yarn link @bpmn-io/form-js', { cwd: builderDir });
}

function gitClone(repo, target = toDirName(repo)) {
  const repoUrl = getRepoUrl(repo);

  exec(`git clone ${repoUrl} ${target}`, { cwd: dependenciesDir });
}

function getRepoUrl(repo) {
  return `https://github.com/${repo}.git`;
}

function toDirName(repo) {
  return repo.replaceAll('/', '-');
}

function getPackageName(jsonPath) {
  const packageJson = JSON.parse(fs.readFileSync(jsonPath, { encoding: 'utf8' }));

  return packageJson.name;
}

async function del(path) {
  const delModule = await import('del');

  return delModule.deleteAsync(path);
}

function exec(...args) {
  const { stdout, stderr } = shellSync(...args);

  stdout && console.log(stdout);
  stderr && console.error(stderr);
}
