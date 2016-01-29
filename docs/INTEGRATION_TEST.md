# Integration Test

Run on nightly builds on supported platforms.


### Test Checklist

Manual integration test for now:

* [ ] double click in FS opens file in editor (existing instance _?_)
* [ ] creating files (BPMN, DMN)
* [ ] opening files (BPMN, DMN)
* [ ] saving files
* [ ] properties panel (BPMN)
* [ ] key bindings work (Mac = CMD, CMD+SHIFT+Z, Other = CTRL)
* [ ] restore workspace on reopen (diagrams, properties panel)
* [ ] drag and drop
* [ ] icons are present
* [ ] OS specific menus are being displayed
* [ ] menu bar (icons, correctly disabled + enabled)


Test result artifacts:

* `npm run all`
* test platform release in `distro` folder
* click like crazy
