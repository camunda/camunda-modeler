# Release

Prerequisites:

* `rm -rf node_modules && npm install`
* integration test

Actual release:

* bump `package.json` version
* commit `git commit -m "chore(project): release v{VERSION}"`
* tag release `git tag v{VERSION}`
* `git push && git push --tags`

Our CI infrastructure will do the rest, i.e build the final release artifacts based on the newly created tag.
