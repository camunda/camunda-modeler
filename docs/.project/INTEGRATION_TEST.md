# Integration Test

We use a number of pre-defined steps to ensure the stability of our releases through integration tests.

__Target:__ Perform tests on nightly builds on supported platforms.


### Test Procedure

* [ ] `npm run all`
* [ ] test platform release from `distro` folder
* [ ] click like crazy (see [below](#test-checklist))


### Test Checklist

Manual integration test for now:

##### Modeling

* [ ] BPMN modeling
    * [ ] create a new BPMN diagram
    * [ ] build [this model](./test.png) from scratch
    * [ ] save file on disk as `test.bpmn`
    * [ ] save file with other file name on disk
    * [ ] export as SVG
    * [ ] export as PNG
    * [ ] export as JPG
    * [ ] SVG, PNG and JPG exports open in browser
* [ ] BPMN properties panel
    * [ ] configure service task in properties panel
    * [ ] add `async:before`
    * [ ] add executionn listener
    * [ ] add input mapping
    * [ ] verify results in XML tab
* [ ] BPMN copy/paste
    * [ ] create a new diagram
    * [ ] `CTRL + A` + `CTRL + C` in previously created diagram
    * [ ] remove start event in empty diagram
    * [ ] `CTRL + V` in empty diagram pastes all contents
* [ ] CMMN modeling
    * [ ] create a new CMMN diagram
    * [ ] save diagram on disk
    * [ ] save as SVG, PNG and JPG
    * [ ] SVG, PNG and JPG open in browser (i.e. Chrome)
* [ ] DMN modeling
    * ...

##### External Integration

* [ ] double click in FS opens file in editor (existing instance _?_)
    * [ ] `.bpmn`
    * [ ] `.cmmn`
    * [ ] `.dmn`
* [ ] saving files works
* [ ] key bindings work (Mac = CMD, CMD+SHIFT+Z, Other = CTRL)
* [ ] restore workspace on reopen (diagrams, properties panel)
* [ ] drag and drop
* [ ] icons are present
* [ ] OS specific menus are being displayed
* [ ] menu bar (icons, correctly disabled + enabled)
* [ ] external change detection works
    * [ ] change file in external editor
    * [ ] focus editor with file open
    * [ ] message to reload displays
 * [ ] correct modeler version displayed in about menu
