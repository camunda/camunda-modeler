# Changelog

All notable changes to the [Camunda Modeler](https://github.com/camunda/camunda-modeler) are documented here. We use [semantic versioning](http://semver.org/) for releases.

## Unreleased

___Note:__ Yet to be released changes appear here._

## 2.0.2

* `FIX`: fix native copy and paste in DMN decision tables on MacOS ([#758](https://github.com/camunda/camunda-modeler/issues/758))

## 2.0.1

* `FIX`: correct MacOS app icon size ([#901](https://github.com/camunda/camunda-modeler/issues/901))

## 2.0.0

* `CHORE`: update to `bpmn-js-properties-panel@0.26.2`

## 2.0.0-6

_This is a pre-release_.

* `CHORE`: update to `bpmn-js@2.5.1`

## 2.0.0-5

_This is a pre-release_.

* `CHORE`: drop unused dependency

## 2.0.0-4

_This is a pre-release_.

* `CHORE`: bump `electron` version

## 2.0.0-3

_This is a pre-release_.

#### General

* `CHORE`: drop Windows installer, as it is currently broken (cf. [#867](https://github.com/camunda/camunda-modeler/issues/867))

#### BPMN

* `FEAT`: snap `bpmn:Event` to center when creating message flows ([#887](https://github.com/camunda/camunda-modeler/issues/887))
* `FIX`: prevent error dragging label onto `bpmn:MessageFlow` ([#888](https://github.com/camunda/camunda-modeler/issues/888))
* `FIX`: round coordinates when dragging elements ([#886](https://github.com/camunda/camunda-modeler/issues/886))


## 2.0.0-2

_This is a pre-release_.

* `FIX`: properly reflect decision id changes in decision table and literal expression editors

## 2.0.0-1

_This is a pre-release_.

* `FEAT`: add DMN properties panel, avaliable for all DMN editors ([#847](https://github.com/camunda/camunda-modeler/issues/847))
* `FEAT`: add ability to edit `camunda:historyTimeToLive` on `dmn:Decision` elements ([#581](https://github.com/camunda/camunda-modeler/issues/581))
* `FEAT`: add ability to edit `camunda:versionTag` on `dmn:Decision` elements ([#802](https://github.com/camunda/camunda-modeler/issues/802))
* `CHORE`: drop `dmn:Definitions` `name` and `id` editing from DRD editor; you may edit these properties via the DMN properties panel ([`653eb607`](https://github.com/camunda/camunda-modeler/commits/653eb607183c6cf0457b8023a2d61cf8343da7fb))

## 2.0.0-0

_This is a pre-release_.

* `FEAT`: improve minimap, round two
* `FEAT`: support boundary event to activity loops ([#776](https://github.com/camunda/camunda-modeler/issues/776))
* `FEAT`: support activity to activity loops
* `FEAT`: provide Windows installer and MacOS DMG distribution ([#787](https://github.com/camunda/camunda-modeler/issues/787))
* `FEAT`: sign executables on Windows and MacOS ([#787](https://github.com/camunda/camunda-modeler/issues/787))
* `CHORE`: update to `bpmn-js@2.4.0`
* `CHORE`: update to `cmmn-js@0.15.0`
* `CHORE`: update to `diagram-js-minimap@1.2.2`
* `CHORE`: drop in-app Windows file association behavior in favor of external support script ([`a07b693a`](https://github.com/camunda/camunda-modeler/commits/a07b693a9648715af0410cc13f5c58dcbea2f3df))
* `FIX`: correct minimap collapse icon
* `FIX`: correct app icons ([#503](https://github.com/camunda/camunda-modeler/issues/503))
* `FIX`: prevent creation of duplicate flows in BPMN editor ([#777](https://github.com/camunda/camunda-modeler/issues/777))

## 1.16.2

* `FIX`: correctly update editor actions on direct editing ([#790](https://github.com/camunda/camunda-modeler/issues/790), [#834](https://github.com/camunda/camunda-modeler/issues/834))
* `FIX`: use `Arial` as default font when exporting SVG ([#840](https://github.com/camunda/camunda-modeler/issues/840))
* `CHORE`: update to `dmn-js@5.1.0`
* `CHORE`: update to `bpmn-js@2.3.1`

## 1.16.1

* `FIX`: correct bpmn-js version used in lock file
* `CHORE`: update to `bpmn-js@2.2.1`

## 1.16.0

* `FEAT`: show loader on application startup
* `FEAT`: resize text annotation when editing via properties panel ([#631](https://github.com/camunda/camunda-modeler/issues/631))
* `FIX`: correct error message on import error ([#821](https://github.com/camunda/camunda-modeler/issues/821))
* `FIX`: create/update labels when updating element name via properties panel ([#824](https://github.com/camunda/camunda-modeler/issues/824))
* `FIX`: correct target attribute in signal payload not being removed from BPMN 2.0 XML ([#818](https://github.com/camunda/camunda-modeler/issues/818))
* `CHORE`: update to `bpmn-js@2.2.0`
* `CHORE`: update to `diagram-js-minimap@1`

## 1.15.1

* `CHORE`: make dialogs actual modal windows ([#815](https://github.com/camunda/camunda-modeler/pull/815))

## 1.15.0

* `FEAT`: allow data stores to be modeled between participants ([#183](https://github.com/camunda/camunda-modeler/issues/183))
* `FEAT`: allow deletion of external labels, clearing text ([#243](https://github.com/camunda/camunda-modeler/issues/243))
* `FEAT`: speed up BPMN diagram import by only rendering non-empty labels
* `FEAT`: show loader when opening huge diagrams ([#704](https://github.com/camunda/camunda-modeler/issues/704))
* `FEAT`: export image using native type chooser ([#171](https://github.com/camunda/camunda-modeler/issues/171))
* `CHORE`: improve text rendering in BPMN diagrams
* `FIX`: correct BPMN editor align button tooltip ([#590](https://github.com/camunda/camunda-modeler/issues/590))
* `FIX`: make `cycle` option for BPMN intermediate timer events available again ([#792](https://github.com/camunda/camunda-modeler/issues/792))
* `FIX`: correct edit menu on direct editing activation ([#708](https://github.com/camunda/camunda-modeler/issues/708))
* `FIX`: prevent BPMN element deletion when pressing `DEL` in BPMN properties panel ([#680](https://github.com/camunda/camunda-modeler/issues/680))
* `CHORE`: update to `Electron@2`
* `CHORE`: update to `bpmn-js@2.1.0`
* `CHORE`: update to `bpmn-js-properties-panel@0.25.1`

## 1.14.0

* `FEAT`: add ability to create a new diagram when opening an empty file ([#636](https://github.com/camunda/camunda-modeler/issues/636))
* `FEAT`: improve compatibility with Signavio BPMN 2.0 exports ([#732](https://github.com/camunda/camunda-modeler/issues/732))
* `FIX`: correct context menu positioning in decision table editor

## ...

Check `git log` for earlier history.
