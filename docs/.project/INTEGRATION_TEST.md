> __Note:__ If possible, execute the integration test on our [released artifacts](https://github.com/camunda/camunda-modeler/releases).

# Integration Test

We use a number of pre-defined steps to ensure the stability of our releases through integration tests.

__Target:__ Perform tests on nightly builds on supported platforms.

### Test Procedure

* [ ] fetch [the release](https://github.com/camunda/camunda-modeler/releases)
* [ ] fetch [latest version of A11y-checker plugin](https://github.com/bpmn-io/camunda-modeler-plugin-a11y-checker)
* [ ] test changes of the release from the users' perspective end-2-end (e.g., include deployment where appropriate) (see [release issue](https://github.com/camunda/camunda-modeler/labels/release) and [changelog](https://github.com/camunda/camunda-modeler/blob/develop/CHANGELOG.md))
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
* [ ] add execution listener
* [ ] add input mapping
* [ ] verify results in XML tab

##### Keep implementation Details (Copy/Paste and Morph)

Based on the [test diagram](./test.bpmn.png):

* [ ] Add Form configuration (FormField + FormData) to "Inspect Invoice" UserTask
  * [ ] Copy / Paste task; properties are kept
  * [ ] Change task to ServiceTask; properties are gone from XML
  * [ ] Undo last step `CTRL + Z`; properties are back
  * [ ] Redo last step `CTRL + Y`; Task changed to Service Task without form properties
* [ ] Add Properties, Input/Output Mapping, `asyncBefore`, Retry Time Cycle and implementation to "Check" ServiceTask
  * [ ] Copy / Paste task; properties are kept
  * [ ] Change task to Send Task; properties are kept
  * [ ] Change task to UserTask; implementation property is gone from XML (except Retry Time Cycle, Input/output Mapping and `asyncBefore`)

#### Version chooser

* [ ] I can select the latest (alpha?) version of a diagram
  * [ ] For Camunda 7, BPMN, validation works
  * [ ] For Camunda 8, BPMN, validation works

#### Problems panel

* [ ] In a Camunda 8 BPMN the problems panel indicates missing implementation details
* [ ] In a Camunda 7 BPMN diagram the problems panel indicates missing HTTL (`Process > History time to live`)

#### DMN modeling

* [ ] create a new DMN diagram
* [ ] build [this diagram](./test.dmn.png) from scratch
* [ ] morph `Go on Holidays` to a decision table
* [ ] morph `Which Season` to a decision table
* [ ] morph `Which Region` to a literal expression
* [ ] click onto blue overlay on `Go on Holidays` jumps into table editing mode
* [ ] changing name reflects in DRD
* [ ] save file on disk as `test.dmn` from table editing mode
* [ ] save file on disk as `test2.dmn` from diagram mode
* [ ] both import correctly after save
* [ ] export DRD as SVG
* [ ] export DRD as PNG
* [ ] export DRD as JPG
* [ ] SVG, PNG and JPG exports open in browser

#### Forms modeling

* [ ] create a new Camunda Form
* [ ] build [this form](./test.form.png) from scratch
* [ ] add a regular expression (`^CAM-[0-9]+$`) to the invoice number field
* [ ] save file on disk as `test.form`
* [ ] file imports correctly after save
* [ ] Set the __Execution Platform Version__ to `Camunda 8.4`
  * [ ] An error is shown: `Expression` is not supported by Camunda Platform 8.4
  * [ ] Clicking on the error focuses the respective element
* [ ] Set the __Execution Platform Version__ to `Camunda 8.5` or higher
  * [ ] No errors are shown

#### BPMN + Camunda Forms deployment

* [ ] Create a simple `Start Event -> User Task -> End Event` process
* [ ] Create a simple form with id `foo`
* [ ] Reference the form in the user task via `Camunda Forms -> reference=foo`
* [ ] Verify that deployment of BPMN + Form file works

#### File system integration (platform specific)

* [ ] bindings register:
  * [ ] [Windows](https://github.com/camunda/camunda-modeler/tree/develop/resources/platform/win32/support)
  * [ ] [Linux](https://github.com/camunda/camunda-modeler/tree/develop/resources/platform/linux/support)
  * [ ] MacOS - done automatically
* [ ] external change detection works
  * [ ] change file in external editor
  * [ ] focus editor with file open
  * [ ] message to reload displays
* [ ] double click in FS opens file in editor (existing instance _?_)
  * [ ] `.bpmn`
  * [ ] `.dmn`
  * [ ] `.form`

#### Error Handling

* [ ] Open [`broken.bpmn`](./broken.bpmn) and verify a proper error message is shown (_No diagram to display_)

#### Accessibility

* [ ] No new issues were reported during the tests
* [ ] The modal opened via "Accessibility violations" button is empty

#### Installers (platform specific)

* [ ] MacOS
  * [ ] [Downloading archive](https://github.com/camunda/camunda-modeler/releases), extracting and starting application works
  * [ ] [Downloading DMG](https://github.com/camunda/camunda-modeler/releases), installing and starting it works

#### Other (platform specific)

* [ ] key bindings work (Mac = CMD, CMD+SHIFT+Z, Other = CTRL)
* [ ] restore workspace on reopen (diagrams, properties panel)
* [ ] drag and drop
* [ ] icons are present
* [ ] OS specific menus are being displayed
* [ ] menu bar (icons, correctly disabled + enabled)
* [ ] correct modeler version displayed in about menu
* [ ] [flags](https://docs.camunda.io/docs/components/modeler/desktop-modeler/flags/) work (e.g., start with `$ ./camunda-modeler --no-disable-cmmn` or provide flag in [`flags.json` file](https://github.com/camunda/camunda-modeler/tree/develop/docs/flags#configure-in-flagsjson) => CMMN diagrams can be created)
  * Note: On MacOS, you need to `$ cd Camunda\ Modeler.app/Contents/MacOS` first.
