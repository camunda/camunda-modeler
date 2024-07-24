# How to Contribute

Great to see you! Help us out by [filing bugs or feature requests](#working-with-issues), assisting others in our [forums](https://forum.camunda.io/c/bpmn-modeling/) or by [contributing improvements](#contributing-improvements).

## Table of Contents

* [Working with Issues](#working-with-issues)
  * [Helping out](#helping-out)
* [Contributing Improvements](#contributing-improvements)
  * [Setting up the Project](#setting-up-the-project)
  * [Discussing Code Changes](#discussing-code-changes)
  * [Code Style](#code-style)
  * [Creating a Pull Request](#creating-a-pull-request)

## Working with Issues

We use our [issue tracker](https://github.com/camunda/camunda-modeler/issues) for project communication, discussion and planning.

### Helping out

* Share your perspective on issues
* Be helpful and respect others when commenting

## Contributing Improvements

Learn how to setup the project locally, make changes and contribute bug fixes and new features through pull requests.

### Setting up the Project

The project consists of two subpackages: the client and the app. Test suites for both of them can be run separately.

```plain
git clone git@github.com:camunda/camunda-modeler.git
cd camunda-modeler && npm i

// Run the test suite for both packages sequentially
npm test

// Run in dev mode
npm start

// Run tests, linter and build distro
npm run all
```

### Discussing Code Changes

Create a [pull request](#creating-a-pull-request) if you would like to have an in-depth discussion about some piece of code.

### Code Style

In addition to our automatically enforced [lint rules](https://github.com/bpmn-io/eslint-plugin-bpmn-io), please adhere to the following conventions:

* Use modules for client (`import` / `export (default)`)
* Use CommonJS for app (`require` / `module.exports`)

### Creating a Pull Request

We use pull requests for feature additions and bug fixes. If you are not yet familiar on how to create a pull request, [read this great guide](https://gun.io/blog/how-to-github-fork-branch-and-pull-request).

Some things that make it easier for us to accept your pull requests

* The code adheres to our conventions
  * spaces instead of tabs
  * single-quotes
  * ...
* The code is tested
* The `npm run all` build passes (executes tests + linting)
* The work is combined into a single commit
* The commit messages adhere to the [conventional commits guidelines](https://www.conventionalcommits.org)

We'd be glad to assist you if you do not get these things right in the first place.

:heart: from the bpmn.io team.
