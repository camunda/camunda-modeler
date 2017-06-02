# Integration Test

We use a number of pre-defined steps to ensure the stability of our releases through integration tests.

__Target:__ Perform tests on nightly builds on supported platforms.


### Test Procedure

* [ ] fetch [latest release/nightly](https://camunda.org/release/camunda-modeler/)
* [ ] click like crazy (see [below](#test-checklist))


### Test Checklist

Manual integration tests:

#### BPMN Modeling

* [ ] create a new BPMN diagram
* [ ] build [this diagram](./test.bpmn.png) from scratch
* [ ] save file on disk as `test.bpmn`
* [ ] save file with other file name on disk
* [ ] export as SVG
* [ ] export as PNG
* [ ] export as JPG
* [ ] SVG, PNG and JPG exports open in browser

##### Copy/Paste

* [ ] create a new diagram
* [ ] `CTRL + A` + `CTRL + C` in previously created diagram
* [ ] remove start event in empty diagram
* [ ] `CTRL + V` in empty diagram pastes all contents

##### BPMN properties panel

* [ ] configure service task in properties panel
* [ ] add `async:before`
* [ ] add executionn listener
* [ ] add input mapping
* [ ] verify results in XML tab

##### Keep implementation Details (Copy/Paste and Morph)

Based on the [test diagram](./test.bpmn.png):

* [ ] Add Form configuration (FormField + FormData) to "Inspect Invoice" UserTask
    * [ ] Copy / Paste task; properties are kept
    * [ ] Change task to ServiceTask; properties are gone from XML
* [ ] Add Properties, Input/Output Mapping, `asyncBefore` and implementation to "Check" ServiceTask
    * [ ] Copy / Paste task; properties are kept
    * [ ] Change task to BusinessRuleTask; properties are kept
    * [ ] Change task to UserTask; implementation property is gone from XML


####  CMMN modeling

* [ ] create a new CMMN diagram
* [ ] save diagram on disk
* [ ] save as SVG, PNG and JPG
* [ ] SVG, PNG and JPG open in browser (i.e. Chrome)


#### DMN modeling

* [ ] create a new DMN diagram
* [ ] build [this diagram](./test.dmn.png) from scratch
* [ ] morph `Go on Holidays` to a decision table
* [ ] morph `Which Season` to a decision table
* [ ] moprh `Which Region` to a literal expression
* [ ] double click onto green overlay on `Go on Holidays` jumps into table editing mode
* [ ] changing name reflects in DRD
* [ ] save file on disk as `test.dmn` from table editing mode
* [ ] save file on disk as `test2.dmn` from diagram mode
* [ ] both import correctly after save
* [ ] export DRD as SVG
* [ ] export DRD as PNG
* [ ] export DRD as JPG
* [ ] SVG, PNG and JPG exports open in browser


#### FS integration (platform specific)

* [ ] external change detection works
    * [ ] change file in external editor
    * [ ] focus editor with file open
    * [ ] message to reload displays
* [ ] double click in FS opens file in editor (existing instance _?_)
    * [ ] `.bpmn`
    * [ ] `.cmmn`
    * [ ] `.dmn`


#### Other (platform specific)

* [ ] key bindings work (Mac = CMD, CMD+SHIFT+Z, Other = CTRL)
* [ ] restore workspace on reopen (diagrams, properties panel)
* [ ] drag and drop
* [ ] icons are present
* [ ] OS specific menus are being displayed
* [ ] menu bar (icons, correctly disabled + enabled)
* [ ] correct modeler version displayed in about menu
