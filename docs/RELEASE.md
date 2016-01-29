# Release

Prerequisites:

* `rm -rf node_modules && npm install`
* integration test

Actual release:

* `npm version minor -m chore(project): release %s`
* `git push && git push --tags`

Our CI infrastructure will do the rest, i.e build the final release artifacts based on the newly created tag.
