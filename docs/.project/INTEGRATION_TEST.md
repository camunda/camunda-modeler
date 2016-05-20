# Integration Test

We use a number of pre-defined steps to ensure the stability of our releases through integration tests.

__Target:__ Perform tests on nightly builds on supported platforms.


### Test Procedure

* [] `npm run all`
* [] test platform release from `distro` folder
* [] click like crazy (see [below](#test-checklist))


### Test Checklist

Manual integration test for now:

* [ ] double click in FS opens file in editor (existing instance _?_)
* [ ] creating files (BPMN, DMN, CMMN)
* [ ] opening files (BPMN, DMN, CMMN)
* [ ] saving files
* [ ] properties panel (BPMN)
* [ ] key bindings work (Mac = CMD, CMD+SHIFT+Z, Other = CTRL)
* [ ] restore workspace on reopen (diagrams, properties panel)
* [ ] drag and drop
* [ ] icons are present
* [ ] OS specific menus are being displayed
* [ ] menu bar (icons, correctly disabled + enabled)
* [ ] external change detection works
* [ ] image export (SVG, PNG) works
