# Changelog

All notable changes to the [Camunda Modeler](https://github.com/camunda/camunda-modeler) are documented here. We use [semantic versioning](http://semver.org/) for releases.

## Unreleased

___Note:__ Yet to be released changes appear here._
* `FIX`: fix broken keyboard shortcuts and menu entries for Undo & Redo in decision tables ([#1843](https://github.com/camunda/camunda-modeler/issues/1843))

## 4.2.0

### General

* `FEAT`: include CMMN diagramOpened event in usage-statistics ([#1887](https://github.com/camunda/camunda-modeler/issues/1887))
* `CHORE`: adjust colors to match CAMUNDA color scheme ([#1844](https://github.com/camunda/camunda-modeler/issues/1844))
* `FEAT`: allow plugins to get element templates from config ([#1893](https://github.com/camunda/camunda-modeler/pull/1893))
* `CHORE`: bump to `bpmn-js@7.3.0`
* `CHORE`: bump to `dmn-js@9.2.0`
* `CHORE`: bump to `diagram-js@6.7.0`

### BPMN

* `FIX`: disallow typed start events in sub processes ([#498](https://github.com/camunda/camunda-modeler/issues/498))

### DMN

* `FIX`: remove unnecessary click event cancel action ([#1907](https://github.com/camunda/camunda-modeler/issues/1907))
* `FEAT`: center the decision table resize hitbox ([#1906](https://github.com/camunda/camunda-modeler/issues/1906))
* `FEAT`: remove clause and rule menu entries  ([#1901](https://github.com/camunda/camunda-modeler/issues/1901))
* `FIX`: hide hit-policy input select on global mousedown event ([#1900](https://github.com/camunda/camunda-modeler/issues/1900))
* `FIX`: correct decision table allowed values layout ([#1895](https://github.com/camunda/camunda-modeler/issues/1895))
* `FIX`: complete direct editing on drill down in DRD ([#1892](https://github.com/camunda/camunda-modeler/issues/1892))
* `FIX`: correctly display DMN decision table dragging layout ([#1899](https://github.com/camunda/camunda-modeler/issues/1899))

## 4.1.1

### General

* `FIX`: remove _Create DMN Table_ from menu actions ([#1871](https://github.com/camunda/camunda-modeler/issues/1871))

### DMN

* `FIX`: correctly position cell header popup ([#1869](https://github.com/camunda/camunda-modeler/issues/1869))
* `FIX`: hide watermark for non-DRD modelers ([#1867](https://github.com/camunda/camunda-modeler/issues/1867))

## 4.1.0

### General

* `FEAT`: send ping and diagram creation events to E.T. telemetrics platform ([#1805](https://github.com/camunda/camunda-modeler/issues/1805))
* `FIX`: send correct source maps with crash reports ([#1813](https://github.com/camunda/camunda-modeler/issues/1831))
* `FIX`: ensure plugins are correctly sent to Sentry ([#1847](https://github.com/camunda/camunda-modeler/issues/1847))
* `FIX`: save workspace before quitting ([#1795](https://github.com/camunda/camunda-modeler/issues/1795))
* `FIX`: ensure space key is working to check / uncheck modal check boxes ([#1692](https://github.com/camunda/camunda-modeler/issues/1692))
* `FIX`: ensure menu is only initiated once ([#1816](https://github.com/camunda/camunda-modeler/issues/1816))

### BPMN

* `FEAT`: integrate promisified bpmn-js ([#1775](https://github.com/camunda/camunda-modeler/issues/1775))
* `CHORE`: bump to `bpmn-js@7.2.1`

### DMN

* `FEAT`: add DMN overview navigation ([#1767](https://github.com/camunda/camunda-modeler/issues/1767))
* `FEAT`: set default zoom scale when opening DMN overview ([#1848](https://github.com/camunda/camunda-modeler/issues/1848))
* `FEAT`: improve decision table layout ([#494](https://github.com/bpmn-io/dmn-js/issues/494))
* `FEAT`: improve literal expression layout ([#515](https://github.com/bpmn-io/dmn-js/issues/515))
* `FEAT`: add ability to resize table columns ([#500](https://github.com/bpmn-io/dmn-js/issues/500))
* `FIX`: allow association regardless of connection direction ([#1702](https://github.com/camunda/camunda-modeler/issues/1702))
* `FIX`: ensure select-all is working DMN properties panel ([#1685](https://github.com/camunda/camunda-modeler/issues/1685))
* `CHORE`: bump to `dmn-js@9.0.0`

## 4.0.0

* `CHORE`: bump to `bpmn-js@6.5.1`
* `CHORE`: bump to `cmmn-js@0.20.0`

## 4.0.0-alpha.3

#### General

* `FEAT`: Integrate error tracking ([#1796](https://github.com/camunda/camunda-modeler/pull/1796))
* `FEAT`: Update Camunda logo ([#1794](https://github.com/camunda/camunda-modeler/pull/1794))

## 4.0.0-alpha.2

#### General

* `FIX`: prevent loader from flickering ([#1743](https://github.com/camunda/camunda-modeler/pull/1743))
* `CHORE`: bump to `bpmn-js@6.5.0`
* `CHORE`: bump to `diagram-js@6.6.1`
* `CHORE`: bump to `dmn-js@8.3.0`
* `CHORE`: bump to `ids@1.0.0`
* `CHORE`: bump to `min-dash@3.5.2`

#### BPMN

* `FEAT`: prefer straight layout for sub-process connections ([#1309](https://github.com/bpmn-io/bpmn-js/pull/1309))

#### DMN

* `FEAT(drd)`: change layout of information requirements ([#492](https://github.com/bpmn-io/dmn-js/pull/492))
* `FEAT(drd)`: add auto-place feature ([#492](https://github.com/bpmn-io/dmn-js/pull/492))
* `FEAT(drd)`: connect from new shape to source on append ([#492](https://github.com/bpmn-io/dmn-js/pull/492))

## 3.7.3

#### General

* `CHORE`: bump to `dmn-js@7.5.1`

#### DMN

* `FIX`: changing decision ID via properties panel ([#1769](https://github.com/camunda/camunda-modeler/issues/1769))

## 3.7.2

#### General

* `CHORE`: bump to `bpmn-js@6.3.5`

#### BPMN

* `FIX`: correct accidental resizing of label target ([#1294](https://github.com/bpmn-io/bpmn-js/pull/1294))

## 4.0.0-alpha.1

#### General

* `FIX`: delayed validation in deployment tool after reopening the dialog ([#1741](https://github.com/camunda/camunda-modeler/issues/1741))

## 4.0.0-alpha.0

#### General

* `FEAT`: new loading indicator ([#1719](https://github.com/camunda/camunda-modeler/issues/1719))
* `FEAT`: completely overhauled UX of the deployment diagram ([#1709](https://github.com/camunda/camunda-modeler/issues/1709))
* `FEAT`: save and restore window size ([#576](https://github.com/camunda/camunda-modeler/issues/576))
* `FEAT`: apply native keyboard shortcuts in log panel ([#1380](https://github.com/camunda/camunda-modeler/issues/1380))
* `CHORE`: dialogs to return response instead of button ([`42d0ecc`](https://github.com/camunda/camunda-modeler/commit/42d0eccfae6143f472ec60b0280c7267b7d5a4e5))
* `CHORE`: remove watermark ([#1731](https://github.com/camunda/camunda-modeler/issues/1731))

#### DMN

* `FEAT`: support for opening DMN 1.2 and DMN 1.3 diagrams
* `FEAT`: migrate DMN 1.1 diagrams to DMN 1.3 on diagram open
* `FEAT`: migrate DMN diagrams to DMN 1.3 on export ([`7eb32a8`](https://github.com/camunda/camunda-modeler/commit/7eb32a80508c214c63257795b37dc430778871f3))
* `FEAT`: add resizing to DRD ([`3dd1265`](https://github.com/bpmn-io/dmn-js/commit/3dd12659bcc13abeb7e27cbcc9564a8171890abc))
* `FEAT`: improve DRD label editing ([#213](https://github.com/bpmn-io/dmn-js/issues/213))
* `FEAT`: set FEEL as default expression language ([#1710](https://github.com/camunda/camunda-modeler/issues/1710))
* `CHORE`: bump to `dmn-js@8.2.0`

### Breaking Changes

* DMN editor is migrated to DMN 1.3. Users will be able to open DMN 1.1 and DMN 1.2 diagrams, however exported diagrams will automatically be migrated to DMN 1.3. ([`7eb32a8`](https://github.com/camunda/camunda-modeler/commit/7eb32a80508c214c63257795b37dc430778871f3))
* This release is compatible with Camunda BPM versions 7.13.0, 7.12.4, 7.11.11, 7.10.17 and above.

## 3.7.1

#### General

* `FIX`: correctly export as image on Linux ([#1699](https://github.com/camunda/camunda-modeler/issues/1699))
* `FIX`: always paste as plain text to properties panels
* `CHORE`: make sure to daily check for updates if enabled ([`d2bf6a6`](https://github.com/camunda/camunda-modeler/commit/d2bf6a6fc147b73ecacaebdda7a334503d8c8928))

#### BPMN

* `FIX`: resize empty text annotations ([#1290](https://github.com/bpmn-io/bpmn-js/pull/1290))
* `FIX`: correctly move flows when adding lane ([#1715](https://github.com/camunda/camunda-modeler/issues/1715))
* `FIX`: restore semantic IDs for non flow nodes ([#1285](https://github.com/bpmn-io/bpmn-js/issues/1285))
* `FIX`: export BPMNDI in correct order ([#1326](https://github.com/camunda/camunda-modeler/issues/1326))
* `CHORE`: update to `bpmn-js@6.3.4`

#### DMN

* `FEAT(decision-table)`: add new rule on bottom rule \<enter> ([#345](https://github.com/bpmn-io/dmn-js/issues/345))
* `FEAT(drd)`: activate direct editing after text annotation create ([#185](https://github.com/bpmn-io/dmn-js/issues/185))
* `FIX`: update association's refs on element id change ([#397](https://github.com/bpmn-io/dmn-js/issues/397))
* `CHORE`:  update to `dmn-js@7.5.0`

## 3.7.0

#### General

* `FEAT`: disable deploy button if config is not valid ([`050fcdf`](https://github.com/camunda/camunda-modeler/commit/050fcdf364b4a9dc4aaad894c48b79d1c06e2050))
* `FEAT`: support Camunda Spring Boot starter per default ([#1610](https://github.com/camunda/camunda-modeler/issues/1610))
* `FEAT`: redeploy when running process with new config ([`b4f18fe`](https://github.com/camunda/camunda-modeler/commit/b4f18fe47d4c27ed7e4b8aaec789749c4c11bbbd))
* `FEAT`: improve look and responsiveness of modals ([#1681](https://github.com/camunda/camunda-modeler/issues/1681))
* `FEAT`: remove support for Linux 32bit platforms ([#1683](https://github.com/camunda/camunda-modeler/pull/1683))
* `FIX`: check for executable process before deploy and run ([#1671](https://github.com/camunda/camunda-modeler/issues/1671))
* `CHORE`: move modal styles to global ([#1691](https://github.com/camunda/camunda-modeler/pull/1691))
* `CHORE`: update to `electron@7.1.12`

#### BPMN

* `FEAT`: generate more generic IDs for new elements ([#1654](https://github.com/camunda/camunda-modeler/issues/1654))
* `FIX`: improve space tool ([#1368](https://github.com/camunda/camunda-modeler/issues/1368))
* `FIX`: correctly copy referenced root elements ([#1639](https://github.com/camunda/camunda-modeler/issues/1639))
* `FIX`: copy signal event variables ([#1684](https://github.com/camunda/camunda-modeler/issues/1684))
* `CHORE`: update to `bpmn-js@6.3.0`

#### DMN

* `FEAT`: add alignment buttons and snapping ([#1669](https://github.com/camunda/camunda-modeler/issues/1669))
* `FEAT`: add support for DMN Editor plugins ([#1550](https://github.com/camunda/camunda-modeler/pull/1550))
* `FIX`: do not display placeholder for input fields in table ([#1677](https://github.com/camunda/camunda-modeler/issues/1677))
* `FIX`: update XML correctly when changing id ([#1679](https://github.com/camunda/camunda-modeler/issues/1679))
* `FIX`: correct DMN Editor scrolling ([#1687](https://github.com/camunda/camunda-modeler/issues/1687))
* `CHORE`: update to `dmn-js@7.4.3`

## 3.6.0

#### General

* `FEAT`: add automatic update checks ([#1541](https://github.com/camunda/camunda-modeler/issues/1541))
* `FEAT`: allow to run BPMN processes directly from the app ([#1552](https://github.com/camunda/camunda-modeler/issues/1552))
* `FEAT`: make user data directory configurable ([#1625](https://github.com/camunda/camunda-modeler/issues/1625))
* `FIX`: make it possible to export huge diagrams as PNGs ([#1591](https://github.com/camunda/camunda-modeler/issues/1591))
* `FIX`: do not swallow warnings on editor open errors ([#1522](https://github.com/camunda/camunda-modeler/issues/1522))
* `FIX`: prevent illegal IDs from being entered in the properties panels ([#1623](https://github.com/camunda/camunda-modeler/issues/1623))
* `CHORE`: add clear primary / secondary actions for all dialogs
* `CHORE`: update to `Electron@7` as new app foundation ([#1448](https://github.com/camunda/camunda-modeler/issues/1448), [#1607](https://github.com/camunda/camunda-modeler/issues/1607))

#### BPMN

* `FEAT`: copy signals, escalations and errors ([#1049](https://github.com/camunda/camunda-modeler/issues/1049))
* `FEAT`: add horizontal and vertical resize handles
* `FEAT`: improve connection cropping
* `FIX`: correct creation of nested lanes ([#1617](https://github.com/camunda/camunda-modeler/issues/1617))
* `FIX`: disable re-layout behaviors on paste (paste as copied) ([#1611](https://github.com/camunda/camunda-modeler/issues/1611))
* `FIX`: do not open replace menu after multi-element create ([#1613](https://github.com/camunda/camunda-modeler/issues/1613))
* `FIX`: render colored `bpmn:Group` elements
* `FIX`: correct origin snapping on multi-element create ([#1612](https://github.com/camunda/camunda-modeler/issues/1612))
* `FIX`: properly reconnect message flows when collapsing participant
* `FIX`: keep non-duplicate outgoing connections when dropping on flow
* `FIX`: correct serialization of `DataAssociation#assignmet`
* `FIX`: allow `bpmn:Association` where `bpmn:DataAssociation` is allowed, too ([#1635](https://github.com/camunda/camunda-modeler/issues/1635))
* `CHORE`: update to `bpmn-js@6.2.1`

## 3.5.0

#### General

* `FEAT`: remember authentication details ([`eb35b078`](https://github.com/camunda/camunda-modeler/commit/eb35b07872b7a77936399532c99a7f485b99b012))
* `FEAT`: notarize MacOS distribution ([#1585](https://github.com/camunda/camunda-modeler/pull/1585))
* `FEAT`: trap focus and escape key in modal ([`4df45940`](https://github.com/camunda/camunda-modeler/commit/4df459409b893cc72e1287a04234511331e3adfe))
* `FEAT`: allow nodeIntegration to be enabled via feature toggle ([`c7f93c05`](https://github.com/camunda/camunda-modeler/commit/c7f93c05ad99dc400b2a259f88e0ad96de641aed))
* `FIX`: do not scroll clear/close controls ([`20b8dbfc`](https://github.com/camunda/camunda-modeler/commit/20b8dbfc2874238e7b5edc7256f63e3ad3282d9a))
* `CHORE`: prefix log messages with level ([`c741c41e`](https://github.com/camunda/camunda-modeler/commit/c741c41e3bbcfcf1176a783a9372006d16dcb688))
* `CHORE`: bump to `diagram-js@6.0.4`
* `CHORE`: bump to `bpmn-js@6.0.2`
* `CHORE`: bump to `dmn-js@7.2.1`

#### BPMN

* `FEAT`: connecting and re-connecting shapes is now possible in both directions ([#1230](https://github.com/bpmn-io/bpmn-js/pull/1230))
* `FIX`: render colored BPMN groups ([#1246](https://github.com/bpmn-io/bpmn-js/pull/1246))

### Breaking Changes

* `FEAT`: disable collapsing sub process ([`a2c008d0`](https://github.com/camunda/camunda-modeler/commit/a2c008d09effe200c857ec36a20889ae4dde598a))

#### DMN

* `FEAT(decision-table)`: preserve aggregation when COLLECT is selected again
* `FEAT(decision-table)`: allow aggreation to be cleared from dropdown ([#370](https://github.com/bpmn-io/dmn-js/issues/370), [#389](https://github.com/bpmn-io/dmn-js/issues/389))
* `FEAT(decision-table)`: use JUEL as the default input expression language ([#405](https://github.com/bpmn-io/dmn-js/issues/405))
* `FIX(decision-table)`: correctly handle value erasing ([#826](https://github.com/camunda/camunda-modeler/issues/826))
* `FIX(decision-table)`: correctly display simple mode edit control when cell selection changes ([#341](https://github.com/bpmn-io/dmn-js/issues/341))
* `FIX(decision-table)`: do not close input on user selection ([#421](https://github.com/bpmn-io/dmn-js/issues/421))
* `FIX(decision-table)`: do not navigate when clearing pre-defined hints ([#431](https://github.com/bpmn-io/dmn-js/issues/431))
* `FIX(decision-table)`: prevent context menu jump in larger tables
* `FIX(decision-table)`: do not close context on user selection

### Breaking Changes

* `FEAT(decision-table)`: only allow standardized hit policy values

## 3.4.1

* `FIX`: allow again to scroll DMN tables horizontally ([#1537](https://github.com/camunda/camunda-modeler/issues/1537))

## 3.4.0

#### General

* `FEAT`: add reusable notifications mechanism ([#1505](https://github.com/camunda/camunda-modeler/issues/1505))
* `FEAT`: allow access to workspace configurations for plugins and files ([#1425](https://github.com/camunda/camunda-modeler/issues/1425))
* `FIX`: complete direct editing on save operation ([#1473](https://github.com/camunda/camunda-modeler/issues/1473))
* `FIX`: correct autofocusing in modals ([#1489](https://github.com/camunda/camunda-modeler/pull/1489))
* `CHORE`: bump to `bpmn-js@5.1.0` / `diagram-js@5.1.0`

#### BPMN

* `FIX`: correct duplicated references in lanes ([#1504](https://github.com/camunda/camunda-modeler/issues/1504))
* `FIX`: keep sequence flow conditions after morphing source or target ([#180](https://github.com/camunda/camunda-modeler/issues/180))
* `FIX`: do not show preview if create operation is not allowed ([#1481](https://github.com/camunda/camunda-modeler/issues/1481))
* `FIX`: be able to paste elements on previously removed areas ([#1466](https://github.com/camunda/camunda-modeler/issues/1466))

#### Deployment

* `FEAT`: remember deployment details with diagram ([#1066](https://github.com/camunda/camunda-modeler/issues/1066))
* `FEAT`: display readable error message in log ([#1426](https://github.com/camunda/camunda-modeler/issues/1426))
* `FEAT`: derive default deployment name from the filename ([#1511](https://github.com/camunda/camunda-modeler/pull/1511))
* `FEAT`: deployment tool as a client extension ([#1488](https://github.com/camunda/camunda-modeler/issues/1488))

#### Plugins

* `FEAT`: add extension point for UI plugins ([#1490](https://github.com/camunda/camunda-modeler/issues/1490))
* Introduce several application events to hook into:
    * <tab.saved> ([#1498](https://github.com/camunda/camunda-modeler/pull/1498))
    * <tab.activeSheetChanged> ([`403afc`](https://github.com/camunda/camunda-modeler/commit/403afc920cf6c745816c3cd456baeb99830b25ed))
    * <app.activeTabChanged> ([`403afc`](https://github.com/camunda/camunda-modeler/commit/403afc920cf6c745816c3cd456baeb99830b25ed))
    * <bpmn.modeler.configure> ([#1499](https://github.com/camunda/camunda-modeler/issues/1499))
    * <bpmn.modeler.created> ([#1500](https://github.com/camunda/camunda-modeler/issues/1500))

## 3.3.5

* `FIX`: snap connections to shape center ([#1436](https://github.com/camunda/camunda-modeler/issues/1436))
* `FIX`: apply labels when using context pad ([#1502](https://github.com/camunda/camunda-modeler/issues/1502))
* `FIX`: do not copy extension elements with unknown type ([#1507](https://github.com/camunda/camunda-modeler/issues/1507))

## 3.3.4

* `FIX`: correct menu point visibility ([#1487](https://github.com/camunda/camunda-modeler/issues/1487))

## 3.3.3

* `FIX`: correct check whether plug-ins are enabled ([#1479](https://github.com/camunda/camunda-modeler/issues/1479))

## 3.3.2

* `FIX`: correct connection layout when dropping on sequence flows
* `CHORE`: bump to `bpmn-js@5.0.4`

## 3.3.1

* `FIX`: remove phantom snap lines showing on paste
* `CHORE`: bump to `bpmn-js@5.0.3` / `diagram-js@5.0.2`

## 3.3.0

#### General

* `FIX`: correct find shortcut not working ([#1450](https://github.com/camunda/camunda-modeler/issues/1450))
* `FIX`: restore paste shortcut not working in XML view ([#814](https://github.com/camunda/camunda-modeler/issues/814), [#868](https://github.com/camunda/camunda-modeler/issues/868))
* `CHORE`: disable node integration in client application ([#1453](https://github.com/camunda/camunda-modeler/pull/1453))

#### BPMN

* `FEAT`: add two-step copy and paste ([#1421](https://github.com/camunda/camunda-modeler/issues/1421))
* `FEAT`: make participants and expanded sub-processes draggable on borders and headers/labels only ([#238](https://github.com/camunda/camunda-modeler/issues/238))
* `FEAT`: improve navigation inside large participants / sub-processes ([#238](https://github.com/camunda/camunda-modeler/issues/238))
* `FEAT`: allow editing of `camunda:errorMessage` on `bpmn:Error` elements ([#1333](https://github.com/camunda/camunda-modeler/issues/1333))
* `FEAT`: add generic editor extension point ([#1434](https://github.com/camunda/camunda-modeler/pull/1434))
* `FEAT`: activate hand tool on `SPACE` ([#1475](https://github.com/camunda/camunda-modeler/pull/1475))
* `FIX`: allow participant to participant message flows to be copied ([#1413](https://github.com/camunda/camunda-modeler/issues/1413))
* `FIX`: do not update label positions when pasting ([#1325](https://github.com/camunda/camunda-modeler/issues/1325))
* `FIX`: keep allowed implementation details on copy and replace ([#681](https://github.com/camunda/camunda-modeler/issues/681), [#540](https://github.com/camunda/camunda-modeler/issues/540), [#647](https://github.com/camunda/camunda-modeler/issues/647), [#678](https://github.com/camunda/camunda-modeler/issues/678), [#538](https://github.com/camunda/camunda-modeler/issues/538), [#586](https://github.com/camunda/camunda-modeler/issues/586), [#537](https://github.com/camunda/camunda-modeler/issues/537), [#1464](https://github.com/camunda/camunda-modeler/issues/1464))
* `FIX`: allow editing of `camunda:InputOutput` in places supported by Camunda only ([#491](https://github.com/camunda/camunda-modeler/issues/491))
* `FIX`: make `camunda:failedJobsRetryTimeCycle` available consistently ([#1465](https://github.com/camunda/camunda-modeler/issues/1465))

#### Deploy

* `FEAT`: pre-fill deploy dialog with sensible defaults ([#1441](https://github.com/camunda/camunda-modeler/issues/1441))

## 3.2.3

* `FIX`: correct cursor being stuck in hover state ([#1383](https://github.com/camunda/camunda-modeler/issues/1383))
* `CHORE`: bump to `bpmn-js@4.0.4`

## 3.2.2

* `FIX`: make align-to-origin grid-aware
* `FIX`: allow deploy dialog to be closed without warnings ([#1405](https://github.com/camunda/camunda-modeler/issues/1405))

## 3.2.1

* `FIX`: prevent dropping on labels and groups in BPMN editor ([#1431](https://github.com/camunda/camunda-modeler/issues/1431))

## 3.2.0

#### General

* `FIX`: update properties panels to mitigate HTML injection vulnerabilities ([`1ed7caa2c`](https://github.com/camunda/camunda-modeler/commit/1ed7caa2ce3fe1a66b4b5786afbd63c1e54b9700), [blog post](https://bpmn.io/blog/posts/2019-html-injection-vulnerabilities-properties-panels-fixed.html))
* `CHORE`: validate that XML IDs for imported documents are valid [QNames](https://www.w3.org/2001/tag/doc/qnameids)

#### BPMN

* `FEAT`: add snap on resize ([#1290](https://github.com/camunda/camunda-modeler/issues/1290), [#609](https://github.com/camunda/camunda-modeler/issues/609), [#608](https://github.com/camunda/camunda-modeler/issues/608))
* `FEAT`: add ability to model `bpmn:Group` elements ([#464](https://github.com/camunda/camunda-modeler/issues/464))
* `FEAT`: add `bpmn:Subprocess` with start event included ([#1242](https://github.com/camunda/camunda-modeler/issues/1242))
* `FEAT`: make it easer to segment move ([#1197](https://github.com/camunda/camunda-modeler/issues/1197))
* `FEAT`: improve automatic label adjustment for boundary events ([#1206](https://github.com/camunda/camunda-modeler/issues/1206))
* `FEAT`: disallow multiple incoming connections on event-based gateway targets ([#637](https://github.com/camunda/camunda-modeler/issues/637))
* `FEAT`: improve layouting of boundary to activity loops ([#903](https://github.com/camunda/camunda-modeler/issues/903))
* `FEAT`: add grid snapping ([#1019](https://github.com/camunda/camunda-modeler/issues/1019))
* `FEAT`: add connection previews
* `FIX`: make message flow attachable to participants with lanes ([#1213](https://github.com/camunda/camunda-modeler/issues/1213))
* `FIX`: fix errors disappearing when adding colors ([#1342](https://github.com/camunda/camunda-modeler/issues/1342))
* `FIX`: correct name / id alignment in properties panel ([#1151](https://github.com/camunda/camunda-modeler/issues/1151))
* `FIX`: prevent unnecessary bendpoints ([#1204](https://github.com/camunda/camunda-modeler/issues/1204))
* `CHORE`: update to `bpmn-js@4.0.2`

#### CMMN

* `FEAT`: add connection previews
* `CHORE`: update to `cmmn-js@0.19.2`

## 3.1.2

* `FIX`: load local element templates ([#1379](https://github.com/camunda/camunda-modeler/pull/1379))
* `FIX`: apply default element templates only to new diagrams ([#1388](https://github.com/camunda/camunda-modeler/pull/1388))

## 3.1.1

* `FIX`: fix misleading log usage when `single-instance` flag is set to false ([#1363](https://github.com/camunda/camunda-modeler/issues/1363))

## 3.1.0

#### General

* `FIX`: restore keyboard shortcuts modal ([#1358](https://github.com/camunda/camunda-modeler/issues/1358))
* `FIX`: ignore `NODE_ENV` environment variable in production build ([#1352](https://github.com/camunda/camunda-modeler/issues/1352))
* `FIX`: keep changes when moving back and forth between unsafed tabs ([#1347](https://github.com/camunda/camunda-modeler/issues/1347))

#### BPMN

* `FEAT`: show `DataInput` / `DataOutput` labels ([#1324](https://github.com/camunda/camunda-modeler/issues/1324))
* `FEAT`: allow basic `DataInput` / `DataOutput` move
* `FIX`: prevent unnecessary dirty state without actual label update ([#858](https://github.com/camunda/camunda-modeler/issues/858))
* `CHORE`: update to `bpmn-js@3.3.1`

## 3.0.1

* `FIX`: fix desktop icons on Linux

## 3.0.0

#### General

* `CHORE`: update to `electron@3.1.7`
* `FIX`: show open file error dialog if tab couldn't be created ([#1320](https://github.com/camunda/camunda-modeler/pull/1320))
* `FIX`: fix DMN navigation ([#1321](https://github.com/camunda/camunda-modeler/pull/1321))
* `FIX`: update lastXML on xml prop change ([#1323](https://github.com/camunda/camunda-modeler/pull/1323))

#### BPMN

* `CHORE`: update to `bpmn-js@3.2.2`

## 3.0.0-beta.3

#### General

* `FEAT`: resize tab whenever app layout changes ([`8592eb4`](https://github.com/camunda/camunda-modeler/commit/8592eb479ba41fb3406416d91b84bd42d8439a4e))
* `FEAT`: mark file as unsaved if user cancels update ([#1188](https://github.com/camunda/camunda-modeler/issues/1188))
* `FEAT`: display error tab when editor fails ([#1214](https://github.com/camunda/camunda-modeler/issues/1214))
* `FEAT`: provide relevant context for tab errors ([#1176](https://github.com/camunda/camunda-modeler/issues/1176))
* `FEAT`: log mapped stack trace for errors ([`60393fe`](https://github.com/camunda/camunda-modeler/commit/60393fe0675359d304267601107e4c9e33cb53a6))
* `FEAT`: restore _Diagram opened with warnings_ hint ([#1177](https://github.com/camunda/camunda-modeler/issues/1177))
* `FEAT`: add simple way to restart editor without plug-ins ([#1253](https://github.com/camunda/camunda-modeler/issues/1253))
* `CHORE`: add license headers to all source files ([#1231](https://github.com/camunda/camunda-modeler/issues/1231))
* `CHORE`: add THIRD_PARTY_NOTICES ([#1233](https://github.com/camunda/camunda-modeler/issues/1233))
* `FIX`: only show plug-ins menu if plug-ins are registered ([#1239](https://github.com/camunda/camunda-modeler/issues/1239))
* `FIX`: restore menu state backwards compatibility ([#1193](https://github.com/camunda/camunda-modeler/issues/1193))
* `FIX`: disable _reopen last tab_ menu button when there is no last tab ([#1173](https://github.com/camunda/camunda-modeler/issues/1173))
* `FIX`: disable _save as_ menu button for empty tab ([#1282](https://github.com/camunda/camunda-modeler/issues/1282))
* `FIX`: import xml to editor only when it is changed ([`3f9cdaf`](https://github.com/camunda/camunda-modeler/commit/3f9cdafaad85eb4907c8cbe03a5230ffc4960456), [#1298](https://github.com/camunda/camunda-modeler/issues/1298))
* `FIX`: allow well-known files to be dropped ([`46ae9b1`](https://github.com/camunda/camunda-modeler/commit/46ae9b1bf44b52c92f3a7cd8f2cf875593aca51c))
* `FIX`: restore empty file dialog ([#1301](https://github.com/camunda/camunda-modeler/issues/1301))
* `FIX`: correct undo/redo behavior ([#1218](https://github.com/camunda/camunda-modeler/issues/1218))
* `FIX`: disable plugin menu item when function returns falsy value ([#1311](https://github.com/camunda/camunda-modeler/pull/1311))

#### BPMN

* `CHORE`: update to `bpmn-js@3.2.2`
* `FIX`: gracefully handle missing waypoints ([`45486f2`](https://github.com/bpmn-io/bpmn-js/commit/45486f2afe7f42fcac31be9ca477a7c94babe7d8))
* `FIX`: restore error dialog for broken diagram ([#1192](https://github.com/camunda/camunda-modeler/issues/1192))
* `FIX`: replace namespace util to not parse diagram twice ([`bdee98e`](https://github.com/camunda/camunda-modeler/commit/bdee98e1b34fa6088ce71d6d9ebf4b339cb812cc))

#### DMN

* `FEAT`: show input and output label first in editors ([#346](https://github.com/bpmn-io/dmn-js/issues/346))
* `CHORE`: update to `dmn-js@6.3.2`
* `FIX`: set dirty state correctly when view is changed
* `FIX`: properly destroy individual viewers on dmn-js destruction ([#392](https://github.com/bpmn-io/dmn-js/pull/392))
* `FIX`: change active view when sheets change ([#1310](https://github.com/camunda/camunda-modeler/pull/1310))

## 3.0.0-beta.2

#### General

* `CHORE`: restore improved image resolution, supposedly shipped with `v3.0.0-0` already ([#486](https://github.com/camunda/camunda-modeler/issues/486))
* `FIX`: set align to origin offset to saner default
* `FIX`: ensure new diagrams contain unique ids for process, case and decision elements

## 3.0.0-beta.1

#### General

* `FIX`: handle unrecognized, non-file arguments passed to application ([#1237](https://github.com/camunda/camunda-modeler/issues/1237))

## 3.0.0-beta.0

#### General

* `FEAT`: add feature toggles ([#1159](https://github.com/camunda/camunda-modeler/issues/1159))
* `FEAT`: add BPMN only mode ([#872](https://github.com/camunda/camunda-modeler/issues/872))
* `FEAT`: rework file dropping
* `FEAT`: improve logging across the application
* `FEAT`: allow disabling plug-ins via flag ([`4b365482`](https://github.com/camunda/camunda-modeler/commit/4b3654825d033035e588e33927ceee4ce089af44))
* `FEAT`: align diagrams to `(0,0)` on save to prevent negative coordinates ([#982](https://github.com/camunda/camunda-modeler/issues/982), [#1183](https://github.com/camunda/camunda-modeler/issues/1183))
* `FEAT`: drop diagram origin cross ([#1096](https://github.com/camunda/camunda-modeler/issues/1096))
* `FEAT`: unify search paths for plug-ins and element templates ([#597](https://github.com/camunda/camunda-modeler/issues/597))
* `FEAT`: show full path to diagram as tab title ([#1187](https://github.com/camunda/camunda-modeler/issues/1187))
* `FEAT`: make application logs available on file system ([#1156](https://github.com/camunda/camunda-modeler/issues/1156))
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
