# Changelog

All notable changes to the [Camunda Modeler](https://github.com/camunda/camunda-modeler) are documented here. We use [semantic versioning](http://semver.org/) for releases.

## Unreleased

___Note:__ Yet to be released changes appear here._

#### General

* `FEAT`: add feature toggles ([#1159](https://github.com/camunda/camunda-modeler/issues/1159))
* `FEAT`: add BPMN only mode ([#872](https://github.com/camunda/camunda-modeler/issues/872))
* `FEAT`: rework file dropping
* `FEAT`: improve logging across the application
* `FEAT`: allow disabling plug-ins via flag ([`4b365482`](https://github.com/camunda/camunda-modeler/commit/4b3654825d033035e588e33927ceee4ce089af44))
* `FEAT`: align diagrams to `(0,0)` on save to prevent negative coordinates ([#1096](https://github.com/camunda/camunda-modeler/issues/1096))
* `FEAT`: drop diagram origin cross ([#1096](https://github.com/camunda/camunda-modeler/issues/1096))
* `FEAT`: unify search paths for plug-ins and element templates ([#597](https://github.com/camunda/camunda-modeler/issues/597))
* `CHORE`: update to `electron@3.1.3`
* `CHORE`: update to `bpmn-js@3.2.0`
* `FIX`: correct shortcuts shown in overlay ([#1039](https://github.com/camunda/camunda-modeler/issues/1039))
* `FIX`: properly handle file-drop in XML view ([#571](https://github.com/camunda/camunda-modeler/issues/571))
* `FIX`: don't throw error when dragging file over diagram tabs ([#1120](https://github.com/camunda/camunda-modeler/issues/1120))
* `FIX`: prevent jumping when resizing properties/log panels ([`f68e6764`](https://github.com/camunda/camunda-modeler/commit/f68e67643f6fa0cba2ac69f7a832868485b0fc68))
* `FIX`: re-open + focus docked app on file open (MacOS) ([`eff83531`](https://github.com/camunda/camunda-modeler/commit/eff83531b0d5a7d2735f3f4987048d47743e1f9d))
* `FIX`: prevent external file changed dialog from opening twice on Windows / Linux ([#1118](https://github.com/camunda/camunda-modeler/issues/1118))

#### BPMN

* `FEAT`: set `isHorizontal` to `bpmndi:Shape` elements ([#1096](https://github.com/camunda/camunda-modeler/issues/1096))
* `FIX`: mark diagram as dirty after `activiti` to `camunda` namespace conversion ([#403](https://github.com/camunda/camunda-modeler/issues/403))

#### Deploy Dialog

* `FEAT`: set `deployment-source` to `Camunda Modeler` ([#1153](https://github.com/camunda/camunda-modeler/issues/1153))

#### Plug-ins

* `FEAT`: add ability to reference local assets via logical paths ([`dcf2bc0b`](https://github.com/camunda/camunda-modeler/commit/dcf2bc0bbc2450608992d343d32b2304531c3a80))
* `FEAT`: recognize plug-ins in `{basePath}/resources/plugins` ([#597](https://github.com/camunda/camunda-modeler/issues/597))
* `CHORE`: gracefully handle plugin load failures ([#1180](https://github.com/camunda/camunda-modeler/issues/1180))
* `CHORE`: enforce unique names ([#1180](https://github.com/camunda/camunda-modeler/issues/1180))
* `CHORE`: log loading and activation ([#1180](https://github.com/camunda/camunda-modeler/issues/1180))
* `CHORE`: improve plugin error handling in various places ([`d916d22f`](https://github.com/camunda/camunda-modeler/commit/d916d22f6a9663d0302e9f2cb6a05521800a1942), [`420cf831`](https://github.com/camunda/camunda-modeler/commit/420cf83137e337b2f42db2acc9ac07d5fc80a0d4), [`39e3c2eb`](https://github.com/camunda/camunda-modeler/commit/39e3c2eb0d47cbebc07c431e182e801518fb14da))
* `CHORE`: deprecate global plug-in helpers in favor of logical paths ([`1de7af5a`](https://github.com/camunda/camunda-modeler/commit/1de7af5a89704715648ec2f3728a2ac4da660661))
* `FIX`: give plug-ins stored in `{userData}` access to local assets ([#1135](https://github.com/camunda/camunda-modeler/issues/1135))


### Breaking Changes

* The global plug-in helper `getPluginPaths()` did not work reliably and got deprecated. Use logical paths of the form `app-plugins://{pluginName}/{pathToResource}` to reference static plug-in assets ([`1de7af5a`](https://github.com/camunda/camunda-modeler/commit/1de7af5a89704715648ec2f3728a2ac4da660661)).
* The global plug-in helper `getModelerPath()` was removed without replacement ([`1de7af5a`](https://github.com/camunda/camunda-modeler/commit/1de7af5a89704715648ec2f3728a2ac4da660661)).
* Rewriting the modeler changed most CSS selectors outside the actual diagram editors / properties panels. This may break plug-ins that monkey patch the application styles.
* To improve compatibility with external tools, we now prevent negative coordinates by aligning to `(0,0)` on diagram save. This results in slightly more noise in actual file changes ([#1096](https://github.com/camunda/camunda-modeler/issues/1096)).



## 3.0.0-0

_This is a pre-release of the app ported to an entirely new architecture._

#### General

* `FEAT`: add ability for users to give feedback via the Help menu ([#1094](https://github.com/camunda/camunda-modeler/issues/1094))
* `FEAT`: improve resolution of exported images ([#486](https://github.com/camunda/camunda-modeler/issues/486))
* `CHORE`: rewrite client app in ReactJS ([#866](https://github.com/camunda/camunda-modeler/issues/866))
* `CHORE`: rewrite back-end for better separation of concerns and extensibility ([#866](https://github.com/camunda/camunda-modeler/issues/866))
* `CHORE`: rework back-end to client communication ([#866](https://github.com/camunda/camunda-modeler/issues/866))
* `CHORE`: update to `electron@3.0.14`
* `FIX`: do not restrict height of properties panel content ([#283](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/283), [#62](https://github.com/bpmn-io/cmmn-js-properties-panel/pull/62), [#6](https://github.com/bpmn-io/dmn-js-properties-panel/pull/6))

#### Deploy Dialog

* `FEAT`: add ability to use authentication ([#1063](https://github.com/camunda/camunda-modeler/pull/1063), [#742](https://github.com/camunda/camunda-modeler/pull/742))
* `FEAT`: remember last deployed endpoint URL ([#1041](https://github.com/camunda/camunda-modeler/pull/1041))
* `FEAT`: improve error handling ([#838](https://github.com/camunda/camunda-modeler/issues/838), [#846](https://github.com/camunda/camunda-modeler/issues/846))
* `FEAT`: deploy only changed resources per default ([#744](https://github.com/camunda/camunda-modeler/issues/744))
* `FIX`: disable editor shortcuts while modal is active ([#929](https://github.com/camunda/camunda-modeler/issues/929))

#### BPMN

* `FEAT`: add hints to returned Java types in properties panel ([#286](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/286))
* `FEAT`: show target variable name instead of index in properties panel ([#287](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/287))
* `CHORE`: update to `bpmn-js@3.1.0`
* `FIX`: render labels always on top ([#1050](https://github.com/camunda/camunda-modeler/issues/1050))

#### DMN

* `FEAT`: add ability to navigate all decision elements using tabs
* `CHORE`: update to `dmn-js@6.2.0`
* `FIX`: correct dirty state indicator

#### CMMN

* `CHORE`: update to `cmmn-js@0.17.0`

## 2.2.4

#### BPMN

* `FIX`: include `camunda:calledElementVersionTag` ([#1074](https://github.com/camunda/camunda-modeler/issues/1074))

## 2.2.3

#### BPMN

* `FIX`: do not join incoming/outgoing flows other than sequence flows on element deletion ([#1033](https://github.com/camunda/camunda-modeler/issues/1033))

## 2.2.2

* `CHORE`: drop unused dependency

## 2.2.1

* `FIX`: correct `camunda:isStartableInTasklist` default value

## 2.2.0

#### General

* `FEAT`: support moving elements via keyboard arrows on all diagram editors ([`a2b5bf07`](https://github.com/camunda/camunda-modeler/commit/a2b5bf079574a90bd1377150c7c39aab181261a6))
* `FEAT`: add accessible context-pad and popup-menu to all remaining diagram editors (DRD, CMMN)
* `CHORE`: update to `cmmn-js@0.16.0`
* `CHORE`: update to `dmn-js@6.0.0`
* `FIX`: correct properties panel scrolling with many items

#### BPMN

* `FEAT`: add editing support for `camunda:isStartableInTasklist` ([#843](https://github.com/camunda/camunda-modeler/issues/843))

#### DMN

* `FEAT`: support moving canvas via keyboard arrows in DRD editor ([#1016](https://github.com/camunda/camunda-modeler/issues/1016))
* `FEAT`: add diagram origin cross in DRD editor ([`7dceaf5f9`](https://github.com/camunda/camunda-modeler/commit/7dceaf5f9b764426fa1c647bc7e6b4ffe9148fbb))

## 2.1.2

* `CHORE`: update dependencies

## 2.1.1

* `FIX`: fix move canvas key binding in BPMN editor

## 2.1.0

#### General

* `FEAT`: moving the canvas using keyboard arrows now requires the `Ctrl/Cmd` modifier
* `FIX`: correctly detect file type when opening file ([#944](https://github.com/camunda/camunda-modeler/issues/944))
* `CHORE`: bump to `electron@3.0.0`

#### BPMN

* `FEAT`: add moddle extensions as plugins to bpmn-js ([#949](https://github.com/camunda/camunda-modeler/pull/949))
* `FEAT`: display group names ([#844](https://github.com/bpmn-io/bpmn-js/issues/844))
* `FEAT`: add ability to move selection with keyboard arrows ([#376](https://github.com/bpmn-io/bpmn-js/issues/376))
* `FEAT`: improve `EventBasedGateway` context pad tooltips ([#917](https://github.com/camunda/camunda-modeler/issues/917))
* `FEAT`: improve modeling behavior after `EventBasedGateway` ([#784](https://github.com/camunda/camunda-modeler/issues/784))
* `CHORE`: update to `bpmn-js@3`

#### DMN

* `CHORE`: update to `dmn-js@5.2.0`

#### CMMN

* `CHORE`: update to `cmmn-js@0.15.2`

## 2.0.3

_Republish of `v2.0.2` with fixed distribution_.

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
