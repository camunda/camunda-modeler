# Changelog

All notable changes to the [Camunda Modeler](https://github.com/camunda/camunda-modeler) are documented here. We use [semantic versioning](http://semver.org/) for releases.

## Unreleased

___Note:__ Yet to be released changes appear here._

## 5.43.1

* `DEPS`: update to `camunda-bpmn-js-behaviors@1.12.1`

### BPMN

* `FIX`: fix crash when call activity without extension elements is used in Camunda 7 ([#5541](https://github.com/camunda/camunda-modeler/issues/5541))

## 5.43.0

* `DEPS`: update to `@bpmn-io/properties-panel@3.35.1`
* `DEPS`: update to `@bpmn-io/variable-resolver@1.3.7`
* `DEPS`: update to `@camunda/rpa-integration@1.3.2`
* `DEPS`: update to `@camunda/task-testing@2.0.1`
* `DEPS`: update to `bpmn-js-element-templates@2.18.0`
* `DEPS`: update to `bpmn-js-properties-panel@5.45.0`
* `DEPS`: update to `camunda-bpmn-js@5.16.0`
* `DEPS`: update to `camunda-dmn-js@3.6.0`
* `DEPS`: update to `dmn-js@17.5.0`
* `DEPS`: update to `dmn-js-properties-panel@3.9.0`
* `DEPS`: update to `dmn-js-shared@17.5.0`
* `DEPS`: update to `min-dom@5.1.2`

### General

* `FEAT`: add connection manager ([#4972](https://github.com/camunda/camunda-modeler/issues/4972))
* `FEAT`: provide incident data in readable format ([#5428](https://github.com/camunda/camunda-modeler/issues/5428))
* `FEAT`: make the properties panel open per default ([#5514](https://github.com/camunda/camunda-modeler/issues/5514))
* `FIX`: make task testing work in process applications ([#5460](https://github.com/camunda/camunda-modeler/issues/5460))
* `FIX`: migrate configs when file path changes ([#5464](https://github.com/camunda/camunda-modeler/pull/5464/))
* `FIX`: configured tenantId is also used for task testing API calls ([#5422](https://github.com/camunda/camunda-modeler/pull/5422))

### BPMN

* `FEAT`: support timer event templates ([#5380](https://github.com/camunda/camunda-modeler/issues/5380))
* `FEAT`: display `id` and `version` for unknown element templates ([bpmn-io/bpmn-js-element-templates#203](https://github.com/bpmn-io/bpmn-js-element-templates/pull/203))
* `FEAT`: make outputs and child variables propagation mutually exclusive ([#5402](https://github.com/camunda/camunda-modeler/issues/5402))
* `FEAT`: propagate variables before mapping in Camunda 7 ([#5396](https://github.com/camunda/camunda-modeler/issues/5396))
* `FEAT`: hide `<bpmn:CallActivity>` Output group if `zeebe:propagateAllChildVariables` is true ([bpmn-io/bpmn-js-properties-panel#1173](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/1173))
* `FIX`: update on `import.done` instead of `root.added` to prevent stale element ([bpmn-io/bpmn-js-properties-panel#1169](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/1169))
* `FIX`: keep focus when pasting expression into FEEL-optional field ([#5421](https://github.com/camunda/camunda-modeler/issues/5421))
* `FIX`: remove properties instead of replacing element on template removal ([#5336](https://github.com/camunda/camunda-modeler/issues/5336))

### RPA

* `FEAT`: align rpa status colors with modeler theme ([#5510](https://github.com/camunda/camunda-modeler/pull/5510))

## 5.42.0

* `DEPS`: update to `@bpmn-io/properties-panel@3.34.0`
* `DEPS`: update to `@camunda/linting@3.45.0`
* `DEPS`: update to `@camunda/rpa-integration@1.2.2`
* `DEPS`: update to `@camunda/task-testing@1.0.5`
* `DEPS`: update to `bpmn-js@18.9.1`
* `DEPS`: update to `bpmn-js-element-templates@2.16.1`
* `DEPS`: update to `bpmn-js-properties-panel@5.43.0`
* `DEPS`: update to `camunda-bpmn-js@5.15.0`

### General

* `FEAT`: remove title attribute when unnecessary ([bpmn-io/properties-panel#455](https://github.com/bpmn-io/properties-panel/pull/455))
* `FIX`: improve tooltip behavior ([#5217](https://github.com/camunda/camunda-modeler/issues/5217), [#4857](https://github.com/camunda/camunda-modeler/issues/4857))
* `FIX`: correctly handle trimming and debouncing ([#5389](https://github.com/camunda/camunda-modeler/issues/5389), [#4967](https://github.com/camunda/camunda-modeler/issues/4967), [#5392](https://github.com/camunda/camunda-modeler/issues/5392))

### BPMN

* `FEAT`: visually link external label with its target ([#369](https://github.com/camunda/camunda-modeler/issues/369))
* `FEAT`: allow copying data object references and `isCollection` property ([bpmn-io/bpmn-js#2348](https://github.com/bpmn-io/bpmn-js/pull/2348))
* `FEAT`: support templating signal events ([#5381](https://github.com/camunda/camunda-modeler/issues/5381))
* `FEAT`: add `event-based-gateway` rule ([#5194](https://github.com/camunda/camunda-modeler/issues/5194))
* `FIX`: ensure FEEL expression is enforced for `feel: required` properties ([#4967](https://github.com/camunda/camunda-modeler/issues/4967))
* `FIX`: task testing does not show Operate button on error state ([#5391](https://github.com/camunda/camunda-modeler/issues/5391))
* `FIX`: better autocomplete suggestions in task testing ([#5475](https://github.com/camunda/camunda-modeler/pull/5475))

### RPA

* `FIX`: refresh list of files on editor change

## 5.41.0

* `DEPS`: update to `@bpmn-io/form-js@1.18.0`
* `DEPS`: update to `@bpmn-io/properties-panel@3.33.2`
* `DEPS`: update to `@camunda/form-playground@0.23.0`
* `DEPS`: update to `@camunda/linting@3.44.0`
* `DEPS`: update to `bpmn-js@18.8.0`
* `DEPS`: update to `bpmn-js-properties-panel@5.42.3`
* `DEPS`: update to `bpmn-js-element-templates@2.15.0`
* `DEPS`: update to `dmn-js-properties-panel@3.8.2`
* `DEPS`: update to `@camunda/task-testing@1.0.2`

### General

* `FEAT`: accept trailing `v2` or `/` for REST cluster URLs ([#5345](https://github.com/camunda/camunda-modeler/issues/5345))
* `FIX`: use `ZEEBE_GRPC_ADDRESS` in favor of deprecated `ZEEBE_ADDRESS` for cluster connections ([#5362](https://github.com/camunda/camunda-modeler/pull/5362))

### BPMN

* `FEAT`: show local and process variables in task testing outcome ([#5338](https://github.com/camunda/camunda-modeler/issues/5338))
* `FIX`: use maximize icon in open popup button ([@bpmn-io/properties-panel#438](https://github.com/bpmn-io/properties-panel/pull/444))
* `FIX`: remove empty values (`""`) also after blurring input fields([@bpmn-io/properties-panel#449](https://github.com/bpmn-io/properties-panel/pull/449))
* `FIX`: display process and local variables separately in task testing ([@camunda/task-testing#41](https://github.com/camunda/task-testing/pull/41))
* `FIX`: fix Operate URL in task testing for self-managed ([#5357](https://github.com/camunda/camunda-modeler/issues/5357))
* `FIX`: mark tasks in ad-hoc sub-process as unsupported ([#50](https://github.com/camunda/task-testing/pull/50))
* `FIX`: handle variables with the same name in process and local scope ([#48](https://github.com/camunda/task-testing/issues/48))

### Forms

* `FIX`: use field id as an identifier for custom properties ([#1443](https://github.com/bpmn-io/form-js/pull/1443))
* `FIX`: fix radio group default value after edit ([#1439](https://github.com/bpmn-io/form-js/pull/1439))

## 5.40.1

### General

* `FIX`: prevent task testing freeze for unsaved file ([#5341](https://github.com/camunda/camunda-modeler/issues/5341))
* `FIX`: correct task testing tracking ([#5347](https://github.com/camunda/camunda-modeler/pull/5347))

## 5.40.0

* `DEPS`: update to `bpmn-js@18.7.0`
* `DEPS`: update to `@camunda/linting@3.43.1`
* `DEPS`: update to `bpmn-js-properties-panel@5.42.1`
* `DEPS`: update to `bpmn-js-element-templates@2.14.0`
* `DEPS`: update to `bpmn-moddle@9.0.4`
* `DEPS`: update to `camunda-bpmn-js@5.14.2`
* `DEPS`: update to `diagram-js@15.4.0`
* `DEPS`: update to `electron@37.6.0`
* `DEPS`: update to `zeebe-bpmn-moddle@1.11.0`

### General

* `FEAT`: add task testing ([#5235](https://github.com/camunda/camunda-modeler/pull/5235))
* `FEAT`: mark Camunda 8.8 and 7.24 as stable ([#5265](https://github.com/camunda/camunda-modeler/issues/5265))
* `FIX`: make start instance work with REST API ([#5274](https://github.com/camunda/camunda-modeler/issues/5274))

### BPMN

* `FEAT`: add linting rule `no-interrupting-event-subprocess` ([camunda/linting#148](https://github.com/camunda/linting/pull/148))
* `FEAT`: support `activeElementsCollection` property on `zeebe:adHoc` ([camunda/element-templates-json-schema#198](https://github.com/camunda/element-templates-json-schema/pull/198), [bpmn-io/bpmn-js-element-templates#186](https://github.com/bpmn-io/bpmn-js-element-templates/pull/186))
* `FEAT`: create sub-process templates as expanded elements ([#5273](https://github.com/camunda/camunda-modeler/issues/5273))
* `FIX`: ensure popup menu keyboard navigation accounts for group order ([bpmn-io/diagram-js#989](https://github.com/bpmn-io/diagram-js/pull/989))
* `FIX`: revert `AdHocSubProcess#cancelRemainingInstances` default value removal ([bpmn-io/bpmn-moddle#132](https://github.com/bpmn-io/bpmn-moddle/pull/132))
* `FIX`: preserve variables with same name but different scopes ([bpmn-io/variable-resolver#56](https://github.com/bpmn-io/variable-resolver/pull/56))
* `FIX`: allow intermediate catch event without outgoing sequence flows in ad-hoc subprocess ([#5189](https://github.com/camunda/camunda-modeler/issues/5189))
* `FIX`: do not try to find unresolved variables of a broken expression ([bpmn-io/variable-resolver#50](https://github.com/bpmn-io/variable-resolver/issues/50))

## 5.39.0

* `DEPS`: update to `bpmn-js@18.6.3`
* `DEPS`: update to `@camunda/linting@3.42.0`
* `DEPS`: update to `@bpmn-io/properties-panel@3.33.0`
* `DEPS`: update to `bpmn-js-properties-panel@5.42.0`
* `DEPS`: update to `bpmn-js-element-templates@2.11.0`
* `DEPS`: update to `camunda-bpmn-js@5.13.0`
* `DEPS`: update to `bpmn-moddle@9.0.3`
* `DEPS`: update to `dmn-js@17.4.0`
* `DEPS`: update to `camunda-dmn-js@3.5.0`
* `DEPS`: update to `@bpmn-io/form-js@1.17.0`

### General

* `FEAT`: change privacy preferences to default all settings to enabled ([#5238](https://github.com/camunda/camunda-modeler/pull/5238))
* `FEAT`: support connection through both gRPC and REST when deploying and starting instance ([#4607](https://github.com/camunda/camunda-modeler/issues/4607))
* `FEAT`: support multiline feel strings in `camunda` dialect ([#5089](https://github.com/camunda/camunda-modeler/issues/5089))
* `FIX`: recognize unclosed feel string literal as syntax error ([#5190](https://github.com/camunda/camunda-modeler/issues/5190))

### BPMN

* `FEAT`: clean up ad-hoc subprocess when implementation type is changed ([camunda/camunda-bpmn-js-behaviors#104](https://github.com/camunda/camunda-bpmn-js-behaviors/pull/104), [camunda/camunda-bpmn-js-behaviors#106](https://github.com/camunda/camunda-bpmn-js-behaviors/pull/106))
* `FEAT`: add output collection props for `bpmn:AdHocSubProcess` ([bpmn-io/bpmn-js-properties-panel#1143](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/1143))
* `FEAT`: support job worker implementation of `bpmn:AdHocSubProcess` ([bpmn-io/bpmn-js-properties-panel#1144](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/1144))
* `FEAT`: support `zeebe:assignmentDefinition` binding ([bpmn-io/bpmn-js-element-templates#168](https://github.com/bpmn-io/bpmn-js-element-templates/pull/168))
* `FEAT`: support `zeebe:priorityDefinition` binding ([bpmn-io/bpmn-js-element-templates#171](https://github.com/bpmn-io/bpmn-js-element-templates/pull/171))
* `FEAT`: support `zeebe:taskSchedule` binding ([bpmn-io/bpmn-js-element-templates#173](https://github.com/bpmn-io/bpmn-js-element-templates/pull/173))
* `FEAT`: support `zeebe:adHoc` binding ([bpmn-io/bpmn-js-element-templates#175](https://github.com/bpmn-io/bpmn-js-element-templates/pull/175))
* `FIX`: trigger create mode if auto place of element with template not possible ([bpmn-io/bpmn-js-create-append-anything#56](https://github.com/bpmn-io/bpmn-js-create-append-anything/pull/56))
* `FIX`: use default values for displaying edited marker ([#5126](https://github.com/camunda/camunda-modeler/issues/5126))
* `FIX`: `cancelRemainingInstances` of ad-hoc sub-processes is unset by default ([bpmn-io/bpmn-js-properties-panel#1148](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/1148), [bpmn-io/bpmn-moddle#131](https://github.com/bpmn-io/bpmn-moddle/issues/131))
* `FEAT`: handle `bpmn:AdHocSubProcess` with `zeebe:TaskDefinition` lint error ([camunda/linting#146](https://github.com/camunda/linting/pull/146))
* `FEAT`: handle `zeebe:AdHoc` `outputCollection` and `outputElement` lint errors ([camunda/linting#146](https://github.com/camunda/linting/pull/146))

## 5.38.1

* `DEPS`: update to `@camunda/linting@3.40.1`
* `DEPS`: update to `@bpmn-io/properties-panel@3.31.1`

### General

* `FIX`: revert inclusion of camunda builtin extensions due to performance issues ([camunda/bpmnlint-plugin-camunda-compat#215](https://github.com/camunda/bpmnlint-plugin-camunda-compat/pull/215))
* `FIX`: make `priority-definition` rule handle number value ([camunda/bpmnlint-plugin-camunda-compat#213](https://github.com/camunda/bpmnlint-plugin-camunda-compat/pull/213))
* `FIX`: template select button is now always visible ([bpmn-io/properties-panel#436](https://github.com/bpmn-io/properties-panel/pull/436))

## 5.38.0

### General

* `FEAT`: use FEEL parserDialect `camunda` for DMN and BPMN ([#4809](https://github.com/camunda/camunda-modeler/issues/4809))
* `FEAT`: allow to pass tenant ID with no authentication ([#5106](https://github.com/camunda/camunda-modeler/issues/5106))
* `FEAT`: support all Camunda FEEL builtins ([#3983](https://github.com/camunda/camunda-modeler/issues/3983))
* `FIX`: use uniform GTK symbols on Linux ([#5095](https://github.com/camunda/camunda-modeler/issues/5095))
* `FIX`: display tooltip on number fields ([#5102](https://github.com/camunda/camunda-modeler/issues/5102))
* `FIX`: use `monospace` font in code editors ([#5140](https://github.com/camunda/camunda-modeler/issues/5140))
* `DEPS`: update to `electron@37`
* `DEPS`: update to `dmn-js@17.3.0`
* `DEPS`: update to `camunda-bpmn-js@5.11.0`
* `DEPS`: update to `camunda-dmn-js@3.4.0`
* `DEPS`: update to `bpmn-js-properties-panel@5.39.0`
* `DEPS`: update to `bpmn-js-element-templates@2.8.0`
* `DEPS`: update to `@camunda/linting@3.40.0`
* `DEPS`: update to `@bpmn-io/form-js@1.16.0`
* `DEPS`: update to `@camunda/form-playground@0.20.0`
* `DEPS`: update to `@camunda/form-linting@0.23.0`
* `DEPS`: update to `@bpmn-io/dmn-migrate@0.6.0`
* `DEPS`: update to `@bpmn-io/properties-panel@3.31.0`

### BPMN

* `FEAT`: add linting for IO mapping ([#5137](https://github.com/camunda/camunda-modeler/issues/5137))
* `FEAT`: support `bindingType` property ([bpmn-io/bpmn-js-element-templates#165](https://github.com/bpmn-io/bpmn-js-element-templates/pull/165))
* `FEAT`: support properties of type `bpmn:Expression` ([bpmn-io/bpmn-js-element-templates#161](https://github.com/bpmn-io/bpmn-js-element-templates/pull/161))
* `FEAT`: support `zeebe:script` in element templates ([#5026](https://github.com/camunda/camunda-modeler/issues/5026))
* `FEAT`: support `zeebe:calledDecision` in element templates ([#5025](https://github.com/camunda/camunda-modeler/issues/5025))
* `FEAT`: support `zeebe:formDefintion` in element templates ([#5073](https://github.com/camunda/camunda-modeler/issues/5073))
* `FIX`: keep groups closed when template is first applied ([#5039](https://github.com/camunda/camunda-modeler/issues/5039))
* `FIX`: correctly handle numeric conditions in element templates ([bpmn-io/bpmn-js-element-templates#69](https://github.com/bpmn-io/bpmn-js-element-templates/issues/69))
* `FIX`: handle participants when removing empty `zeebe:VersionTag` ([#5115](https://github.com/camunda/camunda-modeler/issues/5115))

### DMN

* `FEAT`: input entries of a decision table use the unary-tests expression language dialect ([bpmn-io/dmn-js#947](https://github.com/bpmn-io/dmn-js/pull/947))

### Forms

* `FEAT`: support pattern validation custom message ([#1360](https://github.com/bpmn-io/form-js/issues/1360))
* `FIX`: flush debounced fields on enter ([#35032](https://github.com/camunda/camunda/issues/35032))
* `FIX`: properties panel toggle configurations work again ([5df5bf5](https://github.com/bpmn-io/form-js/commit/5df5bf58ea43045bb8693f6eb5411f5fcbfcf8b2))

### RPA

* `FEAT`: add RPA multi-file and linting ([#5152](https://github.com/camunda/camunda-modeler/issues/5152))

## 5.37.0

* `DEPS`: update to `@bpmn-io/form-js@1.15.3`
* `DEPS`: update to `@bpmn-io/properties-panel@3.30.0`
* `DEPS`: update to `@camunda/linting@3.38.0`
* `DEPS`: update to `@camunda/rpa-integration@1.0.2`
* `DEPS`: update to `bpmn-js-properties-panel@5.37.0`
* `DEPS`: update to `bpmn-moddle@9.0.2`

### General

* `FEAT`: make Camunda 8 start instance variables input a code editor ([#4976](https://github.com/camunda/camunda-modeler/issues/4976))
* `FEAT`: return registered settings values ([#5069](https://github.com/camunda/camunda-modeler/pull/5069))
* `FEAT`: allow to subscribe prior to settings registration ([#5069](https://github.com/camunda/camunda-modeler/pull/5069))
* `FIX`: handle missing setting registration on `settings.get` ([#5069](https://github.com/camunda/camunda-modeler/pull/5069))

### BPMN

* `FEAT`: support `creating` and `canceling` task listeners ([#5000](https://github.com/camunda/camunda-modeler/issues/5000))
* `FEAT`: show lint error if more than one blank start event in subprocess ([bpmn-io/bpmnlint#187](https://github.com/bpmn-io/bpmnlint/pull/187))
* `CHORE`: update documentation link for C7 HTTL lint error ([camunda/bpmnlint-plugin-camunda-compat#202](https://github.com/camunda/bpmnlint-plugin-camunda-compat/pull/202))

## 5.36.1

* `DEPS`: update to `@bpmn-io/properties-panel@3.29.1`

### General

* `FIX`: fix debounce problem in the properties panel ([#5085](https://github.com/camunda/camunda-modeler/issues/5085))
* `FIX`: configure deployment immediately if cannot deploy & run ([#5048](https://github.com/camunda/camunda-modeler/issues/5048))
* `FIX`: run instance without remembering credentials ([#5083](https://github.com/camunda/camunda-modeler/issues/5083))
* `FIX`: show validation error for deployment on touch ([#5081](https://github.com/camunda/camunda-modeler/issues/5081))

## 5.36.0

* `DEPS`: update to `@bpmn-io/properties-panel@3.27.4`
* `DEPS`: update to `bpmn-js@18.6.2`
* `DEPS`: update to `bpmn-js-element-templates@2.6.0`
* `DEPS`: update to `bpmn-js-properties-panel@5.36.1`
* `DEPS`: update to `camunda-bpmn-js@5.10.0`
* `DEPS`: update to `camunda-dmn-js@3.3.0`
* `DEPS`: update to `camunda-linting@3.37.1`
* `DEPS`: update to `diagram-js@15.3.0`
* `DEPS`: update to `dmn-js@17.2.1`
* `DEPS`: update to `dmn-js-properties-panel@3.8.0`
* `DEPS`: update to `electron@36`

### General

* `FEAT`: add process application deployment ([#4667](https://github.com/camunda/camunda-modeler/issues/4667))
* `FIX`: trim whitespace in properties panel entries ([#2385](https://github.com/camunda/camunda-modeler/issues/2385), [#4818](https://github.com/camunda/camunda-modeler/issues/4818))
* `FIX`: show literal values in FEEL suggestions ([#4743](https://github.com/camunda/camunda-modeler/issues/4743))

### BPMN

* `FEAT`: support `zeebe:userTask` binding property in element templates ([#4582](https://github.com/camunda/camunda-modeler/issues/4582))
* `FIX`: allow intermediate throw events without outgoing sequence flows in ad-hoc-subprocess ([#4985](https://github.com/camunda/camunda-modeler/issues/4985))
* `FIX`: correctly reuse `bpmn:Message` properties when changing templates ([bpmn-io/bpmn-js-element-templates#154](https://github.com/bpmn-io/bpmn-js-element-templates/pull/154))
* `FIX`: add empty alt attribute for icons ([#4720](https://github.com/camunda/camunda-modeler/issues/4720))
* `FIX`: center task markers ([#4806](https://github.com/camunda/camunda-modeler/issues/4806))

### DMN

* `FEAT`: show link to decision in Operate ([#4926](https://github.com/camunda/camunda-modeler/pull/4926))

## 5.35.0

* `DEPS`: update to `bpmn-js@18.6.1`
* `DEPS`: update to `camunda-bpmn-js@5.9.0`
* `DEPS`: update to `camunda-linting@3.37.0`
* `DEPS`: update to `@camunda/rpa-integration@1.0.0`

### General

* `FEAT`: support Camunda 7.24 ([#4984](https://github.com/camunda/camunda-modeler/issues/4984))
* `FEAT`: add application settings ([#2913](https://github.com/camunda/camunda-modeler/issues/2913))

### BPMN

* `FEAT`: allow text annotations for message flows ([bpmn-io/bpmn-js#2292](https://github.com/bpmn-io/bpmn-js/pull/2292)
* `FEAT`: render element template icons on sub-processes and call activities ([bpmn-io/element-template-icon-renderer#22](https://github.com/bpmn-io/element-template-icon-renderer/pull/22))
* `FEAT`: `keywords` of element templates can be searched ([#4853](https://github.com/camunda/camunda-modeler/issues/4853))
* `FEAT`: prioritize `search` over `description` when matching popup menu entries ([bpmn-io/diagram-js#963](https://github.com/bpmn-io/diagram-js/pull/963))
* `FEAT`: sort `search` terms across all keys ([bpmn-io/diagram-js#963](https://github.com/bpmn-io/diagram-js/pull/963))
* `FIX`: always select first search entry ([#4948](https://github.com/camunda/camunda-modeler/issues/4948))
* `FIX`: show correct error message for form tags ([#4872](https://github.com/camunda/camunda-modeler/issues/4872))
* `FIX`: copy error, escalation, message and signal references when copying elements ([#4863](https://github.com/camunda/camunda-modeler/issues/4863), [#4567](https://github.com/camunda/camunda-modeler/issues/4567))

### RPA

* `FEAT`: allow commenting via keyboard shortcut ([camunda/rpa-frontend#6](https://github.com/camunda/rpa-frontend/issues/6))
* `FEAT`: support RPA scripts in file context ([#4893](https://github.com/camunda/camunda-modeler/issues/4893))
* `FEAT`: add `.rpa` file association ([#4963](https://github.com/camunda/camunda-modeler/issues/4963))
  * If you're on Windows or Linux you need to [rewire the file association](https://docs.camunda.io/docs/components/modeler/desktop-modeler/install-the-modeler/) manually. On macOS the file association is done automatically.
  * After the update you need to restart Finder (macOS) or Explorer (Windows) to see the new file association.

## 5.34.0

* `DEPS`: update to `bpmn-js-properties-panel@5.35.0`
* `DEPS`: update to `@bpmn-io/properties-panel@3.26.4`
* `DEPS`: update to `@camunda/linting@3.36.0`
* `DEPS`: update to `dmn-js@17.2.0`
* `DEPS`: update to `camunda-dmn-js@^3.2.0`
* `DEPS`: update to `bpmn-js@18.4.0`
* `DEPS`: update to `camunda-bpmn-js@5.7.1`
* `DEPS`: update to `@bpmn-io/form-js@1.15.1`
* `DEPS`: update to `@camunda/form-linting@0.22.0`
* `DEPS`: update to `@camunda/form-playground@0.21.1`
* `DEPS`: update to `@camunda/rpa-integration@0.2.0`

### General

* `FEAT`: mark Camunda 7.23 and Camunda 8.7 as latest ([#4900](https://github.com/camunda/camunda-modeler/issues/4900))
* `FEAT`: add process applications feature ([#4762](https://github.com/camunda/camunda-modeler/pull/4762))
* `FEAT`: add resources linking in process application ([#4668](https://github.com/camunda/camunda-modeler/issues/4668))
* `FEAT`: enable RPA editor per default ([#4895](https://github.com/camunda/camunda-modeler/issues/4895))

### BPMN

* `FEAT`: render collapsed event subprocess icons ([bpmn-io/bpmn-js#50](https://github.com/bpmn-io/bpmn-js/issues/50))
* `FEAT`: add ad-hoc subprocess completion support ([#4850](https://github.com/camunda/camunda-modeler/issues/4850))
* `FIX`: make `link-event` rule check only BPMN compliance ([#4870](https://github.com/camunda/camunda-modeler/issues/4870))
* `FIX`: do not require start and end events in ad-hoc subprocess ([bpmn-io/bpmnlint#176](https://github.com/bpmn-io/bpmnlint/pull/176))
* `FIX`: allow escalation boundary event to be attached to ad-hoc sub-process ([#4859](https://github.com/camunda/camunda-modeler/issues/4859))
* `FIX`: clarify wording for input/output groups ([#4889](https://github.com/camunda/camunda-modeler/issues/4889))
* `FIX`: remove default start event for ad-hoc subprocess ([#4858](https://github.com/camunda/camunda-modeler/issues/4858))
* `FIX`: show modeling feedback error for data objects ([#4345](https://github.com/camunda/camunda-modeler/issues/4345))

### DMN

* `FEAT`: add delete action for multi element context ([#4554](https://github.com/camunda/camunda-modeler/issues/4554))

### Forms

- `FEAT`: update form-js@1.15.0 mapping and add 8.8 ([`camunda/form-linting#5810775`](https://github.com/camunda/form-linting/commit/5810775)))
- `FEAT`: remove Camunda special document endpoint logic ([bpmn-io/form-js#1375](https://github.com/bpmn-io/form-js/pull/1375))
- `FIX`: reset default value when static option is deleted ([bpmn-io/form-js#1364](https://github.com/bpmn-io/form-js/pull/1364))
- `FIX`: fix form editor input autocomplete ([#4758](https://github.com/camunda/camunda-modeler/issues/4758))

## 5.33.1

### General

* `FIX`: C8 OAuth connection with custom audience ([#4871](https://github.com/camunda/camunda-modeler/issues/4871))

## 5.33.0

* `DEPS`: update to `bpmn-js@18.3.1`
* `DEPS`: update to `bpmn-js-element-templates@2.5.3`
* `DEPS`: update to `bpmn-js-properties-panel@5.32.1`
* `DEPS`: update to `camunda-bpmn-js@5.6.1`
* `DEPS`: update to `camunda-dmn-js@3.1.1`
* `DEPS`: update to `@bpmn-io/properties-panel@3.26.2`
* `DEPS`: update to `@camunda/improved-canvas@1.7.6`
* `DEPS`: update to `@camunda/linting@3.33.0`

### General

* `FEAT`: support Camunda 8.8
* `FEAT`: recognize documentation URLs provided via lint rules ([#4491](https://github.com/camunda/camunda-modeler/issues/4491))
* `FEAT`: add RPA editor to Camunda Modeler ([#4807](https://github.com/camunda/camunda-modeler/pull/4807))
* `FIX`: allow selecting text from tooltips ([#4834](https://github.com/camunda/camunda-modeler/issues/4834))

### BPMN

* `FEAT`: improve ad-hoc subprocess linting ([#4811](https://github.com/camunda/camunda-modeler/issues/4811))
* `FEAT`: annotate popup menu entries with Camunda specific details ([#4802](https://github.com/camunda/camunda-modeler/issues/4802), [camunda/camunda-bpmn-js#400](https://github.com/camunda/camunda-bpmn-js/pull/40))
* `FEAT`: allow to replace between variants of typed events ([#4523](https://github.com/camunda/camunda-modeler/issues/4523), [bpmn-io/bpmn-js#2282](https://github.com/bpmn-io/bpmn-js/pull/2282))
* `FIX`: suggest ad-hoc subprocess with new context pad ([#4813](https://github.com/camunda/camunda-modeler/issues/4813))
* `FIX`: move artifacts with local space tool ([#4172](https://github.com/camunda/camunda-modeler/issues/4172))
* `FIX`: subscription coorelation key tooltip added ([#4833](https://github.com/camunda/camunda-modeler/issues/4833))
* `FIX`: use color picker colors in the menu action ([#4756](https://github.com/camunda/camunda-modeler/issues/4756))

### DMN

* `FIX`: display only a single version tag field in Camunda 7 ([#4844](https://github.com/camunda/camunda-modeler/issues/4844))

## 5.32.0

* `DEPS`: update to `@bpmn-io/extract-process-variables@1.0.1`
* `DEPS`: update to `@bpmn-io/properties-panel@3.26.0`
* `DEPS`: update to `@bpmn-io/form-js@1.13.2`
* `DEPS`: update to `@camunda/form-playground@0.19.2`
* `DEPS`: update to `@camunda/linting@3.31.0`
* `DEPS`: update to `bpmn-js@18.2.0`
* `DEPS`: update to `bpmn-js-element-templates@2.5.2`
* `DEPS`: update to `bpmn-js-properties-panel@5.31.0`
* `DEPS`: update to `bpmnlint@11.0.0`
* `DEPS`: update to `camunda-bpmn-js@5.5.1`
* `DEPS`: update to `camunda-dmn-js@3.0.0`
* `DEPS`: update to `diagram-js@15.2.4`
* `DEPS`: update to `dmn-js@17.1.0`
* `DEPS`: update to `dmn-js-shared@17.1.0`
* `DEPS`: update to `zeebe-bpmn-moddle@1.9.0`
* `DEPS`: update to `electron@34`

### General

* `FEAT`: suggest latest Camunda FEEL built-ins ([@bpmn-io/feel-editor#65](https://github.com/bpmn-io/feel-editor/pull/65))

### BPMN

* `FEAT`: support ad-hoc subprocesses in replace menu ([bpmn-js#2276](https://github.com/bpmn-io/bpmn-js/pull/2276))
* `FEAT`: support ad-hoc subprocesses in create/append anything menu ([bpmn-js-create-append-anything#47](https://github.com/bpmn-io/bpmn-js-create-append-anything/pull/47))
* `FEAT`: support _Active elements_ properties for ad-hoc subprocesses ([bpmn-js-properties-panel#1105](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/1105))
* `FEAT`: suggest latest Camunda FEEL built-ins ([bpmn-io/feel-editor#65](https://github.com/bpmn-io/feel-editor/pull/65))
* `FEAT`: support binding type `zeebe:linkedResource` ([bpmn-js-element-templates#137](https://github.com/bpmn-io/bpmn-js-element-templates/issues/137))
* `FIX`: take scope into account when resolving variables ([bpmn-io/variable-resolver#43](https://github.com/bpmn-io/variable-resolver/pull/43))
* `FIX`: make `feel` default value `static` for inputs and outputs ([#4593](https://github.com/camunda/camunda-modeler/issues/4593))

### DMN

* `FEAT`: suggest latest Camunda FEEL built-ins ([bpmn-io/feel-editor#65](https://github.com/bpmn-io/feel-editor/pull/65))
* `FIX`: make name change behavior not break on name change ([bpmn-io/dmn-js#917](https://github.com/bpmn-io/dmn-js/pull/917))
* `FIX`: display updated formal parameters suggestions ([bpmn-io/dmn-js#914](https://github.com/bpmn-io/dmn-js/pull/914))
* `FIX`: prevent flashing and drag preview icon for overview resize action ([#4781](https://github.com/camunda/camunda-modeler/pull/4781))

## 5.31.0

### General

* `FIX`: use `/processes` route for run instance link ([#4741](https://github.com/camunda/camunda-modeler/issues/4741))
* `DEPS`: update to `@bpmn-io/form-js@1.13.1`
* `DEPS`: update to `@camunda/form-linting@0.20.0`
* `DEPS`: update to `@camunda/form-playground@0.19.1`
* `DEPS`: update to `@camunda/form-linting@0.19.0`
* `DEPS`: update to `@camunda/linting@3.30.0`
* `DEPS`: update to `bpmn-js-element-templates@2.4.0`
* `DEPS`: update to `bpmn-js-properties-panel@5.30.0`
* `DEPS`: update to `camunda-bpmn-js@5.4.1`

### BPMN

* `FEAT`: mark job worker-based user task managed by Camunda as deprecated ([#4690](https://github.com/camunda/camunda-modeler/issues/4690))
* `FEAT`: element templates runtime versions ([#4530](https://github.com/camunda/camunda-modeler/issues/4530))
* `FEAT`: make "Zeebe user task" the default implementation of user task ([#4648](https://github.com/camunda/camunda-modeler/issues/4648))
* `FEAT`: rename "Zeebe user task" to "Camunda user task" ([#4749](https://github.com/camunda/camunda-modeler/issues/4749))
* `FEAT`: rename task listener event types ([#4748](https://github.com/camunda/camunda-modeler/issues/4748))
* `FIX`: move template selector right below documentation group ([#4617](https://github.com/camunda/camunda-modeler/issues/4617))
* `FIX`: parse script task result as FEEL context ([#4614](https://github.com/camunda/camunda-modeler/issues/4614), [#4759](https://github.com/camunda/camunda-modeler/issues/4759))

### Forms

* `FEAT`: add `documentPreview` component ([bpmn-io/form-js#1329](https://github.com/bpmn-io/form-js/pull/1329), [bpmn-io/form-js#1332](https://github.com/bpmn-io/form-js/pull/1332))
* `FIX`: mark filepicker as unavailable in Camunda 7 ([#4733](https://github.com/camunda/camunda-modeler/issues/4733))

## 5.30.0

### General

* `FEAT`: show update button if update available ([#4606](https://github.com/camunda/camunda-modeler/pull/4606))
* `FEAT`: make bottom panel toggleable via keyboard ([#4516](https://github.com/camunda/camunda-modeler/issues/4516))
* `FEAT`: trigger core editor keyboard shortcuts on canvas focus only ([#4620](https://github.com/camunda/camunda-modeler/pull/4620))
* `FEAT`: integrate implicit keyboard binding into BPMN and DMN editors ([#4620](https://github.com/camunda/camunda-modeler/pull/4620))
* `FEAT`: expose `canvasFocus` state to menu actions ([#4620](https://github.com/camunda/camunda-modeler/pull/4620))
* `FEAT`: adjust bottom panel resize for better UX ([#4093](https://github.com/camunda/camunda-modeler/issues/4093))
* `FIX`: display status bar items in correct order ([#4714](https://github.com/camunda/camunda-modeler/pull/4714))
* `FIX`: handle multi-file deployment correctly in Camunda 7 ([#4694](https://github.com/camunda/camunda-modeler/issues/4694))
* `CHORE`: remove reset properties panel menu item ([#4516](https://github.com/camunda/camunda-modeler/issues/4516))
* `DEPS`: update to `electron@33.0.0` ([#4609](https://github.com/camunda/camunda-modeler/pull/4609))
* `DEPS`: update to `@bpmn-io/form-js@1.12.0`
* `DEPS`: update to `@bpmn-io/properties-panel@3.25.0`
* `DEPS`: update to `@bpmn-io/variable-outline@1.0.3`
* `DEPS`: update to `@camunda/linting@3.29.0`
* `DEPS`: update to `bpmn-js@18.1.1`
* `DEPS`: update to `bpmn-js-properties-panel@5.28.0`
* `DEPS`: update to `camunda-bpmn-js@5.2.1`
* `DEPS`: update to `camunda-dmn-js@3.0.0`
* `DEPS`: update to `diagram-js@15.2.3`
* `DEPS`: update to `dmn-js@17.0.3`
* `DEPS`: update to `dmn-js-properties-panel@3.7.0`
* `DEPS`: update to `zeebe-bpmn-moddle@1.7.0`

### BPMN

* `FEAT`: support user task listeners in Camunda 8 ([#4590](https://github.com/camunda/camunda-modeler/issues/4590))
* `FEAT`: make variables tab accessible via the application footer ([#4516](https://github.com/camunda/camunda-modeler/issues/4516))
* `FIX`: prevent long element name from shrinking icon ([#4505](https://github.com/camunda/camunda-modeler/issues/4505))
* `FEAT`: display exact matches on top of search ([#3439](https://github.com/camunda/camunda-modeler/issues/3439), [#4122](https://github.com/camunda/camunda-modeler/issues/4122))
* `FIX`: correct default extension used when saving Camunda 8 BPMN diagrams ([#4661](https://github.com/camunda/camunda-modeler/issues/4661))
* `FIX`: correctly handle duplicate entries and whitespace in `search` ([bpmn-io/diagram-js#932](https://github.com/bpmn-io/diagram-js/pull/932))
* `FIX`: find `search` terms across all keys ([bpmn-io/diagram-js#932](https://github.com/bpmn-io/diagram-js/pull/932), [#4182](https://github.com/camunda/camunda-modeler/issues/4182))
* `FIX`: correct dangling selection after search pad interaction ([bpmn-io/diagram-js#947](https://github.com/bpmn-io/diagram-js/pull/947))
* `FIX`: create new user task form only if user task form referenced ([camunda/camunda-bpmn-js-behaviors#85](https://github.com/camunda/camunda-bpmn-js-behaviors/pull/85), [#4658](https://github.com/camunda/camunda-modeler/issues/4658))
* `FIX`: keep multi-instance characteristics on type change ([#4310](https://github.com/camunda/camunda-modeler/issues/4310))
* `FIX`: do not mark job worker user task as incorrect ([#4718](https://github.com/camunda/camunda-modeler/issues/4718))

### DMN

* `FIX`: correct changing literal expression name from properties panel ([#4684](https://github.com/camunda/camunda-modeler/issues/4684))
* `FIX`: update formal parameters suggestions on change ([#4544](https://github.com/camunda/camunda-modeler/issues/4544))

## 5.29.0

### General

* `FEAT`: support Camunda 8.7 and 7.23 ([#4610](https://github.com/camunda/camunda-modeler/issues/4610))
* `FEAT`: populate empty tab values from available create options ([#4575](https://github.com/camunda/camunda-modeler/pull/4575))
* `FEAT`: allow plug-ins to contribute custom file types ([#4568](https://github.com/camunda/camunda-modeler/pull/4568))
* `FEAT`: support Camunda 8 FEEL built-ins ([bpmn-io/feel-editor#62](https://github.com/bpmn-io/feel-editor/pull/62))
* `FIX`: improve validation of `first-item` FEEL rule ([bpmn-io/dmn-js#894](https://github.com/bpmn-io/dmn-js/issues/894))
* `DEPS`: update to Electron 32 ([#4483](https://github.com/camunda/camunda-modeler/issues/4483))
* `DEPS`: update to `bpmn-js-properties-panel@5.25.0`
* `DEPS`: update to `bpmn-js-element-templates@2.3.0`
* `DEPS`: update to `@camunda/improved-canvas@1.7.5`
* `DEPS`: update to `@camunda/linting@3.28.0`
* `DEPS`: update to `dmn-js@16.8.1`
* `DEPS`: update to `dmn-js-shared@16.8.0`
* `DEPS`: update to `camunda-dmn-js@2.10.1`
* `DEPS`: update to `camunda-bpmn-js@4.20.2`
* `DEPS`: update to `diagram-js@14.11.3`

### BPMN

* `FEAT`: add Camunda 8.7 and 7.23 linter configurations ([camunda/bpmnlint-plugin-camunda-compat#176](https://github.com/camunda/bpmnlint-plugin-camunda-compat/pull/176))
* `FEAT`: lint user tasks to be implemented as Zeebe user tasks starting with Camunda 8.7 ([camunda/bpmnlint-plugin-camunda-compat#179](https://github.com/camunda/bpmnlint-plugin-camunda-compat/pull/179))
* `FIX`: lint message end events for task definition ([camunda/bpmnlint-plugin-camunda-compat#180](https://github.com/camunda/bpmnlint-plugin-camunda-compat/pull/180))
* `FIX`: correct broken styles after loading variable outline ([#4555](https://github.com/camunda/camunda-modeler/issues/4555))
* `FIX`: show lint errors for FEEL expressions used in BPMN processes ([camunda/bpmnlint-plugin-camunda-compat#175](https://github.com/camunda/bpmnlint-plugin-camunda-compat/pull/175))
* `FIX`: search result highlight ([#4538](https://github.com/camunda/camunda-modeler/issues/4538))
* `FIX`: do not change zoom when search openes ([bpmn-io/diagram-js#931](https://github.com/bpmn-io/diagram-js/pull/931))
* `FIX`: prevent search from shifting down the canvas ([#4547](https://github.com/camunda/camunda-modeler/issues/4547))

### DMN

* `FIX`: display parameterless functions suggestion correctly ([bpmn-io/dmn-js#898](https://github.com/bpmn-io/dmn-js/issues/898))
* `FIX`: variable name changes when element name/label changes ([bpmn-io/dmn-js#863](https://github.com/bpmn-io/dmn-js/issues/863))
* `FIX`: make literal expression editor hitbox bigger in BKM ([#4545](https://github.com/camunda/camunda-modeler/issues/4545))
* `FIX`: make literal expression variables table styles explicit ([#4550](https://github.com/camunda/camunda-modeler/issues/4550))

### Forms

* `FEAT`: implement `filepicker` component ([bpmn-io/form-js#1264](https://github.com/bpmn-io/form-js/pull/1264))
* `FIX`: align drag preview/sticker properly ([bpmn-io/form-js#1267](https://github.com/bpmn-io/form-js/pull/1267))
* `FIX`: adjust the am/pm time placeholder to `hh:mm --` ([bpmn-io/form-js#1289](https://github.com/bpmn-io/form-js/pull/1289))
* `FIX`: do not create a simple label in datetime components ([bpmn-io/form-js#1292](https://github.com/bpmn-io/form-js/pull/1292))

## 5.28.0

### General

* `FEAT`: mark Camunda 7.22 and Camunda 8.6 as latest ([#4522](https://github.com/camunda/camunda-modeler/issues/4522))
* `FEAT`: lint first item access ([#3604](https://github.com/camunda/camunda-modeler/issues/3604), [bpmn-io/feel-lint#25](https://github.com/bpmn-io/feel-lint/issues/25))
* `FEAT`: support Camunda 8.6 built-ins ([bpmn-io/feel-editor#62](https://github.com/bpmn-io/feel-editor/pull/62), [#4500](https://github.com/camunda/camunda-modeler/issues/4500))
* `DEPS`: update to `dmn-js@16.7.1`
* `DEPS`: update to `dmn-js-shared@16.7.1`
* `DEPS`: update to `camunda-dmn-js@2.9.1`
* `DEPS`: update to `diagram-js@14.11.1`
* `DEPS`: update to `bpmn-js@17.11.1`
* `DEPS`: update to `@bpmn-io/properties-panel@3.24.1`
* `DEPS`: update to `bpmn-js-properties-panel@5.24.0`
* `DEPS`: update to `bpmn-js-element-templates@2.2.1`
* `DEPS`: update to `camunda-bpmn-js@4.20.0`
* `DEPS`: update to `@camunda/linting@3.27.1`

### BPMN

* `FEAT`: align search styles with other popups ([#2187](https://github.com/bpmn-io/bpmn-js/pull/2187))
* `FEAT`: prioritize start of tokens in search results ([#2187](https://github.com/bpmn-io/bpmn-js/pull/2187))
* `FIX`: pasting compensation activity without boundary event ([bpmn-io/bpmn-js#2070](https://github.com/bpmn-io/bpmn-js/issues/2070))
* `FIX`: lane resize constraints for se and nw direction ([bpmn-io/bpmn-js#2209](https://github.com/bpmn-io/bpmn-js/issues/2209))
* `FIX`: auto place elements vertically in sub-processes ([bpmn-io/bpmn-js#2127](https://github.com/bpmn-io/bpmn-js/issues/2127))
* `FIX`: hide lane label during direct editing ([#4477](https://github.com/camunda/camunda-modeler/issues/4477))
* `FIX`: cast element template default `number` and `boolean` properties to FEEL ([bpmn-io/bpmn-js-element-templates#121](https://github.com/bpmn-io/bpmn-js-element-templates/pull/121))
* `FIX`: version tag input looses focus ([#4513](https://github.com/camunda/camunda-modeler/issues/4513))
* `FIX`: version tag linting is broken ([#4519](https://github.com/camunda/camunda-modeler/issues/4519))
* `FIX`: gracefully handle missing name and ID during linting ([#4473](https://github.com/camunda/camunda-modeler/issues/4473))

### DMN

* `FIX`: make literal expression focus hitbox larger ([#4342](https://github.com/camunda/camunda-modeler/issues/4342))

### Forms

* `FIX`: serialize object table cells using the JSON serializer ([bpmn-io/form-js#1139](https://github.com/bpmn-io/form-js/issues/1139))
* `FIX`: don't clip radio buttons ([bpmn-io/form-js#1261](https://github.com/bpmn-io/form-js/pull/1261))

## 5.27.0

* `DEPS`: update to `bpmn-js@17.9.2`
* `DEPS`: update to `bpmn-js-properties-panel@5.23.0`
* `DEPS`: update to `bpmn-js-element-templates@2.2.0`
* `DEPS`: update to `diagram-js@14.9.0`
* `DEPS`: update to `dmn-js@16.7.0`
* `DEPS`: update to `dmn-js-properties-panel@3.5.2`
* `DEPS`: update to `camunda-dmn-js@2.9.0`
* `DEPS`: update to `zeebe-bpmn-moddle@1.6.0`
* `DEPS`: update to `camunda-bpmn-js@4.19.0`
* `DEPS`: update to `@camunda/linting@3.26.1`
* `DEPS`: update to `@bpmn-io/variable-outline@1.0.2`
* `DEPS`: update to `@bpmn-io/form-js@1.10.0`
* `DEPS`: update to `electron@31.4.0`

### General

* `FEAT`: automatically download Camunda connectors by default ([#4302](https://github.com/camunda/camunda-modeler/issues/4302))

### BPMN

* `FEAT`: add variable outline tab ([#4459](https://github.com/camunda/camunda-modeler/pull/4459))
* `FEAT`: support maintenance of Camunda 8 `Version tag` ([#4462](https://github.com/camunda/camunda-modeler/issues/4462), [#4461](https://github.com/camunda/camunda-modeler/issues/4461), [#4460](https://github.com/camunda/camunda-modeler/issues/4460), [#4453](https://github.com/camunda/camunda-modeler/issues/4453), [#4480](https://github.com/camunda/camunda-modeler/issues/4480))
* `FEAT`: support maintenance of Camunda 8 user task `Priority` ([bpmn-io/bpmn-js-properties-panel#1072](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/1072))
* `FEAT`: do not apply `*length` and `pattern` validation to FEEL expressions ([bpmn-io/bpmn-js-element-templates#115](https://github.com/bpmn-io/bpmn-js-element-templates/pull/115))
* `FIX`: rename task definition type label ([bpmn-io/bpmn-js-properties-panel#1070](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/1070))
* `FIX`: allow to add annotation to pool via new context pad ([#4451](https://github.com/camunda/camunda-modeler/issues/4451))

### DMN

* `FEAT`: support maintenance of Camunda 8 `Version tag` ([#4463](https://github.com/camunda/camunda-modeler/issues/4454))
* `FEAT`: support keyboard navigation in decision table context menu ([bpmn-io/dmn-js#848](https://github.com/bpmn-io/dmn-js/issues/848))
* `FIX`: provide business knowledge model and input data names in variable suggestions ([camunda/camunda-dmn-js#117](https://github.com/camunda/camunda-dmn-js/issues/117))
* `FIX`: prevent flashing edit button when adding new decision table column ([#4388](https://github.com/camunda/camunda-modeler/issues/4388))

### Forms

* `FEAT`: support maintenance of Camunda 8 `Version tag` ([#4463](https://github.com/camunda/camunda-modeler/issues/4463))

## 5.26.0

### General

* `FEAT`: make text area auto resize by default ([#3660](https://github.com/camunda/camunda-modeler/issues/3660))
* `CHORE`: remove outdated Camunda 8 platform versions ([#4396](https://github.com/camunda/camunda-modeler/issues/4396))
* `DEPS`: update to `@bpmn-io/properties-panel@3.23.0`
* `DEPS`: update to `@camunda/linting@3.24.0`
* `DEPS`: update to `bpmn-js@17.9.1`
* `DEPS`: update to `bpmn-js-create-append-anything@0.5.2`
* `DEPS`: update to `bpmn-js-element-templates@2.1.0`
* `DEPS`: update to `bpmn-js-properties-panel@5.21.0`
* `DEPS`: update to `camunda-bpmn-js@4.17.0`
* `DEPS`: update to `camunda-dmn-js@2.7.0`
* `DEPS`: update to `diagram-js@14.8.0`
* `DEPS`: update to `dmn-js@16.6.1`
* `DEPS`: update to `dmn-js-properties-panel@3.4.1`
* `DEPS`: update to `zeebe-bpmn-moddle@1.4.0`

### BPMN

* `FEAT`: support `bindingType` for business rule task, call activity, and user task ([#4385](https://github.com/camunda/camunda-modeler/issues/4385), [#4386](https://github.com/camunda/camunda-modeler/issues/4386))
* `FEAT`: support converging inclusive gateway ([#3613](https://github.com/camunda/camunda-modeler/issues/3613))
* `FEAT`: change Header value and Field Injection value to text areas ([bpmn-io/bpmn-js-properties-panel#1065](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/1065))
* `FEAT`: support Zeebe execution listeners ([#3951](https://github.com/camunda/camunda-modeler/issues/3951))
* `FIX`: safely remove message when changing template ([#4357](https://github.com/camunda/camunda-modeler/issues/4357))
* `FIX`: remove existing event definition when applying template ([#4357](https://github.com/camunda/camunda-modeler/issues/4357))
* `FIX`: improve performance of deselecting multiple elements ([#4335](https://github.com/camunda/camunda-modeler/issues/4335))
* `FIX`: show delete action for labels ([bpmn-io/bpmn-js#2163](https://github.com/bpmn-io/bpmn-js/issues/2163))
* `FIX`: remove incorrect attribute in replace menu ([#4383](https://github.com/camunda/camunda-modeler/issues/4383))
* `FIX`: add accessible label to drill down button ([#4394](https://github.com/camunda/camunda-modeler/issues/4394))
* `FIX`: improve `no-loop` performance ([camunda/bpmnlint-plugin-camunda-compat#165](https://github.com/camunda/bpmnlint-plugin-camunda-compat/pull/165))
* `FIX`: improve behavior of text areas with `autoResize` property ([#4419](https://github.com/camunda/camunda-modeler/issues/4419))

### DMN

* `FEAT`: add `Modeling#updateModdleProperties` ([bpmn-io/dmn-js#886](https://github.com/bpmn-io/dmn-js/pull/886))
* `FIX`: make it work in web components ([bpmn-io/dmn-js#631](https://github.com/bpmn-io/dmn-js/issues/631))
* `FIX`: remove incorrect attribute in replace menu ([#4383](https://github.com/camunda/camunda-modeler/issues/4383))
* `FIX`: make name field a text area ([bpmn-io/dmn-js-properties-panel#94](https://github.com/bpmn-io/dmn-js-properties-panel/issues/94))

## 5.25.0

### General

* `CHORE`: add accessible names to the XML/JSON editors ([#4370](https://github.com/camunda/camunda-modeler/issues/4370))
* `CHORE`: set window title via HTML ([#4376](https://github.com/camunda/camunda-modeler/issues/4376))
* `CHORE`: add accessible names to all inputs ([#4367](https://github.com/camunda/camunda-modeler/issues/4367))
* `CHORE`: make privacy policy link sufficiently distinguishable ([#4369](https://github.com/camunda/camunda-modeler/issues/4369))
* `DEPS`: update to `@bpmn-io/form-js@1.9.0`
* `DEPS`: update to `@bpmn-io/properties-panel@3.22.0`
* `DEPS`: update to `@camunda/form-playground@0.15.0`
* `DEPS`: update to `@camunda/improved-canvas@1.7.1`
* `DEPS`: update to `@camunda/linting@3.21.1`
* `DEPS`: update to `bpmn-js@17.8.2`
* `DEPS`: update to `camunda-bpmn-js@4.12.0`
* `DEPS`: update to `camunda-dmn-js@2.6.0`
* `DEPS`: update to `dmn-js-properties-panel@3.4.0`
* `DEPS`: update to `bpmn-js-properties-panel@5.18.0`
* `DEPS`: update to `dmn-js-shared@16.5.0`
* `DEPS`: update to `electron@31.0.1`

### BPMN

* `FIX`: do not render properties panel entry with outdated component ([#4382](https://github.com/camunda/camunda-modeler/issues/4382), [bpmn-io/properties-panel#369](https://github.com/bpmn-io/properties-panel/pull/369))
* `FIX`: do not show boundary event menu for compensation activities ([#4348](https://github.com/camunda/camunda-modeler/issues/4348))
* `FIX`: allow deployment after initial save was cancelled ([#3450](https://github.com/camunda/camunda-modeler/issues/3450))
* `FIX`: do not suggest root elements in search ([bpmn-js#2143](https://github.com/bpmn-io/bpmn-js/issues/2143))
* `CHORE`: make problem panel entries keyboard-focusable ([#4368](https://github.com/camunda/camunda-modeler/issues/4368))
* `CHORE`: align template documentation link style ([#4245](https://github.com/camunda/camunda-modeler/issues/4245))

### DMN

* `FEAT`: add edit input/output button ([bpmn-io/dmn-js#845](https://github.com/bpmn-io/dmn-js/issues/845))
* `FIX`: keep missing ID error ([bpmn-io/dmn-js-properties-panel#85](https://github.com/bpmn-io/dmn-js-properties-panel/issues/85))

### Forms

* `FEAT`: show link to field documentation in the properties panel  ([bpmn-io/form-js#1201](https://github.com/bpmn-io/form-js/pull/1201))
* `FIX`: button labels properly evaluate expressions ([bpmn-io/form-js#1181](https://github.com/bpmn-io/form-js/issues/1181))
* `FIX`: ensure group paths are properly registered on add ([bpmn-io/form-js#1173](https://github.com/bpmn-io/form-js/issues/1173))

## 5.24.0

### General

* `FIX`: prevent crash on start ([#4299](https://github.com/camunda/camunda-modeler/issues/4299))
* `DEPS`: update to `electron@30.0.9`
* `DEPS`: update to `@camunda/linting@3.21.0`
* `DEPS`: update to `bpmn-js@17.8.1`
* `DEPS`: update to `bpmn-js-element-templates@1.16.0`
* `DEPS`: update to `bpmn-js-properties-panel@5.17.1`
* `DEPS`: update to `@bpmn-io/properties-panel@3.20.0`
* `DEPS`: update to `camunda-bpmn-js@4.10.0`
* `DEPS`: update to `diagram-js@14.7.1`
* `DEPS`: update to `camunda-dmn-js@2.4.0`
* `DEPS`: update to `dmn-js@16.4.0`
* `DEPS`: update to `@bpmn-io/form-js@1.8.7`

### BPMN

* `FEAT`: support placeholders on String and Text properties ([bpmn-io/bpmn-js-element-templates#92](https://github.com/bpmn-io/bpmn-js-element-templates/issues/92))
* `FEAT`: warn about missing bpmnDi ([#4277](https://github.com/camunda/camunda-modeler/issues/4277))
* `FEAT`: add hint for the process ID field in Camunda 7 ([bpmn-io/bpmn-js-properties-panel#1038](https://github.com/bpmn-io/bpmn-js-properties-panel/issues/1038))
* `FEAT`: drop alphabetic sorting of list entries in Camunda 7 properties panel ([bpmn-io/bpmn-js-properties-panel#1047](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/1047))
* `FEAT`: scroll to focused element in properties panel ([bpmn-io/properties-panel#360](https://github.com/bpmn-io/properties-panel/pull/360))
* `FEAT`: keep global elements when deleting last participant ([bpmn-io/bpmn-js#2175](https://github.com/bpmn-io/bpmn-js/pull/2175))
* `FEAT`: show supported Camunda version in properties panel ([@camunda/linting#102](https://github.com/camunda/linting/issues/102))
* `FIX`: correct call activity outline ([bpmn-io/bpmn-js#2167](https://github.com/bpmn-io/bpmn-js/issues/2167))
* `FIX`: gracefully handle missing `BPMNDiagram#plane` ([bpmn-io/bpmn-js#2172](https://github.com/bpmn-io/bpmn-js/pull/2172), [bpmn-io/bpmn-js#2171](https://github.com/bpmn-io/bpmn-js/pull/2171), [#4315](https://github.com/camunda/camunda-modeler/issues/4315))
* `FIX`: allow undo after deleting last participants and data store ([bpmn-io/bpmn-js#1676](https://github.com/bpmn-io/bpmn-js/issues/1676))
* `FIX`: gracefully handle missing process DI in drilldown ([bpmn-io/bpmn-js#2180](https://github.com/bpmn-io/bpmn-js/pull/2180))
* `FIX`: correct duplicate `Process Name` in Camunda 7 properties panel ([bpmn-io/bpmn-js-properties-panel#1055](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/1055), [#4317](https://github.com/camunda/camunda-modeler/issues/4317))
* `FIX`: be able to color element markers via CSS ([#4307](https://github.com/camunda/camunda-modeler/issues/4307))

### DMN

* `FEAT`: autocomplete BKMs as snippets ([bpmn-io/dmn-js#785](https://github.com/bpmn-io/dmn-js/issues/785), [#bpmn-io/dmn-js827](https://github.com/bpmn-io/dmn-js/issues/827))
* `FEAT`: make inputs commit on blur, and let browser handle undo/redo ([bpmn-io/dmn-js#859](https://github.com/bpmn-io/dmn-js/issues/859))
* `FIX`: show FEEL expressions with line wrapping ([#4098](https://github.com/camunda/camunda-modeler/issues/4098), [bpmn-io/dmn-js#838](https://github.com/bpmn-io/dmn-js/issues/838))

## 5.23.0

### General

* `FEAT`: build for arm64 on MacOS ([#4238](https://github.com/camunda/camunda-modeler/pull/4238))
* `FEAT`: add basic auth for deployments to C8 self-managed ([#4269](https://github.com/camunda/camunda-modeler/pull/4269))
* `DEPS`: update to `@bpmn-io/form-js@1.8.6`
* `DEPS`: update to `@camunda/linting@3.19.0`
* `DEPS`: update to `bpmn-js-element-templates@1.15.3`
* `DEPS`: update to `bpmn-js-tracking@0.6.0`
* `DEPS`: update to `camunda-bpmn-js@4.6.3`
* `DEPS`: update to `camunda-dmn-js@2.3.3`
* `DEPS`: update to `dmn-js@16.3.2`
* `DEPS`: update to `electron@30` ([#4246](https://github.com/camunda/camunda-modeler/pull/4246))

### BPMN

* `FEAT`: remove background for embedded labels ([bpmn-io/bpmn-js#2147](https://github.com/bpmn-io/bpmn-js/pull/2147))
* `FEAT`: add tooltip for `Called decision` group ([bpmn-io/bpmn-js-properties-panel#1039](https://github.com/bpmn-io/bpmn-js-properties-panel/issues/1039))
* `FEAT`: make popup menu fully keyboard navigatable ([bpmn-io/diagram-js#871](https://github.com/bpmn-io/diagram-js/issues/871))
* `FEAT`: do not scale context pad and popup menu by default ([bpmn-io/diagram-js#883](https://github.com/bpmn-io/diagram-js/pull/883))
* `FEAT`: context pad position absolute instead of relative to element ([bpmn-io/diagram-js#888](https://github.com/bpmn-io/diagram-js/pull/888))
* `FIX`: prevent infinite loop when applying conditional template ([bpmn-io/bpmn-js-element-templates#78](https://github.com/bpmn-io/bpmn-js-element-templates/issues/78))
* `FIX`: preserve valid user input when changing element template ([bpmn-io/bpmn-js-element-templates#86](https://github.com/bpmn-io/bpmn-js-element-templates/pull/86), [#4249](https://github.com/camunda/camunda-modeler/issues/4249))
* `FIX`: mark non-object JSON as invalid example data ([example-data-properties-provider#17](https://github.com/camunda/example-data-properties-provider/pull/17))
* `FIX`: select participant when process ref lint error is selected ([camunda/linting#104](https://github.com/camunda/linting/pull/104))
* `FIX`: correctly apply condition depending on boolean on initial load ([bpmn-io/bpmn-js-element-templates#74](https://github.com/bpmn-io/bpmn-js-element-templates/issues/94))

### DMN

* `FEAT`: context pad position absolute instead of relative to element ([bpmn-io/diagram-js#888](https://github.com/bpmn-io/diagram-js/pull/888))
* `FEAT`: do not scale context pad and popup menu by default ([bpmn-io/diagram-js#883](https://github.com/bpmn-io/diagram-js/pull/883))
* `FEAT`: add support for implementing BKM as literal expression ([bpmn-io/dmn-js#704](https://github.com/bpmn-io/dmn-js/issues/704), [bpmn-io/dmn-js#826](https://github.com/bpmn-io/dmn-js/issues/826))
* `FEAT`: remove background for DRGElements ([bpmn-io/dmn-js#855](https://github.com/bpmn-io/dmn-js/pull/855))
* `FEAT`: allow to provide accessible names to form fields ([bpmn-io/dmn-js#843](https://github.com/bpmn-io/dmn-js/pull/843))
* `FIX`: add accessible names to multiple components ([bpmn-io/dmn-js#843](https://github.com/bpmn-io/dmn-js/pull/843))
* `FIX`: improve contrast
* `FIX`: make table cells visible to screen readers ([bpmn-io/dmn-js#821](https://github.com/bpmn-io/dmn-js/issue/821))

### Forms

* `FIX`: prevent expressions from recomputing more than once ([bpmn-io/form-js#1154](https://github.com/bpmn-io/form-js/pull/1154))

## 5.22.0

### General

* `FIX`: disable shortcuts when template selection modal is open ([#3483](https://github.com/camunda/camunda-modeler/issues/3483))
* `DEPS`: update to `camunda-bpmn-js@4.5.0`
* `DEPS`: update to `camunda-dmn-js@2.1.0`
* `DEPS`: update to `@camunda/linting@3.18.0`
* `DEPS`: update to `bpmn-js-properties-panel@5.14.0`
* `DEPS`: update to `@bpmn-io/form-js@1.8.3`
* `DEPS`: update to `@camunda/form-linting@0.16.0`
* `DEPS`: update to `@camunda/form-playground@0.14.0`

### BPMN

* `FEAT`: support compensation events in C8 ([#3945](https://github.com/camunda/camunda-modeler/issues/3945))
* `FEAT`: improve form related tooltips ([#4183](https://github.com/camunda/camunda-modeler/issues/4183))
* `FIX`: prevent Maximum call stack size exceeded in variable resolver ([#4139](https://github.com/camunda/camunda-modeler/issues/4139), [@bpmn-io/variable-resolver#30](https://github.com/bpmn-io/variable-resolver/pull/30))

### Forms

* `FEAT`: implemented new `expression` field, allowing precomputation of data at runtime using FEEL ([bpmn-io/form-js#1073](https://github.com/bpmn-io/form-js/issues/1073))
* `FEAT`: overhaul the JSON editor components ([bpmn-io/form-js#1101](https://github.com/bpmn-io/form-js/issues/1101))
* `FIX`: improved the editor selection autoscroll ([bpmn-io/form-js#1106](https://github.com/bpmn-io/form-js/issues/1106))
* `FIX`: display groups with no outline with a dashed outline in the editor ([bpmn-io/form-js#1084](https://github.com/bpmn-io/form-js/issues/1084))
* `FIX`: variables with keyword names like `duration` can now be used in feel expression ([bpmn-io/form-js#975](https://github.com/bpmn-io/form-js/issues/975))
* `FIX`: ensure dynamic list and tables interact safely ([bpmn-io/form-js#1064](https://github.com/bpmn-io/form-js/issues/1064))
* `FIX`: prevent crash when illegal key and path is used ([#4217](https://github.com/camunda/camunda-modeler/issues/4217), [#4218](https://github.com/camunda/camunda-modeler/issues/4218))
* `FIX`: make the output panel readonly ([#4216](https://github.com/camunda/camunda-modeler/issues/4216))

## 5.21.0

### General

* `FEAT`: add Camunda 8.5 as engine profile
* `DEPS`: update to `@bpmn-io/dmn-migrate@0.5.0`
* `DEPS`: update to `@bpmn-io/form-js@1.7.2`
* `DEPS`: update to `@camunda/linting@3.17.0`
* `DEPS`: update to `bpmn-js@17.0.2`
* `DEPS`: update to `bpmn-js-element-templates@1.14.1`
* `DEPS`: update to `bpmn-js-properties-panel@5.13.0`
* `DEPS`: update to `bpmnlint-plugin-camunda-compat@2.16.0`
* `DEPS`: update to `camunda-bpmn-js@4.3.1`
* `DEPS`: update to `diagram-js@14.1.0`
* `DEPS`: update to `electron@29.0.0`

### BPMN

* `FEAT`: support Zeebe user task ([#4087](https://github.com/camunda/camunda-modeler/issues/4087))
* `FEAT`: improve `retries` tooltip ([#4148](https://github.com/camunda/camunda-modeler/issues/4148))
* `FEAT`: always display `documentation` field in Camunda 7 diagrams ([bpmn-io/bpmn-js-element-templates#67](https://github.com/bpmn-io/bpmn-js-element-templates/pull/67), [#4037](https://github.com/camunda/camunda-modeler/issues/4037))
* `FEAT`: always display `multi-instance` group in Camunda 7 diagrams ([bpmn-io/bpmn-js-element-templates#68](https://github.com/bpmn-io/bpmn-js-element-templates/pull/68))
* `FEAT`: allow `Boolean` and `Number` types in Camunda 8 diagrams ([bpmn-io/bpmn-js-element-templates#64](https://github.com/bpmn-io/bpmn-js-element-templates/pull/64), [#3622](https://github.com/camunda/camunda-modeler/issues/3622))
* `FEAT`: improve `camunda:historyTimeToLive` error reporting ([#4062](https://github.com/camunda/camunda-modeler/issues/4062))
* `FEAT`: do not provide `camunda:historyTimeToLive` default value ([#4150](https://github.com/camunda/camunda-modeler/pull/4150))
* `FEAT`: improve `camunda:historyTimeToLive` tooltip
* `FIX`: hide output mappings unsupported for terminate end event ([#4096](https://github.com/camunda/camunda-modeler/issues/4096))
* `FIX`: apply all chained conditional properties ([bpmn-js-element-templates#49](https://github.com/bpmn-io/bpmn-js-element-templates/issues/49))
* `FIX`: adjust FEEL parsing to accept certain broken expressions ([camunda-modeler#4073](https://github.com/camunda/camunda-modeler/issues/4073))

### DMN

* `FEAT`: improve `camunda:historyTimeToLive` tooltip

### Linting

* `FEAT`: make `history-time-to-live` an informative hint ([camunda/bpmnlint-plugin-camunda-compat#160](https://github.com/camunda/bpmnlint-plugin-camunda-compat/pull/160))
* `FEAT`: report missing form definition as warning, not error ([camunda/bpmnlint-plugin-camunda-compat#154](https://github.com/camunda/bpmnlint-plugin-camunda-compat/issues/154), [camunda/bpmnlint-plugin-camunda-compat#157](https://github.com/camunda/bpmnlint-plugin-camunda-compat/pull/157))
* `FIX`: correct `escalation-reference` to allow start event without `escalationRef` ([camunda/bpmnlint-plugin-camunda-compat#158](https://github.com/camunda/bpmnlint-plugin-camunda-compat/pull/158))

### Forms

* `FIX`: correct HTML field documentation link ([#4118](https://github.com/camunda/camunda-modeler/issues/4118))

## 5.20.0

### General

* `FEAT`: allow users to re-open recently used files ([#3917](https://github.com/camunda/camunda-modeler/issues/3917))
* `FEAT`: confirm on unsaved files before reload ([#3886](https://github.com/camunda/camunda-modeler/issues/3886), [#3240](https://github.com/camunda/camunda-modeler/issues/3240))
* `FEAT`: rework report feedback widget ([#4086](https://github.com/camunda/camunda-modeler/issues/4086))
* `FEAT`: improve resizer and popup editor toggle interaction ([#3895](https://github.com/camunda/camunda-modeler/issues/3895))
* `FIX`: correct user forum link ([#4085](https://github.com/camunda/camunda-modeler/issues/4085))
* `CHORE`: track popup editor usage ([#4004](https://github.com/camunda/camunda-modeler/issues/4004))
* `DEPS`: update to `@bpmn-io/form-js@1.7.0`
* `DEPS`: update to `@camunda/form-linting@0.15.0`
* `DEPS`: update to `@camunda/form-playground@0.13.0`
* `DEPS`: update to `bpmn-js@16.4.0`
* `DEPS`: update to `bpmn-js-properties-panel@5.11.1`
* `DEPS`: update to `@bpmn-io/properties-panel@3.18.1`
* `DEPS`: update to `camunda-bpmn-js-behaviors@1.2.3`
* `DEPS`: update to `bpmn-js-element-templates@1.13.1`

### BPMN

* `FEAT`: allow text annotations to overlap with the borders of subprocesses and pools ([bpmn-io/bpmn-js#2049](https://github.com/bpmn-io/bpmn-js/issues/2049), [#4035](https://github.com/camunda/camunda-modeler/issues/4035))
* `FEAT`: improve Camunda 7 variable events tooltip ([#1016](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/1016))
* `FEAT`: make FEEL error more forgiving ([#3991](https://github.com/camunda/camunda-modeler/issues/3991))
* `FEAT`: display element template icon found in XML ([bpmn-io/bpmn-js-properties-panel#1011](https://github.com/bpmn-io/bpmn-js-properties-panel/issues/1011))
* `FEAT`: align zeebe input propagation label and tooltip ([bpmn-io/bpmn-js-properties-panel@`5d8bd68`](https://github.com/bpmn-io/bpmn-js-properties-panel/commit/5d8bd6846efcbbc7c67322df5a6c6fe28d63fb9b), [#4051](https://github.com/camunda/camunda-modeler/issues/4051))
* `FEAT`: allow tooltip re-usability ([bpmn-io/properties-panel#321](https://github.com/bpmn-io/properties-panel/pull/321))
* `FEAT`: word wrap FEEL expressions, textarea style ([bpmn-io/properties-panel#319](https://github.com/bpmn-io/properties-panel/pull/319))
* `FEAT`: always show documentation field ([bpmn-io/bpmn-js-element-templates#50](https://github.com/bpmn-io/bpmn-js-element-templates/pull/50), [#4037](https://github.com/camunda/camunda-modeler/issues/4037))
* `FEAT`: validate Camunda 7 text area and select ([bpmn-io/bpmn-js-element-templates#55](https://github.com/bpmn-io/bpmn-js-element-templates/issues/55))
* `FEAT`: ensure Camunda 8 user tasks have a form definition ([camunda/bpmnlint-plugin-camunda-compat#151](https://github.com/camunda/bpmnlint-plugin-camunda-compat/pull/151))
* `FIX`: support core replace in compensation behavior ([bpmn-io/bpmn-js#2073](https://github.com/bpmn-io/bpmn-js/issues/2073), [#4070](https://github.com/camunda/camunda-modeler/issues/4070))
* `FIX`: attach popup editor toggle to the top ([bpmn-io/bpmn-js-properties-panel@`e6681f7`](https://github.com/bpmn-io/properties-panel/commit/e6681f74ad6268c8f533a721351bdeea376dac26))
* `FIX`: close popup editor when properties panel gets detached ([bpmn-io/bpmn-js-properties-panel@`7defc52`](https://github.com/bpmn-io/properties-panel/commit/7defc525400c62f253651cda589fe2f5058518a6))
* `FIX`: close popup editor when source component gets unmounted ([bpmn-io/bpmn-js-properties-panel@`1fa3330`](https://github.com/bpmn-io/properties-panel/commit/1fa3330ebdcbc7c0ac405a49eb510817fc3aa71c))
* `FIX`: correct re-validation of entries when validator changes ([bpmn-io/bpmn-js-properties-panel@`e93e986`](https://github.com/bpmn-io/properties-panel/commit/e93e986573d32adc361c64a1bc53cf1e38454715), [#3070](https://github.com/camunda/camunda-modeler/issues/3070))
* `FIX`: drop unnecessary variable propagation behavior ([camunda/camunda-bpmn-js-behaviors#57](https://github.com/camunda/camunda-bpmn-js-behaviors/pull/57))
* `FIX`: prevent infinite loop when suggesting variables ([bpmn-io/variable-resolver#23](https://github.com/bpmn-io/variable-resolver/pull/23))
* `FIX`: show scrollbars in popup editor ([bpmn-io/properties-panel#319](https://github.com/bpmn-io/properties-panel/pull/319))

### Forms

* `FEAT`: implement HTML component and cleanup Text component ([bpmn-io/form-js#999](https://github.com/bpmn-io/form-js/pull/999))
* `FIX`: resize textarea on input changes ([bpmn-io/form-js#1011](https://github.com/bpmn-io/form-js/issues/1011))
* `FIX`: prevent demo data from being created on edited tables ([bpmn-io/form-js#1005](https://github.com/bpmn-io/form-js/pull/1005))

## 5.19.0

### General

* `FEAT`: mark Camunda 8.4 as `latest`
* `DEPS`: update to `@bpmn-io/form-js@1.6.1`
* `DEPS`: update to `@camunda/form-linting@0.14.0`
* `DEPS`: update to `@camunda/form-playground@0.12.0`
* `DEPS`: update to `camunda-bpmn-js@3.12.1`
* `DEPS`: update to `bpmn-js@16.3.1`
* `DEPS`: update to `diagram-js@13.3.0`
* `DEPS`: update to `bpmn-js-properties-panel@5.7.0`
* `DEPS`: update to `bpmn-js-element-templates@1.10.0`
* `DEPS`: update to `camunda-dmn-js@1.7.0`
* `DEPS`: update to `dmn-js@15.0.0`
* `DEPS`: update to `electron@28.0.0` ([#4007](https://github.com/camunda/camunda-modeler/pull/4007))

### BPMN

* `FEAT`: simplify compensation modeling ([bpmn-io/bpmn-js#2038](https://github.com/bpmn-io/bpmn-js/issues/2038))
* `FEAT`: render vertical pools and lanes ([#2024](https://github.com/bpmn-io/bpmn-js/pull/2024))
* `FEAT`: sentence case titles and labels ([#2023](https://github.com/bpmn-io/bpmn-js/issues/2023))
* `FEAT`: allow non-searchable entries in popup menu ([#835](https://github.com/bpmn-io/diagram-js/pull/835))
* `FEAT`: be able to template `zeebe:calledElement` ([bpmn-io/bpmn-js-element-templates#37](https://github.com/bpmn-io/bpmn-js-element-templates/pull/37))
* `FEAT`: allow collapsed subprocess in 8.4 ([#4020](https://github.com/camunda/camunda-modeler/issues/4020))
* `FEAT`: capitalize `Camunda Form` ([bpmn-io/bpmn-js-properties-panel#1005](https://github.com/bpmn-io/bpmn-js-properties-panel/issues/1005))
* `FEAT`: improve FEEL popup editor icon ([bpmn-io/properties-panel#310](https://github.com/bpmn-io/properties-panel/issues/310))
* `FEAT`: add contextual keyword completion in FEEL editor
* `FIX`: correct parsing of nested lists in FEEL editor
* `FIX`: correct parsing of incomplete `QuantifiedExpression` in FEEL editor
* `FIX`: only allow legal `Name` start characters in FEEL editor

## DMN

* `FEAT`: make drilldown buttons navigable via keyboard ([bpmn-io/dmn-js#778](https://github.com/bpmn-io/dmn-js/issues/778))

## Forms

* `FEAT`: add dynamic list component ([bpmn-io/form-js#796](https://github.com/bpmn-io/form-js/issues/796))
* `FEAT`: add table component ([bpmn-io/form-js#888](https://github.com/bpmn-io/form-js/issues/888))

## 5.18.0

### General

* `FEAT`: add plugin point for bottom panels ([#3998](https://github.com/camunda/camunda-modeler/pull/3998))
* `FIX`: integrate DRD find ([#3977](https://github.com/camunda/camunda-modeler/pull/3977))
* `FIX`: pull `tenantId` from correct place ([#4022](https://github.com/camunda/camunda-modeler/pull/4022))
* `CHORE`: always show linting documentation link if available ([#3992](https://github.com/camunda/camunda-modeler/pull/3992))
* `DEPS`: update to `camunda-bpmn-js@3.10.2`
* `DEPS`: update to `bpmn-js-element-templates@1.9.2`
* `DEPS`: update to `bpmn-js@15.2.1`
* `DEPS`: update to `diagram-js@12.8.1`
* `DEPS`: update to `dmn-js@14.7.1`
* `DEPS`: update to `dmn-js-properties-panel@3.2.1`
* `DEPS`: update to `@bpmn-io/form-js@1.5.0`
* `DEPS`: update to `@camunda/form-linting@0.13.0`
* `DEPS`: update to `@camunda/form-playground@0.11.0`

### BPMN

* `FEAT`: remove selection outline from connections ([diagram-js#826](https://github.com/bpmn-io/diagram-js/pull/826))
* `FEAT`: position context pad according to last waypoint for connections ([diagram-js#826](https://github.com/bpmn-io/diagram-js/pull/826))
* `FEAT`: support `isActive` condition ([bpmn-js-element-templates#19](https://github.com/bpmn-io/bpmn-js-element-templates/issues/19))
* `FEAT`: add conditional `correlationKey` rendering ([bpmn-js-element-templates#19](https://github.com/bpmn-io/bpmn-js-element-templates/issues/19))
* `FEAT`: support receive and send task message templating ([bpmn-io/bpmn-js-element-templates#30](https://github.com/bpmn-io/bpmn-js-element-templates/pull/30))
* `FIX`: prevent access of non-existing connection bounds ([diagram-js#824](https://github.com/bpmn-io/diagram-js/pull/824))
* `FIX`: disallow subscription binding for `bpmn:SendTask`
* `FIX`: correct selection outline size for end event ([bpmn-js#2026](https://github.com/bpmn-io/bpmn-js/pull/2026))
* `FIX`: remove unneeded `camunda-cloud` rules ([camunda-bpmn-js#325](https://github.com/camunda/camunda-bpmn-js/pull/325))
* `FIX`: remove unused `typescript` prod dependency ([camunda-bpmn-js#326](https://github.com/camunda/camunda-bpmn-js/pull/326))
* `FIX`: keep custom value on element templates update when the condition was changed ([bpmn-js-element-templates#32](https://github.com/bpmn-io/bpmn-js-element-templates/issues/32))

## DMN

* `FEAT`: remove selection outline from connections ([diagram-js#826](https://github.com/bpmn-io/diagram-js/pull/826))
* `FEAT`: position context pad according to last waypoint for connections ([diagram-js#826](https://github.com/bpmn-io/diagram-js/pull/826))
* `FEAT`: provide element ID in variable suggestions ([camunda-dmn-js#83](https://github.com/camunda/camunda-dmn-js/issues/83))
* `FEAT`: support documentation fields ([dmn-js-properties-panel#62](https://github.com/bpmn-io/dmn-js-properties-panel/issues/62))
* `FIX`: prevent access of non-existing connection bounds ([diagram-js#824](https://github.com/bpmn-io/diagram-js/pull/824))

## Forms

* `FEAT`: support `iFrame` component ([form-js#887](https://github.com/bpmn-io/form-js/issues/887))
* `FIX`: properly close dropdowns when opening other dropdowns ([form-js#878](https://github.com/bpmn-io/form-js/issues/878))
* `FIX`: improved input data sanitation ([form-js#894](https://github.com/bpmn-io/form-js/issues/894))
* `FIX`: ensure values not in options clear ([form-js#817](https://github.com/bpmn-io/form-js/issues/817))
* `FIX`: fixed an issue dragging rows into groups ([form-js#861](https://github.com/bpmn-io/form-js/issues/861))
* `FIX`: adjusted palette size ([form-js#846](https://github.com/bpmn-io/form-js/issues/846))
* `FIX`: renamed checklist and radio ([form-js#846](https://github.com/bpmn-io/form-js/issues/846))
* `FIX`: add `tabIndex` to json editors ([ad6c00fb](https://github.com/bpmn-io/form-js/commit/ad6c00fb581943d4fb278f7dbcda02d5c544dfca))

## 5.17.0

### General

* `FEAT`: Add Camunda 8.4 and 7.21 as engine profiles ([#3921](https://github.com/camunda/camunda-modeler/issues/3921))
* `FEAT`: support multi-tenancy when deploying or running a process ([#3716](https://github.com/camunda/camunda-modeler/issues/3716))
* `FEAT`: add FEEL popup menu ([#3877](https://github.com/camunda/camunda-modeler/issues/3877))
* `DEPS`: update to `camunda-dmn-js@1.5.0`
* `DEPS`: update to `camunda-dmn-moddle@1.3.0`
* `DEPS`: update to `diagram-js@12.7.3`
* `DEPS`: update to `dmn-js@14.7.0`
* `DEPS`: update to `bpmn-js@15.1.3`
* `DEPS`: update to `bpmn-js-element-templates@1.7.0`
* `DEPS`: update to `bpmn-js-properties-panel@5.6.1`
* `DEPS`: update to `camunda-bpmn-js@3.8.0`
* `DEPS`: update to `@bpmn-io/form-js@1.4.1`
* `DEPS`: update to `@camunda/form-linting@0.12.0`
* `DEPS`: update to `@camunda/form-playground@0.10.1`
* `DEPS`: update to `electron@27.0.3`

### BPMN

* `FEAT`: add toggle for non-interrupting events ([bpmn-io/bpmn-js#2000](https://github.com/bpmn-io/bpmn-js/pull/2000))
* `FEAT`: keep events non-interrupting when using `bpmnReplace` by default ([bpmn-io/bpmn-js#2000](https://github.com/bpmn-io/bpmn-js/pull/2000))
* `FEAT`: preview append on hover ([bpmn-io/bpmn-js#1985](https://github.com/bpmn-io/bpmn-js/pull/1985))
* `FEAT`: align selection outline with element's shape ([bpmn-io/bpmn-io/bpmn-js#1996](https://github.com/bpmn-io/bpmn-js/pull/1985))
* `FEAT`: make space tool local per default ([bpmn-io/diagram-js#811](https://github.com/bpmn-io/diagram-js/pull/811), [bpmn-io/bpmn-js#1975](https://github.com/bpmn-io/bpmn-js/issues/1975))
* `FEAT`: support Camunda 8 form reference ([bpmn-io/bpmn-js-properties-panel#978](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/978), [bpmn-io/bpmn-js-properties-panel#949](https://github.com/bpmn-io/bpmn-js-properties-panel/issues/949))
* `FEAT`: add link to learning resources from the FEEL popup editor ([@bpmn-io/properties-panel#308](https://github.com/bpmn-io/properties-panel/pull/308))
* `FEAT`: support `zeebe:taskDefinition` binding ([bpmn-io/bpmn-js-element-templates#29](https://github.com/bpmn-io/bpmn-js-element-templates/pull/29))
* `FIX`: display multi-instance configuration in properties panel ([#3396](https://github.com/camunda/camunda-modeler/issues/3396))

### DMN

* `FEAT`: use FEEL editor in literal expression editor ([bpmn-io/dmn-js#780](https://github.com/bpmn-io/dmn-js/issues/780))
* `FEAT`: implement variable suggestions ([bpmn-io/dmn-js#785](https://github.com/bpmn-io/dmn-js/issues/785))
* `FEAT`: adjust selection outline to shapes ([bpmn-io/dmn-js#799](https://github.com/bpmn-io/dmn-js/issues/799))
* `FEAT`: implement search in DRD ([bpmn-io/dmn-js#792](https://github.com/bpmn-io/dmn-js/pull/792))
* `FIX`: make literal expression box grow with content ([bpmn-io/dmn-js#789](https://github.com/bpmn-io/dmn-js/issues/789))
* `FIX`: add missing translations ([bpmn-io/dmn-js#793](https://github.com/bpmn-io/dmn-js/issues/793))

### Forms

* `FEAT`: support standalone Form deployment ([#3656](https://github.com/camunda/camunda-modeler/issues/3656))
* `FEAT`: support `separator` form field ([#480](https://github.com/bpmn-io/form-js/issues/480))
* `FEAT`: keyboard support for palette entries ([#536](https://github.com/bpmn-io/form-js/issues/536))
* `FEAT`: make it easier to navigate over tags in `taglist` component via keyboard ([#435](https://github.com/bpmn-io/form-js/issues/435))
* `FIX`: allow `0` as a valid minimum for number fields ([#3913](https://github.com/camunda/camunda-modeler/issues/3913))

## 5.16.0

### General

* `FEAT`: make OAuth URL in deploy dialog more explicit ([#3868](https://github.com/camunda/camunda-modeler/pull/3868))
* `FEAT`: drop missleading audience hint in deploy dialog ([#3864](https://github.com/camunda/camunda-modeler/issues/3864))
* `FEAT`: improve error messages shown in deploy dialog ([#3808](https://github.com/camunda/camunda-modeler/issues/3808), [#3873](https://github.com/camunda/camunda-modeler/pull/3873))
* `FEAT`: mark `8.3` as stable ([#3882](https://github.com/camunda/camunda-modeler/issues/3882))
* `DEPS`: update to `bpmn-js-properties-panel@5.8.0`
* `DEPS`: update to `camunda-bpmn-js@3.4.0`
* `DEPS`: update to `camunda-dmn-js@1.2.1`
* `DEPS`: update to `form-js@1.3.0`
* `DEPS`: update to `form-linting@0.11.0`
* `DEPS`: update to `form-playground@0.9.0`

### BPMN

* `FEAT`: support signal catch events for Camunda 8 ([#3819](https://github.com/camunda/camunda-modeler/issues/3819))
* `FEAT`: improve tooltip content ([bpmn-js-properties-panel#955](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/955))
* `FEAT`: warn on deprecated secrets format ([#3834](https://github.com/camunda/camunda-modeler/issues/3834))
* `FIX`: correct FEEL error switching ([#3845](https://github.com/camunda/camunda-modeler/issues/3845))
* `FIX`: correct dirty marker not updating ([#3815](https://github.com/camunda/camunda-modeler/issues/3815))
* `FIX`: correct HTTL incorrectly reported as error ([#3853](https://github.com/camunda/camunda-modeler/issues/3853))
*

### Forms

* `FEAT`: support group component ([bpmn-io/form-js#768](https://github.com/bpmn-io/form-js/pull/768))
* `FEAT`: support nested component keys ([bpmn-io/form-js#464](https://github.com/bpmn-io/form-js/issues/464))
* `FEAT`: add placeholder on empty form input panel ([bpmn-io/form-js#773](https://github.com/bpmn-io/form-js/pull/773))

### DMN

* `FEAT`: use FEEL editor in decision table cell editor ([bpmn-io/dmn-js#774](https://github.com/bpmn-io/dmn-js/issues/774))
* `FEAT`: use FEEL editor in decision table input expression ([bpmn-io/dmn-js#768](https://github.com/bpmn-io/dmn-js/issues/768))
* `FEAT`: render FEEL expressions in tables as `monospace` font
* `FIX`: increase decision table cell editor line height

## 5.15.2

* `DEPS`: fix `npm audit` warnings (includes a fix for [CVE-2023-4863](https://nvd.nist.gov/vuln/detail/CVE-2023-4863))

## 5.15.1

* `FIX`: fix element templates and plugins not found error on Windows ([#3863](https://github.com/camunda/camunda-modeler/pull/3863))

## 5.15.0

### General

* `DEPS` update to `@bpmn-io/properties-panel@3.4.0`
* `DEPS` update to `@camunda/linting@3.7.1`
* `DEPS` update to `bpmn-js-element-templates@1.4.0`
* `DEPS` update to `bpmn-js-properties-panel@5.1.0`
* `DEPS` update to `camunda-bpmn-js@3.3.0`

### BPMN

* `FEAT`: move _Call Activity_ to _Sub Processes_ group in options menu ([bpmn-js-create-append-anything#14](https://github.com/bpmn-io/bpmn-js-create-append-anything/pull/14))
* `FEAT`: add _Input propagation_ group ([#3793](https://github.com/camunda/camunda-modeler/issues/3793))
* `FEAT`: visually show deprecated templates in properties panel ([bpmn-js-element-templates#11](https://github.com/bpmn-io/bpmn-js-element-templates/issues/11))
* `FEAT`: suggest variables from form schema ([#3780](https://github.com/camunda/camunda-modeler/issues/3780))
* `FEAT`: do not hide overlays on canvas move per default ([bpmn-io/diagram-js#798](https://github.com/bpmn-io/diagram-js/issues/798))
* `FIX`: allow to create connection + event-based gateway ([bpmn-io/bpmn-js#1490](https://github.com/bpmn-io/bpmn-js/issues/1490))
* `FIX`: correct copy of default sequence flow elements ([bpmn-io/bpmn-js#1935](https://github.com/bpmn-io/bpmn-js/issues/1935))
* `FIX`: make breadcrumb styling more robust ([bpmn-io/bpmn-js#1945](https://github.com/bpmn-io/bpmn-js/pull/1945))
* `FIX`: remove _Outputs_ group from error end events ([#3782](https://github.com/camunda/camunda-modeler/issues/3782))
* `FIX`: show all FEEL errors in _Problems_ panel ([#3806](https://github.com/camunda/camunda-modeler/issues/3806))
* `CHORE`: example data is no longer scoped to the element that defines it ([#3728](https://github.com/camunda/camunda-modeler/issues/3728))

### Linting

* `FEAT`: add `no-loop` rule
* `FEAT`: add `no-propagate-all-parent-variables` rule
* `FEAT`: add `link-event` rule
* `FEAT`: add `start-form` rule ([#75](https://github.com/camunda/linting/pull/75))
* `FEAT`: add documentation links to problems ([#74](https://github.com/camunda/linting/pull/74))

## 5.14.0

### General

* `FEAT`: add flags for default execution platform version ([#3515](https://github.com/camunda/camunda-modeler/issues/3515))
* `DEPS`: update to `@bpmn-io/properties-panel@3.2.1`
* `DEPS`: update to `bpmn-js-properties-panel@4.0.2`
* `DEPS`: update to `dmn-js-properties-panel@3.0.0`
* `DEPS`: update to `camunda-bpmn-js@3.1.0`
* `DEPS`: update to `camunda-dmn-js@1.1.0`
* `DEPS`: update to `@camunda/linting@3.4.0`

### BPMN

* `FEAT`: migrate long descriptions and descriptions with documentation links to tooltips ([bpmn-js-properties-panel#946](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/946))
* `FEAT`: show element template errors in the errors panel ([#3357](https://github.com/camunda/camunda-modeler/issues/3357))
* `FEAT`: show errors in group header ([properties-panel#256](https://github.com/bpmn-io/properties-panel/pull/256))
* `FIX`: open properties panel when history time to live error is clicked ([#3712](https://github.com/camunda/camunda-modeler/issues/3712))
* `FIX`: detect and notify unsupported multiple start events in C8 ([#3577](https://github.com/camunda/camunda-modeler/issues/3577))
* `FIX`: allow removing templates from root elements ([bpmn-js-element-templates#7](https://github.com/bpmn-io/bpmn-js-element-templates/pull/7))
* `FIX`: reload element templates on save ([#3471](https://github.com/camunda/camunda-modeler/issues/3471))

### Forms

* `FEAT`: add `spacer` component ([form-js#731](https://github.com/bpmn-io/form-js/issues/731))
* `FEAT`: eagerly validate on blur and input ([form-js#610](https://github.com/bpmn-io/form-js/pull/610))
* `FEAT`: support FEEL and templates for prefix and suffix appearance ([form-js#663](https://github.com/bpmn-io/form-js/pull/663))
* `FEAT`: support templates for `alt` and `source` properties ([form-js#663](https://github.com/bpmn-io/form-js/pull/663))
* `FEAT`: support populate multiselect values via FEEL expression ([form-js#673](https://github.com/bpmn-io/form-js/issues/673))
* `FEAT`: support FEEL for `min`, `max`, `minLength` and `maxLength` validation ([form-js#668](https://github.com/bpmn-io/form-js/pull/668))
* `DEPS`: update to `form-js` to 1.1.0
* `DEPS`: update to `form-linting` to 0.10.0
* `DEPS`: update to `form-playground` to 0.8.0

## 5.13.0

### General

* `FEAT`: gracefully handle failing diagram validation rules ([#3637](https://github.com/camunda/camunda-modeler/issues/3637), [#3686](https://github.com/camunda/camunda-modeler/pull/3686))
* `FEAT`: gracefully handle post-import errors ([#3691](https://github.com/camunda/camunda-modeler/pull/3691))
* `FIX`: correct resize handle position ([#3665](https://github.com/camunda/camunda-modeler/issues/3665))
* `DEPS`: migrate from `electron-notarize` to `@electron/notarize` ([#3669](https://github.com/camunda/camunda-modeler/issues/3669))
* `DEPS`: update `sentry`

### BPMN

* `FEAT`: integrate Camunda Platform 7.20 linting rules ([@camunda/linting#59](https://github.com/camunda/linting/pull/59), [#3632](https://github.com/camunda/camunda-modeler/issues/3632))
* `FEAT`: track connector usage ([#3539](https://github.com/camunda/camunda-modeler/issues/3539))
* `FIX`: correctly tracking of palette/context pad usage ([#3711](https://github.com/camunda/camunda-modeler/pull/3711))
* `FIX`: correctly create diagram with process default templates ([#3687](https://github.com/camunda/camunda-modeler/issues/3687))
* `FIX`: show non-interrupting event version in replace menu ([bpmn-js#1924](https://github.com/bpmn-io/bpmn-js/pull/1924))
* `DEPS`: update to `bpmn-js@13.2.1`
* `DEPS`: update to `@camunda/linting@3.0.0`

## 5.12.1

* `FIX`: restore compatibility with token simulation plug-in ([#3672](https://github.com/camunda/camunda-modeler/issues/3672), [#3674](https://github.com/camunda/camunda-modeler/pull/3674))

## 5.12.0

### General

* `FEAT`: _Log_ and _Problems_ merged into single resizable bottom panel with _Output_ and _Problems_ tab ([#3509](https://github.com/camunda/camunda-modeler/pull/3509))
* `FEAT`: infer default port when connecting to Zeebe instances ([#3412](https://github.com/camunda/camunda-modeler/issues/3412))
* `FEAT`: point to troubleshooting guide on connection problems ([#3618](https://github.com/camunda/camunda-modeler/pull/3618))
* `FIX`: default empty business key to null in starting process instance ([#3644](https://github.com/camunda/camunda-modeler/pull/3644))
* `FIX`: account for custom SSL certificates when connecting to C8 SaaS
* `DEPS`: update to `zeebe-node@8.2.4`

### BPMN

* `FEAT`: support icons on all events ([@bpmn-io/element-template-icon-renderer#14](https://github.com/bpmn-io/element-template-icon-renderer/pull/14))
* `FEAT`: allow event rendering without icons ([bpmn-js#1917](https://github.com/bpmn-io/bpmn-js/pull/1917))
* `FEAT`: add _Inputs_ group for signal intermediate throw and end events ([bpmn-js-properties-panel911](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/911))
* `FEAT`: change signal Name entry to optional FEEL entry ([bpmn-js-properties-panel#911](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/911))
* `FEAT`: validate custom dropdown and textArea entries ([bpmn-js-properties-panel#922](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/922))
* `FEAT`: validate receive task after event-based gateway ([#3569](https://github.com/camunda/camunda-modeler/issues/3569))
* `FEAT`: support signal throw and end event in Camunda 8.3 ([#3555](https://github.com/camunda/camunda-modeler/issues/3555))
* `FEAT`: variable suggestions take the expression position into account ([\`@bpmn-io/variable-resolver#19](https://github.com/bpmn-io/variable-resolver/pull/19), [#3510](https://github.com/camunda/camunda-modeler/issues/3510))
* `FEAT`: remove templated `bpmn:Message` if no message bindings are active ([bpmn-js-properties-panel#915](https://github.com/bpmn-io/bpmn-js-properties-panel/issues/915))
* `FEAT`: allow time date in boundary and intermediate catch events ([bpmn-js-properties-panel#931](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/931))
* `FEAT`: allow time date for timer intermediate catch and boundary event in Camunda 8.3 ([@camunda/linting#98](https://github.com/camunda/bpmnlint-plugin-camunda-compat/pull/98))
* `FIX`: handle missing `resultExpression` value ([@bpmn-io/variable-resolver#20](https://github.com/bpmn-io/variable-resolver/pull/20), [#3599](https://github.com/camunda/camunda-modeler/issues/3599))
* `FIX`: allow to configure variable events for conditional start event in event subprocess ([bpmn-js-properties-panel#925](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/925), [#3568](https://github.com/camunda/camunda-modeler/issues/3568))
* `FIX`: unlink templated message instead of removing ([bpmn-js-properties-panel#914](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/914))
* `FIX`: hover indicator missing for create/append anything ([#3435](https://github.com/camunda/camunda-modeler/issues/3435))
* `FIX`: handle undefined values in custom properties validator ([bpmn-js-properties-panel#926](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/926))
* `FIX`: correct properties panel being hidden when resizing from closed state ([#3602](https://github.com/camunda/camunda-modeler/issues/3602))
* `DEPS`: update to `camunda-bpmn-js@2.7.0`
* `DEPS`: update to `@camunda/linting@1.3.0`
* `DEPS`: update to `bpmn-js@13.2.0`
* `DEPS`: update to `bpmn-js-properties-panel@2.0.0`
* `DEPS`: update to `diagram-js@12.2.0`

### Forms

* `FEAT`: support `readonly` property for form fields ([#636](https://github.com/bpmn-io/form-js/pull/636))
* `FEAT`: support FEEL expressions in `readonly` property ([#3600](https://github.com/camunda/camunda-modeler/issues/3600))
* `FEAT`: make editor form fields accessible via keyboard ([#173](https://github.com/bpmn-io/form-js/issues/173))
* `FEAT`: display editor form fields as readonly ([#636](https://github.com/bpmn-io/form-js/pull/636))
* `FEAT`: allow uneven columns ([#605](https://github.com/bpmn-io/form-js/issues/605))
* `FEAT`: resize form fields ([#566](https://github.com/bpmn-io/form-js/issues/566))
* `FEAT`: support FEEL for labels and descriptions ([#658](https://github.com/bpmn-io/form-js/pull/658))
* `DEPS`: update to `form-js` to 1.0.0-alpha.2
* `DEPS`: update to `form-linting` to 0.8.0
* `DEPS`: update to `form-playground` to 0.7.0-alpha.1

## 5.11.0

### General

* `FIX`: use custom SSL certificate for oAuth connection ([#3554](https://github.com/camunda/camunda-modeler/pull/3554))

### BPMN

* `FEAT`: persist properties panel layout across sessions ([#2638](https://github.com/camunda/camunda-modeler/issues/2638))
* `FEAT`: support templating of message events ([#3403](https://github.com/camunda/camunda-modeler/issues/3403))
* `FIX`: merge process variables schemas ([#3562](https://github.com/camunda/camunda-modeler/issues/3562))
* `FIX`: unlink event template when replaced with mismatching event definition ([#3537](https://github.com/camunda/camunda-modeler/issues/3537))
* `DEPS`: update to `camunda-bpmn-js@2.3.1`
* `DEPS`: update to `bpmn-js@13.0.4`
* `DEPS`: update to `bpmn-js-properties-panel@1.22.1`

### DMN

* `FIX`: fix crashes when `typeRef` is missing ([#3553](https://github.com/camunda/camunda-modeler/issues/3553))
* `DEPS`: update to `camunda-dmn-js@0.10.1`
* `DEPS`: update to `dmn-js@14.1.5`

### Forms

* `FEAT`: support `required` for `checkbox`, `checklist` and `taglist` ([#3529](https://github.com/camunda/camunda-modeler/issues/3529))
* `DEPS`: update to `form-js` to 0.14.1
* `DEPS`: update to `form-linting` to 0.7.1
* `DEPS`: update to `form-playground` to 0.6.0

## 5.10.0

### General

* `FEAT`: remove ET telemetry and migrate "ping" event to Mixpanel ([#3519](https://github.com/camunda/camunda-modeler/pull/3519), [#3521](https://github.com/camunda/camunda-modeler/pull/3521))
* `FEAT`: add latest execution platform versions ([#3522](https://github.com/camunda/camunda-modeler/pull/3522))
* `DEPS`: update to `zeebe-node@8.1.6`

### BPMN

* `FEAT`: allow adding example data to elements in cloud modeler ([#264](https://github.com/camunda/camunda-bpmn-js/pull/264))
* `FEAT`: add visual grid to editors ([#266](https://github.com/camunda/camunda-bpmn-js/pull/266))
* `FIX`: esure element template properties order is maintained ([bpmn-js-properties-panel#898](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/898))
* `FIX`: only provide external variable suggestions in fields backed by IO mappings ([bpmn-io/bpmn-js-properties-panel#902](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/902))
* `DEPS`: update to `diagram-js@11.12.0`
* `DEPS`: update to `@bpmn-io/properties-panel@1.7.0`
* `DEPS`: update to `bpmn-js@12.0.0`
* `DEPS`: update to `bpmn-js-properties-panel@1.20.3`
* `DEPS`: update to `camunda-bpmn-js@2.1.1`
* `DEPS`: update to `@camunda/linting@1.0.0`

### DMN

* `FEAT`: add visual grid to editors ([#67](https://github.com/camunda/camunda-dmn-js/pull/67))
* `DEPS`: update to `dmn-js-properties-panel@1.3.2`
* `DEPS`: update to `camunda-dmn-js@0.10.0`

### Forms

* `FEAT`: allow primitives for multi select values ([#542](https://github.com/bpmn-io/form-js/issues/542))
* `FEAT`: support more flexible rows layout with columns ([#560](https://github.com/bpmn-io/form-js/issues/560))
* `FEAT`: support FEEL templating in `text` components ([#567](https://github.com/bpmn-io/form-js/pull/567))
* `DEPS`: update to `form-js` to 0.13.0
* `DEPS`: update to `form-linting` to 0.6.1
* `DEPS`: update to `form-playground` to 0.5.0

## 5.9.0

### General

* `FEAT`: support MacOS shortcuts to switch tabs ([#3444](https://github.com/camunda/camunda-modeler/issues/3444))
* `FEAT`: run renderer in sandbox per default ([#3475](https://github.com/camunda/camunda-modeler/pull/3475))
* `FEAT`: expose activeTab to menu ([#3458](https://github.com/camunda/camunda-modeler/issues/3458))
* `FIX`: send original event from keyboard shortcuts ([#3474](https://github.com/camunda/camunda-modeler/pull/3474))

### BPMN

* `FEAT`: element templates support properties with multiple conditions ([bpmn-js-properties-panel#884](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/884))
* `FEAT`: add create-append-anything shortcuts ([#3472](https://github.com/camunda/camunda-modeler/issues/3472))
* `FEAT`: allow external variable providers to be added ([variable-resolver#1](https://github.com/bpmn-io/variable-resolver/pull/1))
* `FIX`: restore undo/redo behavior for german keyboard layout ([diagram-js#749](https://github.com/bpmn-io/diagram-js/pull/749))
* `FIX`: conditional props are applied when creating elements from element templates ([bpmn-js-properties-panel#878](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/878))
* `FIX`: correct order of variable name and FEEL expression in Script Tasks ([bpmn-js-properties-panel#886](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/886))
* `FIX`: enforce minimum Textarea height ([properties-panel#220](https://github.com/bpmn-io/properties-panel/pull/220))
* `FIX`: correctly display error message for error code ([#3443](https://github.com/camunda/camunda-modeler/issues/3443))
* `FIX`: correct SaaS deployment link ([#3433](https://github.com/camunda/camunda-modeler/issues/3433))
* `DEPS`: update to `@bpmn-io/properties-panel@1.4.0`
* `DEPS`: update to `@camunda/linting@0.16.0`
* `DEPS`: update to `bpmn-js@11.5.0`
* `DEPS`: update to `bpmn-js-properties-panel@1.19.1`
* `DEPS`: update to `camunda-bpmn-js@1.5.0`
* `DEPS`: update to `diagram-js@11.11.0`

### DMN

* `FEAT`: allow multi-line headers in decision tables ([dmn-js#719](https://github.com/bpmn-io/dmn-js/issues/719))
* `DEPS`: update to `dmn-js@14.1.1`

## 5.8.0

### General

* `FIX`: correctly deploy to Zeebe when extension missing in deployment name ([#3432](https://github.com/camunda/camunda-modeler/pull/3432))
* `FIX`: correct reload shortcut ([#3390](https://github.com/camunda/camunda-modeler/issues/3390))
* `CHORE`: log potentially invalid custom SSL certificates ([#3411](https://github.com/camunda/camunda-modeler/pull/3411), [#3415](https://github.com/camunda/camunda-modeler/pull/3415))
* `DEPS`: update to `zeebe-node@8.1.5` ([#3431](https://github.com/camunda/camunda-modeler/pull/3431))

### BPMN

* `FEAT`: feature `service` and `user` tasks more prominently in replace menu ([#1836](https://github.com/bpmn-io/bpmn-js/pull/1836))
* `FEAT`: integrate create + append anything ([#1802](https://github.com/bpmn-io/bpmn-js/pull/1802), [#1809](https://github.com/bpmn-io/bpmn-js/pull/1809), [#1815](https://github.com/bpmn-io/bpmn-js/pull/1815), [#1818](https://github.com/bpmn-io/bpmn-js/pull/1818), [#1831](https://github.com/bpmn-io/bpmn-js/pull/1831), [#1811](https://github.com/bpmn-io/bpmn-js/pull/1811), [#1809](https://github.com/bpmn-io/bpmn-js/pull/1809), [#1817](https://github.com/bpmn-io/bpmn-js/pull/1817))
* `FEAT`: simplify connection-multi icon ([#1822](https://github.com/bpmn-io/bpmn-js/pull/1822), [#2282](https://github.com/camunda/camunda-modeler/issues/2282))
* `FEAT`: join paths `round` by default ([1827](https://github.com/bpmn-io/bpmn-js/pull/1827))
* `FEAT`: improved BPMN symbol rendering ([#1830](https://github.com/bpmn-io/bpmn-js/pull/1830))
* `FEAT`: round connection corners ([#1828](https://github.com/bpmn-io/bpmn-js/pull/1828))
* `FEAT`: support `FEEL` expressions in C8 error throw events ([#3319](https://github.com/camunda/camunda-modeler/issues/3319))
* `FEAT`: support C8 escalation events ([#3318](https://github.com/camunda/camunda-modeler/issues/3318))
* `FEAT`: improve editor support in C8 element templates for non `FEEL` languages ([bpmn-io/bpmn-js-properties-panel#858](https://github.com/bpmn-io/bpmn-js-properties-panel/issues/858))
* `FEAT`: autoresize `name` element in properties panel ([bpmn-io/bpmn-js-properties-panel#705](https://github.com/bpmn-io/bpmn-js-properties-panel/issues/705))
* `FEAT`: validate `zeebe:candidateUsers` support ([#3385](https://github.com/camunda/camunda-modeler/issues/3385))
* `FEAT`: don't show execution related lint errors on non-executable pools ([#3368](https://github.com/camunda/camunda-modeler/issues/3368))
* `FIX`: serialize C8 templated properties in stable order ([bpmn-io/bpmn-js-properties-panel#838](https://github.com/bpmn-io/bpmn-js-properties-panel/issues/838))
* `FIX`: sort technical bindings in XML order ([bpmn-io/bpmn-js-properties-panel#845](https://github.com/bpmn-io/bpmn-js-properties-panel/issues/845), [bpmn-io/bpmn-js-properties-panel#843](https://github.com/bpmn-io/bpmn-js-properties-panel/issues/843), [#3400](https://github.com/camunda/camunda-modeler/issues/3400))
* `FIX`: allow deletion of C8 extension properties on participant ([#3417](https://github.com/camunda/camunda-modeler/issues/3417))
* `FIX`: allow C8 extension properties on all elements ([#3365](https://github.com/camunda/camunda-modeler/issues/3365))
* `FIX`: correctly reset error when setting `Message#correlationKey` ([#3392](https://github.com/camunda/camunda-modeler/issues/3392))
* `DEPS`: update to `camunda-bpmn-js@1.3.1`
* `DEPS`: update to `bpmn-js@11.3.0`
* `DEPS`: update to `bpmn-js-properties-panel@1.17.1`
* `DEPS`: update to `@camunda/linting@0.14.0`

### DMN

* `FEAT`: set decision table header as title ([bpmn-io/dmn-js#719](https://github.com/bpmn-io/dmn-js/issues/719))
* `DEPS`: update to `camunda-dmn-js@0.9.0`
* `DEPS`: update to `dmn-js@14.1.0`

### Forms

* `FEAT`: add scalable palette component ([bpmn-io/form-js#503](https://github.com/bpmn-io/form-js/issues/503))
* `FEAT`: support searchable selects ([bpmn-io/form-js#381](https://github.com/bpmn-io/form-js/issues/381))
* `FIX`: correct various minor editing bugs ([#3382](https://github.com/camunda/camunda-modeler/issues/3382), [#3379](https://github.com/camunda/camunda-modeler/issues/3379), [#3383](https://github.com/camunda/camunda-modeler/issues/3383), [#3384](https://github.com/camunda/camunda-modeler/issues/3384), [#3381](https://github.com/camunda/camunda-modeler/issues/3381), [#3380](https://github.com/camunda/camunda-modeler/issues/3380), [#3274](https://github.com/camunda/camunda-modeler/issues/3274))
* `DEPS`: update to [`form-js@0.12.1`](https://github.com/bpmn-io/form-js/blob/develop/packages/form-js/CHANGELOG.md#0120)

## 5.7.0

### General

* `FEAT`: add replace menu shortcut <kbd>R</kbd> ([#3364](https://github.com/camunda/camunda-modeler/pull/3364))
* `FEAT`: add support for nested variables to FEEL editor autocompletion ([#34](https://github.com/bpmn-io/feel-editor/pull/34))

### BPMN

* `FEAT`: add color picker ([#221](https://github.com/camunda/camunda-bpmn-js/pull/221))
* `FEAT`: add support for applying and unlinking element templates through replace menu ([#207](https://github.com/camunda/camunda-bpmn-js/pull/207), [#219](https://github.com/camunda/camunda-bpmn-js/pull/219))
* `FEAT`: add support for implementation as FEEL expression to script task ([#3321](https://github.com/camunda/camunda-modeler/issues/3321))
* `FEAT`: add support for error code as FEEL expression ([#837](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/837))
* `DEPS`: update to `bpmn-js@11.1.0`
* `DEPS`: update to `bpmn-js-properties-panel@1.14.0`
* `DEPS`: update to `camunda-bpmn-js@1.0.0`

### DMN

* `DEPS`: update to `dmn-js@14.0.2`
* `DEPS`: update to `camunda-dmn-js@0.8.1`

### Forms

* `FEAT`: add support for conditional rendering of form fields ([#403](https://github.com/bpmn-io/form-js/pull/403))
* `FEAT`: add text area form field ([#283](https://github.com/bpmn-io/form-js/issues/283))
* `FEAT`: add image form field ([#385](https://github.com/bpmn-io/form-js/pull/385))
* `FEAT`: add datetime form field ([#377](https://github.com/bpmn-io/form-js/pull/377))
* `FEAT`: add support for FEEL to text field form fields ([#447](https://github.com/bpmn-io/form-js/pull/447))
* `FEAT`: add support for prefix and suffix to text field and number form fields ([#460](https://github.com/bpmn-io/form-js/pull/460))
* `FEAT`: add support for decimal numbers to number form field ([#421](https://github.com/bpmn-io/form-js/pull/421))
* `FEAT`: add `email` and `phone` validation type to text field form fields ([#414](https://github.com/bpmn-io/form-js/pull/414))
* `FEAT`: validate form input JSON in validate view ([#386](https://github.com/bpmn-io/form-js/pull/386))
* `DEPS`: update to `@bpmn-io/form-js@0.10.1`
* `DEPS`: update to `@camunda/form-playground@0.3.0`
* `DEPS`: update to `@camunda/form-linting@0.2.1`

## 5.6.0

### General

* `FEAT`: add Camunda 8.2 and Camunda 7.19 preview profiles ([#3284](https://github.com/camunda/camunda-modeler/issues/3284), [#3301](https://github.com/camunda/camunda-modeler/issues/3301))
* `FIX`: suppress EPIPE errors for app output ([#3313](https://github.com/camunda/camunda-modeler/issues/3313))
* `FIX`: correctly parse path expressions in lists ([#3280](https://github.com/camunda/camunda-modeler/issues/3280))

### BPMN

* `FEAT`: implement new replace menu UI
* `FEAT`: validate that at least one process is executable ([#56](https://github.com/camunda/bpmnlint-plugin-camunda-compat/pull/56))
* `FEAT`: validate that sequence flows whose source is (X)OR gateway have condition or are default ([#58](https://github.com/camunda/bpmnlint-plugin-camunda-compat/pull/58))
* `FEAT`: validate Camunda Platform 8.2 diagrams ([#59](https://github.com/camunda/bpmnlint-plugin-camunda-compat/pull/59))
* `FEAT`: support all elements for modeling in C8 diagrams ([#3331](https://github.com/camunda/camunda-modeler/issues/3331))
* `FEAT`: support lint warnings in the UI ([#3330](https://github.com/camunda/camunda-modeler/issues/3330))
* `FEAT`: add candidate users entry to assignment group ([#776](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/776))
* `FEAT`: show supported platform version with lint errors ([#3148](https://github.com/camunda/camunda-modeler/issues/3148))
* `FIX`: correct apperance of ON/OFF switch ([#3233](https://github.com/camunda/camunda-modeler/issues/3233))
* `DEPS`: update to `camunda-bpmn-js@0.24.1`
* `DEPS`: update to `bpmn-js@11.0.5`
* `DEPS`: update to `bpmn-js-properties-panel@1.12.0`
* `DEPS`: update to `@camunda/linting@0.11.0`

### DMN

* `FEAT`: implement new replace menu UI
* `DEPS`: update to `camunda-dmn-js@0.8.0`
* `DEPS`: update to `dmn-js@14.0.0`
* `DEPS`: update to `camunda-dmn-moddle@1.2.0`
* `DEPS`: update to `dmn-js-properties-panel@1.3.1`

## 5.5.1

### BPMN

* `FIX`: ensure `ImplementationProps` do not remove empty properties ([#3303](https://github.com/camunda/camunda-modeler/issues/3303), [#3304](https://github.com/camunda/camunda-modeler/issues/3304))
* `DEPS`: update to `bpmn-js-properties-panel@1.11.2`

## 5.5.0

### General

* `FIX`: export overlay event handler ([#3251](https://github.com/camunda/camunda-modeler/pull/3251))
* `FIX`: handle bad request for update check ([#3265](https://github.com/camunda/camunda-modeler/pull/3265))
* `FIX`: save flag on handle change in xml editor ([9eafc90](https://github.com/camunda/camunda-modeler/commit/9eafc905793bb4d85ff070590760e6e4acf428d6))
* `FIX`: create C8 diagram from empty bpmn file ([#3243](https://github.com/camunda/camunda-modeler/pull/3243))
* `DEPS`: update bpmn-js to v10.2.1 ([#3266](https://github.com/camunda/camunda-modeler/pull/3266))

### Forms

* `FEAT`: integrate forms playground ([#3178](https://github.com/camunda/camunda-modeler/pull/3178))
* `DEPS`: bump form-js to v0.9.9 ([#3178](https://github.com/camunda/camunda-modeler/pull/3178))
* `DEPS`: add [__@camunda/form-playground__](https://github.com/camunda/form-playground) ([#3178](https://github.com/camunda/camunda-modeler/pull/3178))

## 5.4.2

### General

* `FIX`: do not use TLS with HTTP endpoints when deploying to Zeebe ([#3242](https://github.com/camunda/camunda-modeler/pull/3242))

### BPMN

* `FIX`: remove _Cycle_ option of _Timer_ _Type_ of interrupting timer start event ([#802](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/802))
* `FIX`: remove timer expression if not allowed after element changed ([#15](https://github.com/camunda/camunda-bpmn-js-behaviors/pull/15))

### Forms

* `FIX`: align default static values ([#355](https://github.com/bpmn-io/form-js/pull/355))

## 5.4.1

### General

* `FIX`: fix deployment to C8 SaaS ([#3223](https://github.com/camunda/camunda-modeler/issues/3223))

## 5.4.0

### General

* `FEAT`: support Camunda 8.1 and 7.18 as target platform ([#3158](https://github.com/camunda/camunda-modeler/issues/3158))
* `DEPS`: bump `@camunda/linting` to v0.7.2 ([#3184](https://github.com/camunda/camunda-modeler/pull/3184))
* `DEPS`: bump `diagram-js` to v9.1.0 ([03d303a59](https://github.com/camunda/camunda-modeler/commit/03d303a59c5ef06403490ee398fc1570b27a503a))
* `DEPS`: bump `diagram-js-direct-editing` to v2.0.0 ([5c4c02a45](https://github.com/camunda/camunda-modeler/commit/5c4c02a45ea262b01bafe67dec0feec2a90ffc2c))
* `DEPS`: bump `min-dash` to v4.0.0 ([372a27026](https://github.com/camunda/camunda-modeler/commit/372a27026906a7522dd882581831e04822d3aa92))
* `DEPS`: bump `min-dom` to v4.0.3 ([03d303a59](https://github.com/camunda/camunda-modeler/commit/03d303a59c5ef06403490ee398fc1570b27a503a))
* `DEPS`: bump `@bpmn-io/properties-panel` to v0.23.0 ([03d303a59](https://github.com/camunda/camunda-modeler/commit/03d303a59c5ef06403490ee398fc1570b27a503a))

### BPMN

* `FEAT`: support modeling of terminate end events in Camunda 8 ([#167](https://github.com/camunda/camunda-bpmn-js/pull/167))
* `FEAT`: support modeling of inclusive gateways in Camunda 8 ([#162](https://github.com/camunda/camunda-bpmn-js/pull/162))
* `FEAT`: support `bpmnlint` plugins ([#20](https://github.com/camunda/linting/pull/20))
* `FEAT`: support cron expressions for timer cycle ([#772](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/772))
* `FEAT`: show conditions group if source is inclusive gateway ([#756](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/756))
* `FEAT`: support element template properties without default value ([#763](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/763))
* `FEAT`: support deprecated element templates ([#766](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/766))
* `FEAT`: support automatic indentation in FEEL editor ([#13](https://github.com/bpmn-io/feel-editor/issues/13))
* `FEAT`: suggest built-in functions in FEEL editor ([#11](https://github.com/bpmn-io/feel-editor/issues/11))
* `FEAT`: suggest built-in snippets in FEEL editor ([#14](https://github.com/bpmn-io/feel-editor/issues/14))
* `FIX`: unset timer type correctly ([#775](https://github.com/bpmn-io/bpmn-js-properties-panel/issues/775))
* `FIX`: support `zeebe:property` binding for creation of elements from element templates ([#762](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/762))
* `FIX`: support conditional properties for creation of elements from element templates ([#762](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/762))
* `CHORE`: remove default values from _Variable assignment value_ of _Input_ and _Output_ ([#757](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/757))
* `DEPS`: bump `bpmn-js` to v10.2.0 ([03d303a59](https://github.com/camunda/camunda-modeler/commit/03d303a59c5ef06403490ee398fc1570b27a503a))
* `DEPS`: bump `bpmn-js-properties-panel` to v1.9.0 ([03d303a59](https://github.com/camunda/camunda-modeler/commit/03d303a59c5ef06403490ee398fc1570b27a503a))
* `DEPS`: bump `bpmn-moddle` to v8.0.0 ([5c4c02a45](https://github.com/camunda/camunda-modeler/commit/5c4c02a45ea262b01bafe67dec0feec2a90ffc2c))
* `DEPS`: bump `camunda-bpmn-js` to v0.21.0 ([03d303a59](https://github.com/camunda/camunda-modeler/commit/03d303a59c5ef06403490ee398fc1570b27a503a))

### DMN

* `DEPS`: bump `camunda-dmn-js` to v0.7.0 ([03d303a59](https://github.com/camunda/camunda-modeler/commit/03d303a59c5ef06403490ee398fc1570b27a503a))
* `DEPS`: bump `dmn-js` to v13.0.0 ([03d303a59](https://github.com/camunda/camunda-modeler/commit/03d303a59c5ef06403490ee398fc1570b27a503a))
* `DEPS`: bump `dmn-js-properties-panel` to v1.2.1 ([03d303a59](https://github.com/camunda/camunda-modeler/commit/03d303a59c5ef06403490ee398fc1570b27a503a))

### Forms

* `FEAT`: add `checklist` component ([#196](https://github.com/bpmn-io/form-js/issues/196))
* `FEAT`: add `taglist` component ([#198](https://github.com/bpmn-io/form-js/issues/198))
* `FEAT`: load dynamic input data ([#197](https://github.com/bpmn-io/form-js/issues/197))
* `FIX`: use outline for field focus state ([#267](https://github.com/bpmn-io/form-js/issues/267))
* `FIX`: filter invalid taglist options ([#303](https://github.com/bpmn-io/form-js/issues/303))
* `DEPS`: bump `@bpmn-io/form-js` to v0.9.6 ([f42afd84b](https://github.com/camunda/camunda-modeler/commit/f42afd84bf92f95461188e456675e2f0db5f5ba2))

### CMMN

* `DEPS`: bump `cmmn-js-properties-panel` to v0.9.0 ([5c4c02a45](https://github.com/camunda/camunda-modeler/commit/5c4c02a45ea262b01bafe67dec0feec2a90ffc2c))

## 5.3.0

### General

* `FEAT`: add sticky group headers in properties panels ([#726](https://github.com/bpmn-io/bpmn-js-properties-panel/issues/726))
* `FEAT`: allow application reload via keyboard shortcut ([#3089](https://github.com/camunda/camunda-modeler/issues/3089))
* `FIX`: restore focus after modal and overlay close ([#2942](https://github.com/camunda/camunda-modeler/issues/2942))
* `FIX`: properly highlight selected text in XML editor ([#2923](https://github.com/camunda/camunda-modeler/issues/2923))
* `FIX`: remove user path from Mixpanel tracking ([#3105](https://github.com/camunda/camunda-modeler/pull/3105))
* `DEPS`: bump [__@camunda/linting__](https://github.com/camunda/linting) to v0.5.0 ([#3118](https://github.com/camunda/camunda-modeler/pull/3118))
* `DEPS`: bump codemirror to v6.0.1 ([#3103](https://github.com/camunda/camunda-modeler/pull/3103))
* `DEPS`: bump diagram-js to v8.9.0 ([#3113](https://github.com/camunda/camunda-modeler/pull/3113))
* `DEPS`: bump [__@bpmn-io/properties-panel__](https://github.com/bpmn-io/properties-panel) to v0.20.1 ([#3120](https://github.com/camunda/camunda-modeler/pull/3120))

### BPMN

* `FEAT`: show diagram errors on canvas ([#3118](https://github.com/camunda/camunda-modeler/pull/3118))
* `FEAT`: add support for extension properties in Camunda Platform 8.1 ([#731](https://github.com/bpmn-io/bpmn-js-properties-panel/issues/731))
* `FEAT`: allow `zeebe:Properties` only in Camunda Platform 8.1 or higher ([#43](https://github.com/camunda/bpmnlint-plugin-camunda-compat/pull/43))
* `FEAT`: show error on duplicate task header keys ([#4](https://github.com/camunda/linting/issues/4))
* `FIX`: only claim existing element IDs ([#3086](https://github.com/camunda/camunda-modeler/issues/3085))
* `FIX`: move labels when collapsing sub processes ([#1695](https://github.com/bpmn-io/bpmn-js/issues/1695))
* `FIX`: render sequence flows always on top ([#1716](https://github.com/bpmn-io/bpmn-js/issues/1716))
* `FIX`: show FEEL syntax errors in properties panel ([#173](https://github.com/bpmn-io/properties-panel/pull/173))
* `FIX`: focus expanded FEEL editor on click ([#3072](https://github.com/camunda/camunda-modeler/issues/3072))
* `FIX`: preserve `isExecutable` flag when deleting pool ([#149](https://github.com/camunda/camunda-bpmn-js/issues/149))
* `FIX`: only remove one execution listener on undo ([#3016](https://github.com/camunda/camunda-modeler/issues/3016))
* `FIX`: close start instance overlay on icon click ([#3052](https://github.com/camunda/camunda-modeler/issues/3052))
* `DEPS`: bump bpmn-moddle to v7.1.3 ([#3113](https://github.com/camunda/camunda-modeler/pull/3113))
* `DEPS`: bump camunda-bpmn-moddle to v7.0.1 ([#3113](https://github.com/camunda/camunda-modeler/pull/3113))
* `DEPS`: bump zeebe-bpmn-moddle to v0.15.0 ([#3113](https://github.com/camunda/camunda-modeler/pull/3113))
* `DEPS`: bump bpmn-js to v9.4.0 ([#3113](https://github.com/camunda/camunda-modeler/pull/3113))
* `DEPS`: bump bpmn-js-properties-panel to v1.6.1 ([#3124](https://github.com/camunda/camunda-modeler/pull/3124))
* `DEPS`: bump camunda-bpmn-js to v0.17.2 ([#3124](https://github.com/camunda/camunda-modeler/pull/3124))

### DMN

* `DEPS`: bump dmn-js to v12.3.0 ([#3108](https://github.com/camunda/camunda-modeler/pull/3108))
* `DEPS`: bump dmn-js-properties-panel to v1.1.2 ([#3120](https://github.com/camunda/camunda-modeler/pull/3120))
* `DEPS`: bump camunda-dmn-js to v0.6.1 ([#3120](https://github.com/camunda/camunda-modeler/pull/3120))

## 5.2.0

### General

* `FEAT`: toggle properties panel errors when toggling error panel ([#3014](https://github.com/camunda/camunda-modeler/pull/3014))
* `FIX`: fix error panel styles ([#3015](https://github.com/camunda/camunda-modeler/pull/3015))
* `FIX`: load modeling styles globally ([#3031](https://github.com/camunda/camunda-modeler/pull/3031))
* `FIX`: fix PNG export on DRD diagrams ([#3068](https://github.com/camunda/camunda-modeler/issues/3068))
* `DEPS`: bump [__@camunda/linting__](https://github.com/camunda/linting) to v0.3.4 ([#3065](https://github.com/camunda/camunda-modeler/pull/3065))
* `DEPS`: bump diagram-js to v8.7.1 ([#3065](https://github.com/camunda/camunda-modeler/pull/3065))
* `DEPS`: bump diagram-js-direct-editing to v1.7.0 ([#3065](https://github.com/camunda/camunda-modeler/pull/3065))
* `DEPS`: bump diagram-js-origin to v1.3.3 ([#3065](https://github.com/camunda/camunda-modeler/pull/3065))
* `DEPS`: bump min-dom to v3.2.1 ([#3065](https://github.com/camunda/camunda-modeler/pull/3065))

### BPMN

* `FEAT`: add FEEL editor for FEEL properties ([#158](https://github.com/bpmn-io/properties-panel/pull/158))
* `FIX`: check for replacement using actual target ([#1699](https://github.com/bpmn-io/bpmn-js/pull/1699))
* `FIX`: do not update empty business key ([#2](https://github.com/camunda/camunda-bpmn-js-behaviors/pull/2))
* `DEPS`: bump bpmn-js to v9.3.2 ([#3065](https://github.com/camunda/camunda-modeler/pull/3065))
* `DEPS`: bump camunda-bpmn-js to v0.16.1 ([#3065](https://github.com/camunda/camunda-modeler/pull/3065))

### DMN

* `FIX`: attach and detach DMN overview properly ([#3080](https://github.com/camunda/camunda-modeler/pull/3080))

## 5.1.0

_Adds a multi-element context, improves overall selection UX in diagram editors, and ships conditional element template properties (C8 only)._

### General

* `CHORE`: mask non-boolean flag values for ping event ([#2963](https://github.com/camunda/camunda-modeler/pull/2963))
* `CHORE`: track set flags via ping event ([#2963](https://github.com/camunda/camunda-modeler/pull/2963))
* `CHORE`: use [__@camunda/linting__](https://github.com/camunda/linting) ([#2976](https://github.com/camunda/camunda-modeler/pull/2976))
* `CHORE`: implement mixpanel telemetry ([#2934](https://github.com/camunda/camunda-modeler/issues/2934))
* `FIX`: debounced input fields no longer lose their values ([#2990](https://github.com/camunda/camunda-modeler/issues/2990))
* `FIX`: always write file when save is triggered ([#2925](https://github.com/camunda/camunda-modeler/issues/2925))
* `FIX`: explicitly specify default credentials during deploy ([#2924](https://github.com/camunda/camunda-modeler/pull/2924))
* `FIX`: reverse order of input error and description during deploy ([#2918](https://github.com/camunda/camunda-modeler/issues/2918))
* `FIX`: make sorting of error diagram errors deterministic ([#2933](https://github.com/camunda/camunda-modeler/pull/2933))
* `FIX`: disable reopen last tab on empty start ([#2893](https://github.com/camunda/camunda-modeler/pull/2893))
* `FIX`: adjust overlay max heights to alway fit viewport ([#2915](https://github.com/camunda/camunda-modeler/pull/2915))
* `FIX`: use separate linting state ([#2917](https://github.com/camunda/camunda-modeler/pull/2917))
* `FIX`: add form-js notice to license ([#2947](https://github.com/camunda/camunda-modeler/pull/2947))
* `FIX`: improved file dialogs to match OS defaults ([#2300](https://github.com/camunda/camunda-modeler/issues/2300), [#2971](https://github.com/camunda/camunda-modeler/pull/2971))
* `FIX`: reorder close file dialog buttons to match convention ([#2895](https://github.com/camunda/camunda-modeler/pull/2895))
* `CHORE`: configure process env for mixpanel ([#2941](https://github.com/camunda/camunda-modeler/pull/2941))
* `CHORE`: removed "new" badge for C8 ([#2953](https://github.com/camunda/camunda-modeler/issues/2953))
* `DEPS`: bump electron to 19.0.6 ([#2998](https://github.com/camunda/camunda-modeler/pull/2998), [#3004](https://github.com/camunda/camunda-modeler/pull/3004))
* `DEPS`: bump properties-panel to 1.2.0 ([bc8b74870](https://github.com/camunda/camunda-modeler/commit/bc8b74870))
* `DEPS`: bump diagram-js to 8.7.0 ([bc8b74870](https://github.com/camunda/camunda-modeler/commit/bc8b74870))

### BPMN

* `FEAT`: allow to select participant and subprocess via click on body ([bpmn-js#1646](https://github.com/bpmn-io/bpmn-js/pull/1646))
* `FEAT`: add multi-element context pad ([bpmn-js#1525](https://github.com/bpmn-io/bpmn-js/pull/1525))
* `FEAT`: add aligment and distribution menu ([bpmn-js#1680](https://github.com/bpmn-io/bpmn-js/issues/1680), [camunda-bpmn-js#1691](https://github.com/bpmn-io/bpmn-js/issues/1691))
* `FEAT`: rework diagram interaction handles ([diagram-js#640](https://github.com/bpmn-io/diagram-js/pull/640))
* `FEAT`: rework select and hover interaction on the diagram ([bpmn-js#1616](https://github.com/bpmn-io/bpmn-js/issues/1616), [diagram-js#640](https://github.com/bpmn-io/diagram-js/pull/640), [diagram-js#643](https://github.com/bpmn-io/diagram-js/pull/643))
* `FEAT`: enable multi-select state in properties panel ([bpmn-props-panel#687](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/678))
* `FEAT`: display timestamp for template versions ([bpmn-props-panel#698](https://github.com/bpmn-io/bpmn-js-properties-panel/pull/698))
* `FIX`: added separator to process variable sources ([#3003](https://github.com/camunda/camunda-modeler/issues/3003))
* `FIX`: editing field injections no longer crashes the modeler ([#2989](https://github.com/camunda/camunda-modeler/issues/2989))
* `FIX`: element template name and icon now display properly on versioned templates ([#2920](https://github.com/camunda/camunda-modeler/issues/2920))
* `FIX`: collapsing subprocesses correctly handles sequence flow labels ([#2993](https://github.com/camunda/camunda-modeler/issues/2993))
* `FIX`: use explicit `Decision ID` label for called decisions ([#2725](https://github.com/camunda/camunda-modeler/issues/2725))
* `FIX`: complete direct editing on selection changed ([#2961](https://github.com/camunda/camunda-modeler/issues/2961))
* `FIX`: lint subscriptions only if start event is child to a subprocess ([#2983](https://github.com/camunda/camunda-modeler/issues/2983))
* `FIX`: cancel direct editing before shape deletion ([bpmn-js#1677](https://github.com/bpmn-io/bpmn-js/issues/1677))
* `DEPS`: bump camunda-bpmn-js to 0.15.2 ([bc8b74870](https://github.com/camunda/camunda-modeler/commit/bc8b74870), [dbe78ef45](https://github.com/camunda/camunda-modeler/commit/dbe78ef45))
* `DEPS`: bump bpmn-js-properties-panel to 1.2.0 ([bc8b74870](https://github.com/camunda/camunda-modeler/commit/bc8b74870))
* `DEPS`: bump bpmn-js to 9.3.1 ([bc8b74870](https://github.com/camunda/camunda-modeler/commit/bc8b74870))
* `DEPS`: bump bpmnlint-plugin-camunda-compat to 0.9.1 ([#2927](https://github.com/camunda/camunda-modeler/issues/2927), [d6cc308](https://github.com/camunda/camunda-modeler/commit/d6cc308))

### DMN

* `FEAT`: rework diagram interaction handles ([diagram-js#640](https://github.com/bpmn-io/diagram-js/pull/640))
* `FEAT`: rework select and hover interaction on the diagram ([diagram-js#640](https://github.com/bpmn-io/diagram-js/pull/640), [diagram-js#643](https://github.com/bpmn-io/diagram-js/pull/643))
* `FIX`: allow to scroll variable type in literal expression ([#2908](https://github.com/camunda/camunda-modeler/issues/2908))
* `DEPS`: bump dmn-js to 12.2.0 ([#3019](https://github.com/camunda/camunda-modeler/pull/3019))
* `DEPS`: bump camunda-dmn-js to 0.5.0 ([#3019](https://github.com/camunda/camunda-modeler/pull/3019))
* `DEPS`: bump dmn-js-properties-panel to 1.1.0 ([#3019](https://github.com/camunda/camunda-modeler/pull/3019))

### Forms

* `FIX`: textfield "regularExpressionPattern" now correctly sets "pattern" in the form definition ([#2919](https://github.com/camunda/camunda-modeler/issues/2919))
* `DEPS`: bump form-js from 0.7.0 to 0.7.2 ([15aed67091](https://github.com/camunda/camunda-modeler/commit/15aed67091))

## 5.0.0

### General

* `FEAT`: update app icon ([#2875](https://github.com/camunda/camunda-modeler/pull/2875))
* `FEAT`: overhaul the welcome page design and add `new` badge for Camunda Platform 8 ([#2829](https://github.com/camunda/camunda-modeler/pull/2829) and [#2830](https://github.com/camunda/camunda-modeler/issues/2830))
* `FEAT`: rename Camunda Platform to Camunda Platform 7 and Camunda Cloud to Camunda Platform 8 ([`129af3`](https://github.com/camunda/camunda-modeler/commit/129af3c14ba81a4dd21de6210240c58eee35ca77), [`33e5e8`](https://github.com/camunda/camunda-modeler/commit/33e5e86990274c590fadc3c508c1b27cda900ff2), [`673293`](https://github.com/camunda/camunda-modeler/commit/67329359a19be2cd5335499b941d05218631467e), [`86ccec`](https://github.com/camunda/camunda-modeler/commit/86ccec8dd7e70c80da7454f863816ed06f5990d5), and [#2834](https://github.com/camunda/camunda-modeler/issues/2834))
* `FEAT`: add Camunda Platform 8 and Camunda Platform 7.17 in platform version selector ([#2736](https://github.com/camunda/camunda-modeler/issues/2736))
* `FEAT`: link to new docs homepage ([`d036a0`](https://github.com/camunda/camunda-modeler/commit/d036a0a520b7ff4b68dcd74575fc4d29b39dd4f6), [`555abb`](https://github.com/camunda/camunda-modeler/commit/555abb368880f5d631d461b0d109a749ef880d65), and [`d92633`](https://github.com/camunda/camunda-modeler/commit/d92633eeaf5b97f8bf699d81821991612e2522cd))
* `FEAT`: add display-version flag ([#2790](https://github.com/camunda/camunda-modeler/issues/2790) and [`5ca662`](https://github.com/camunda/camunda-modeler/commit/5ca6621848d7b314eb56f6fc96a98d7b72f9ecc2))
* `FEAT`: send telemetry data for usage of plugins ([#2818](https://github.com/camunda/camunda-modeler/issues/2818))
* `FEAT`: send telemetry data for button/link clicks on welcome page ([#2828](https://github.com/camunda/camunda-modeler/issues/2828))
* `FIX`: always show active tab indicator ([#2732](https://github.com/camunda/camunda-modeler/issues/2732))
* `FIX`: avoid error when closing startInstance overlay via canvas click ([#2727](https://github.com/camunda/camunda-modeler/issues/2727))
* `FIX`: log errors in context of toast notifications ([#2793](https://github.com/camunda/camunda-modeler/issues/2793))
* `FIX`: don't open external links twice in some situations ([#2905](https://github.com/camunda/camunda-modeler/issues/2905))
* `CHORE`: add query parameters to external camunda.com and camunda.io links ([`0708ac`](https://github.com/camunda/camunda-modeler/commit/0708ace145056e7d3dbf35dab492651036a919d6))
* `DEPS`: bump to `electron@17.1.0` ([#2797](https://github.com/camunda/camunda-modeler/pull/2797))
* `DEPS`: bump to `zeebe-node@2.1.0` ([#2783](https://github.com/camunda/camunda-modeler/issues/2783))

### BPMN

* `FEAT`: add element template support for Camunda Platform 8 BPMN diagrams ([#2785](https://github.com/camunda/camunda-modeler/pull/2785))
* `FEAT`: allow configuration of custom groups for element template configurations ([#2673](https://github.com/camunda/camunda-modeler/issues/2673))
* `FEAT`: send telemetry data for usage of element templates used for Camunda Platform 8 BPMN diagrams ([#2786](https://github.com/camunda/camunda-modeler/issues/2786), and [`268c53`](https://github.com/camunda/camunda-modeler/commit/268c53b00f9bd75055dfddf9683ba603c5c7337d))
* `FEAT`: make deploy to Camunda Platform 8 SaaS the default selection in deploy tool ([#2832](https://github.com/camunda/camunda-modeler/issues/2832))
* `FEAT`: show error in properties panel on click on respective error ([#2861](https://github.com/camunda/camunda-modeler/pull/2861))
* `FEAT`: add implementation level validation and respective errors ([#2891](https://github.com/camunda/camunda-modeler/pull/2891))
* `FEAT`: improve UI of deploy tool ([#2863](https://github.com/camunda/camunda-modeler/issues/2863), and [#2860](https://github.com/camunda/camunda-modeler/issues/2860))
* `FEAT`: let plugins differentiate between BPMN tabs for either cloud, platform, or both ([#2757](https://github.com/camunda/camunda-modeler/issues/2757))
* `FEAT`: pick up `bpmn-js` and `moddle` plugins for cloud BPMN tabs ([#2766](https://github.com/camunda/camunda-modeler/issues/2766))
* `FEAT`: send telemetry data for usage of collapsed subprocesses ([#2756](https://github.com/camunda/camunda-modeler/issues/2756))
* `FIX`: show properties-panel icon for ad-hoc subProcess ([#2749](https://github.com/camunda/camunda-modeler/issues/2749))
* `FIX`: make labels for formType selection in properties panel easier to understand ([#2496](https://github.com/camunda/camunda-modeler/issues/2496))
* `FIX`: avoid error in deployPlugin when file menu is used ([#2762](https://github.com/camunda/camunda-modeler/issues/2762))
* `FIX`: allow copy\&paste of linting errors on MacOS ([#2716](https://github.com/camunda/camunda-modeler/issues/2716))
* `FIX`: correctly show color icons in edit > color menu ([#2733](https://github.com/camunda/camunda-modeler/issues/2733))
* `FIX`: show variableName and variableEvents for Conditional Events ([#2866](https://github.com/camunda/camunda-modeler/issues/2866))
* `FIX`: correctly persist Message End Events with external task configuration to XML ([#2865](https://github.com/camunda/camunda-modeler/issues/2865))
* `DEPS`: bump to `bpmn-js-properties-panel@1.0.0-alpha.12` ([`b3ec90`](https://github.com/camunda/camunda-modeler/commit/b3ec90616543816a38fac1ef87dbf93f0c286738))
* `DEPS`: bump to `camunda-bpmn-js@0.13.0-alpha.8` ([`b3ec90`](https://github.com/camunda/camunda-modeler/commit/b3ec90616543816a38fac1ef87dbf93f0c286738))
* `DEPS`: bump to `diagram-js@8.2.1` ([`b3ec90`](https://github.com/camunda/camunda-modeler/commit/b3ec90616543816a38fac1ef87dbf93f0c286738))
* `DEPS`: bump to `zeebe-bpmn-moddle@0.12.1` ([`b3ec90`](https://github.com/camunda/camunda-modeler/commit/b3ec90616543816a38fac1ef87dbf93f0c286738))

### DMN

* `FEAT`: add DMN modeler for Camunda Platform 8 ([#2525](https://github.com/camunda/camunda-modeler/issues/2525))
* `FEAT`: add deploy tool for Camunda Platform 8 DMN diagrams ([#2526](https://github.com/camunda/camunda-modeler/issues/2526))
* `FEAT`: let plugins differentiate between DMN tabs for either cloud, platform, or both ([#2854](https://github.com/camunda/camunda-modeler/issues/2854))
* `FEAT`: support engine profile selection for DMN diagrams ([#2872](https://github.com/camunda/camunda-modeler/issues/2872))
* `FEAT`: send telemetry data for engine usage within DMN diagrams on diagramOpen or diagramDeploy ([#2853](https://github.com/camunda/camunda-modeler/issues/2853))
* `FIX`: allow opening of DMN 1.3 files with xml file extension ([#2841](https://github.com/camunda/camunda-modeler/issues/2841))
* `DEPS`: add `camunda-dmn-js@0.2.2` ([`ba3a6c`](https://github.com/camunda/camunda-modeler/commit/ba3a6cc00b3b68d5be718f35ec927ed439c67c4f))
* `DEPS`: bump to `dmn-js@12.1.0` ([`ba3a6c`](https://github.com/camunda/camunda-modeler/commit/ba3a6cc00b3b68d5be718f35ec927ed439c67c4f))

### Forms

* `DEPS`: bump to form-js\@0.7.0 ([`3a20df`](https://github.com/camunda/camunda-modeler/commit/3a20df7a61d4fa498e250c8ae31ebc62b51a50f5))

### Breaking Changes

* `Camunda Platform` is now consistenly labeled as `Camunda Platform 7` and `Camunda Cloud` as `Camunda Platform 8`. This is a UI-level change and diagram data is not affected.

## 5.0.0-alpha.1

### BPMN

* `FEAT`: support drilldown into subprocesses ([#1443](https://github.com/bpmn-io/bpmn-js/issues/1443))
* `FEAT`: support linting in platform diagrams ([#2625](https://github.com/camunda/camunda-modeler/issues/2625))
* `FEAT`: track userTask formRef usage ([#2737](https://github.com/camunda/camunda-modeler/pull/2737))

## 5.0.0-alpha.0

### General

* `FEAT`: track Camunda Platform as target type in telemetry ([#2238](https://github.com/camunda/camunda-modeler/issues/2238))
* `FEAT`: expose properties panel library to plugins ([#2632](https://github.com/camunda/camunda-modeler/pull/2632))
* `FEAT`: redesign properties panel handle bar ([#2633](https://github.com/camunda/camunda-modeler/issues/2633))
* `FEAT`: add tab context menu ([#2630](https://github.com/camunda/camunda-modeler/issues/2630), [#1240](https://github.com/camunda/camunda-modeler/issues/1240))
* `FEAT`: redesign the notifications ([#2607](https://github.com/camunda/camunda-modeler/issues/2607), [#2643](https://github.com/camunda/camunda-modeler/issues/2643))
* `FEAT`: add new file button with keyboard shortcut and navigation ([#2556](https://github.com/camunda/camunda-modeler/issues/2556), [#2626](https://github.com/camunda/camunda-modeler/issues/2626))
* `FEAT`: remove toolbar ([#2569](https://github.com/camunda/camunda-modeler/issues/2569))
* `FEAT`: redesign the tab container ([#2562](https://github.com/camunda/camunda-modeler/issues/2562))
* `FEAT`: redesign and improve UX of the status bar ([#2488](https://github.com/camunda/camunda-modeler/issues/2488))
* `FEAT`: increase default window size ([`9a00eff`](https://github.com/camunda/camunda-modeler/commit/9a00effc4c7d3a5c1b06280ea11add4ca7b2ede5))
* `FEAT`: implement reduced color scheme ([#2459](https://github.com/camunda/camunda-modeler/issues/2459)), ([#2550](https://github.com/camunda/camunda-modeler/issues/2550))
* `FEAT`: redesign the tab bar ([#2507](https://github.com/camunda/camunda-modeler/issues/2507), [#2563](https://github.com/camunda/camunda-modeler/issues/2563), [#2440](https://github.com/camunda/camunda-modeler/issues/2440))
* `FEAT`: allow to drop files from VSCode ([#2299](https://github.com/camunda/camunda-modeler/issues/2299))
* `FEAT`: expose Overlay component ([#2492](https://github.com/camunda/camunda-modeler/pull/2492))
* `FEAT`: make file permissions for Linux more strict ([#2439](https://github.com/camunda/camunda-modeler/issues/2439))
* `FEAT`: improve welcome tab UI ([#2470](https://github.com/camunda/camunda-modeler/issues/2470), [#2479](https://github.com/camunda/camunda-modeler/issues/2479))
* `FIX`: restrict height of log ([#2258](https://github.com/camunda/camunda-modeler/issues/2258))
* `FIX`: require at least one item of system information to be checked ([#2414](https://github.com/camunda/camunda-modeler/issues/2414))
* `DEPS`: update to `electron@12.1.2`

### BPMN

* `FEAT`: support Camunda Cloud 1.4 ([#2524](https://github.com/camunda/camunda-modeler/issues/2524), [#2641](https://github.com/camunda/camunda-modeler/issues/2641))
* `FEAT`: UX and technical re-write of the properties panel for Camunda Platform diagrams  ([#2663](https://github.com/camunda/camunda-modeler/issues/2663))
* `FEAT`: validate diagrams ([#2466](https://github.com/camunda/camunda-modeler/issues/2466), [#2464](https://github.com/camunda/camunda-modeler/issues/2464))
* `FEAT`: allow to pass variables when starting an instance ([#2437](https://github.com/camunda/camunda-modeler/issues/2437))
* `FEAT`: allow to set execution platform version ([#2465](https://github.com/camunda/camunda-modeler/issues/2465))
* `FEAT`: move color picker to the edit menu ([#2568](https://github.com/camunda/camunda-modeler/issues/2568))
* `FEAT`: use text area for form JSON configuration in Camunda Cloud diagram ([#2579](https://github.com/camunda/camunda-modeler/issues/2579))
* `FEAT`: add `--disable-platform` flag which allows to disable Camunda Platform features ([#2506](https://github.com/camunda/camunda-modeler/issues/2506))
* `FEAT`: use overlay for deploy and start instance tools ([#2489](https://github.com/camunda/camunda-modeler/issues/2489))
* `FIX`: do not display compensation SubProcess in the list of activities to be compensated ([#2397](https://github.com/camunda/camunda-modeler/issues/2397))
* `FIX`: rename "Target" to "Called element" for Camunda Cloud Call Activity ([#2586](https://github.com/camunda/camunda-modeler/issues/2586))
* `FIX`: keep properties panel updated when root changes ([#2374](https://github.com/camunda/camunda-modeler/issues/2374))
* `FIX`: set correct attributes when coloring connections ([#2599](https://github.com/camunda/camunda-modeler/issues/2599))
* `FIX`: show proper tooltip on start instance tool ([#2429](https://github.com/camunda/camunda-modeler/issues/2429))
* `DEPS`: update to `bpmn-js@8.9.1`

### DMN

* `FIX`: keep selection of a replaced element ([#2306](https://github.com/camunda/camunda-modeler/issues/2306))
* `DEPS`: update to `dmn-js@11.1.2`

### Forms

* `FEAT`: split Camunda Platform and Camunda Cloud forms ([#2650](https://github.com/camunda/camunda-modeler/issues/2650))
* `FEAT`: allow to deploy Camunda Platform forms ([#2498](https://github.com/camunda/camunda-modeler/issues/2498))
* `FEAT`: allow to drag and drop forms ([#2490](https://github.com/camunda/camunda-modeler/issues/2490))
* `FIX`: properly set exporter metadata ([#2540](https://github.com/camunda/camunda-modeler/issues/2540))
* `FIX`: enable "Select all" in properties panel ([#2411](https://github.com/camunda/camunda-modeler/issues/2411))
* `FIX`: do not disable save options when tab is switched ([#2635](https://github.com/camunda/camunda-modeler/issues/2635))
* `FIX`: make sure select component can be selected via click ([#2415](https://github.com/camunda/camunda-modeler/issues/2415))
* `DEPS`: update to `@bpmn-io/form-js@0.6.0`

### Breaking Changes

* The properties panel extensions for `0.x` series don't work with the new properties panel. Check out [the project's changelog](https://github.com/bpmn-io/bpmn-js-properties-panel/blob/main/CHANGELOG.md#breaking-changes) with the example migration for guidance.
* The `toolbar` slot has been removed. Consider moving your plugin's buttons to the status bar. Check out [the `how to migrate your Camunda Modeler plugin` blog post](https://camunda.com/blog/2022/01/how-to-migrate-your-camunda-modeler-plugins-to-work-with-camunda-modeler-5-x/) for guidance.

## 4.12.0

* `FEAT`: define engine profiles globally ([#2544](https://github.com/camunda/camunda-modeler/issues/2544))
* `FEAT`: support Zeebe 1.3 / Camunda Cloud 1.3 ([#2578](https://github.com/camunda/camunda-modeler/issues/2578), [#2535](https://github.com/camunda/camunda-modeler/issues/2535))
* `FIX`: keep original IDs when copy and pasting elements between diagrams ([#1410](https://github.com/camunda/camunda-modeler/issues/1410))
* `FIX`: hide disabled engines in Form Editor select ([#2512](https://github.com/camunda/camunda-modeler/issues/2512))
* `DEPS`: update to `bpmn-js@8.8.2`

## 4.11.1

* `FIX`: correct deployment of Camunda Forms with `camunda:formRefBinding=latest` ([#2484](https://github.com/camunda/camunda-modeler/issues/2484))
* `FIX`: quit application on MacOS when forcefully requested ([#1803](https://github.com/camunda/camunda-modeler/issues/1803))

## 4.11.0

### General

* `FEAT`: support Zeebe 1.2 / Camunda Cloud 1.2 ([#2423](https://github.com/camunda/camunda-modeler/issues/2423), [#2428](https://github.com/camunda/camunda-modeler/issues/2428), [#2420](https://github.com/camunda/camunda-modeler/issues/2420))
* `FEAT`: support for Camunda Platform 7.16 ([#2428](https://github.com/camunda/camunda-modeler/issues/2428), [#2295](https://github.com/camunda/camunda-modeler/issues/2295))
* `FIX`: link to correct timer event documentation ([#2413](https://github.com/camunda/camunda-modeler/issues/2413))

### BPMN

* `FEAT`: allow Form reference bindings for User Tasks and Start Events ([#2295](https://github.com/camunda/camunda-modeler/issues/2295))
* `FIX`: allow deployment to Camunda Platform version 7.8.0 and below ([#2340](https://github.com/camunda/camunda-modeler/issues/2340))

## 4.10.0

### General

* `FEAT`: add `Provide Feedback` button in the status bar, allowing to copy system information to clipboard ([#2388](https://github.com/camunda/camunda-modeler/issues/2388))
* `FEAT`: add context action to tabs to reveal respective file in file explorer ([#1834](https://github.com/camunda/camunda-modeler/issues/1834))
* `FIX`: disable editor shortcuts when developer tools are open ([#2389](https://github.com/camunda/camunda-modeler/issues/2389))
* `FIX`: ensure that user retrieves an update notification when using the manual `Check for Updates` action by not using the staged rollout mechanism ([#2263](https://github.com/camunda/camunda-modeler/issues/2263))
* `FIX`: keep tab open when a save dialog was canceled ([#2359](https://github.com/camunda/camunda-modeler/issues/2359))

### BPMN

* `FEAT`: UX and technical re-write of the Properties Panel for Camunda Cloud diagrams ([#2347](https://github.com/camunda/camunda-modeler/issues/2347))
* `FEAT`: allow the user to deploy diagrams to different Camunda Cloud regions by using the Cluster URL (instead of Cluster ID) ([#2375](https://github.com/camunda/camunda-modeler/issues/2375))
* `FIX`: correctly encode Camunda-Forms inside UserTasks ([#2365](https://github.com/camunda/camunda-modeler/issues/2365))
* `DEPS`: update to `bpmn-js@8.7.3`

### DMN

* `FIX`: display edit cell button in decision table view in correct position after changing cells ([#543](https://github.com/bpmn-io/dmn-js/issues/543))
* `FIX`: fix an error that was thrown when using the BACKSPACE key in literal expression editor in some situations ([#2095](https://github.com/camunda/camunda-modeler/issues/2095))
* `DEPS`: update to `dmn-js@11.0.2`

### Forms

* `FEAT`: allow setting the execution platform version for a form via the status bar ([#2323](https://github.com/camunda/camunda-modeler/issues/2323))
* `FEAT`: based on the selected execution platform version, show validation errors in case form components are not supported ([#2323](https://github.com/camunda/camunda-modeler/issues/2323))
* `DEPS`: update to `form-js@0.4.2` ([#2407](https://github.com/camunda/camunda-modeler/pull/2407))

## 4.9.0

### General

* `FEAT`: support Zeebe 1.1 / Camunda Cloud 1.1 ([#2319](https://github.com/camunda/camunda-modeler/issues/2319), [#2298](https://github.com/camunda/camunda-modeler/issues/2298), [#2297](https://github.com/camunda/camunda-modeler/issues/2297), [#2296](https://github.com/camunda/camunda-modeler/issues/2296))
* `FEAT`: improve status bar ([#2318](https://github.com/camunda/camunda-modeler/issues/2318), [#2303](https://github.com/camunda/camunda-modeler/issues/2303))
* `FEAT`: add basic what's new communication ([#2303](https://github.com/camunda/camunda-modeler/issues/2303))
* `FEAT`: remove ambiguous `+` button ([#2312](https://github.com/camunda/camunda-modeler/issues/2312), [#2293](https://github.com/camunda/camunda-modeler/issues/2293))
* `FEAT`: await loading of plug-in provided, injected styles ([`#2281`](https://github.com/camunda/camunda-modeler/pull/2281))
* `FIX`: correct opening of files in already running editor instance ([#2268](https://github.com/camunda/camunda-modeler/issues/2268))
* `CHORE`: migrate to GitHub actions ([#2245](https://github.com/camunda/camunda-modeler/issues/2245), [#2242](https://github.com/camunda/camunda-modeler/issues/2242))

### BPMN

* `FEAT`: support [bpmn-in-color](https://github.com/bpmn-miwg/bpmn-in-color)
* `FEAT`: support setting `variables` and `local` property via element templates independently ([#2334](https://github.com/camunda/camunda-modeler/issues/2334))
* `FIX`: support expressions in `bpmn:CallActivity#processId` field ([#2267](https://github.com/camunda/camunda-modeler/issues/2267))
* `FIX`: connect message flows to call activities ([#942](https://github.com/camunda/camunda-modeler/issues/942))
* `FIX`: correct Windows newlines being lost on paste ([#2280](https://github.com/camunda/camunda-modeler/issues/2280))
* `FIX`: report element template validation errors as warnings ([#2287](https://github.com/camunda/camunda-modeler/issues/2287))
* `FIX`: fallback to default properties panel layout ([#2255](https://github.com/camunda/camunda-modeler/issues/2255))
* `DEPS`: update to `bpmn-js@8.7.1`

### DMN

* `FEAT`: set focus on newly created row ([#2259](https://github.com/camunda/camunda-modeler/issues/2259))
* `FIX`: correct Windows newlines being lost on paste ([#2280](https://github.com/camunda/camunda-modeler/issues/2280))
* `DEPS`: update to `dmn-js@11.0.1`

### Forms

* `FEAT`: register Camunda Modeler for `.form` files on Windows ([#2292](https://github.com/camunda/camunda-modeler/issues/2292))
* `FIX`: open fallback editor if schema opening fails ([#2294](https://github.com/camunda/camunda-modeler/issues/2294))

## 4.8.1

* `FIX`: pass flags to client correctly ([#2257](https://github.com/camunda/camunda-modeler/pull/2257))

## 4.8.0

### General

* `FEAT`: enable Camunda Cloud BPMN tab ([#2210](https://github.com/camunda/camunda-modeler/issues/2210))
* `FEAT`: enable telemetry for engine version of deployments ([#2219](https://github.com/camunda/camunda-modeler/issues/2219))
* `FEAT`: enable telemetry for usage of BPMN service tasks ([#2218](https://github.com/camunda/camunda-modeler/issues/2218))
* `FEAT`: show error notification if update check triggered by user fails ([#2086](https://github.com/camunda/camunda-modeler/issues/2086))
* `FIX`: set minimum window size ([#2235](https://github.com/camunda/camunda-modeler/pull/2235))
* `FIX`: fix deployments of DMN to Camunda Platform ([#2241](https://github.com/camunda/camunda-modeler/issues/2241))
* `FIX`: fix error that appears when starting process instance ([#2249](https://github.com/camunda/camunda-modeler/issues/2249))
* `CHORE`: update to electron\@12 ([#1926](https://github.com/camunda/camunda-modeler/issues/1926))
* `CHORE`: update to zeebe-node\@1.0.0 ([#2169](https://github.com/camunda/camunda-modeler/issues/2169))

### BPMN

* `FEAT`: automatically scroll canvas when creating new elements ([#1249](https://github.com/camunda/camunda-modeler/issues/1249))
* `FIX`: copy root element references on replace ([#2185](https://github.com/camunda/camunda-modeler/issues/2185))
* `FIX`: do not override existing documentation ([#1682](https://github.com/camunda/camunda-modeler/issues/1682))
* `FIX`: reconnect message flows when collapsing participant ([#1651](https://github.com/camunda/camunda-modeler/issues/1651))
* `FIX`: don't change namespace prefixes of the xml namespace ([#2214](https://github.com/camunda/camunda-modeler/issues/2214))

## 4.7.0

### General

* `FEAT`: set `enable-duplicate-filtering` flag on deployments ([#2160](https://github.com/camunda/camunda-modeler/issues/2160))
* `FEAT`: allow deployments with multiple files ([#2131](https://github.com/camunda/camunda-modeler/issues/2131))
* `FEAT`: introduce status bar ([#2175](https://github.com/camunda/camunda-modeler/issues/2175))
* `FEAT`: introduce engine profile overlay ([#2187](https://github.com/camunda/camunda-modeler/issues/2187))
* `CHORE`: capture used Camunda Forms in telemetry events ([#2188](https://github.com/camunda/camunda-modeler/issues/2188))

### BPMN

* `FEAT`: support creating, opening, deploying and starting Zeebe BPMN diagrams ([#2029](https://github.com/camunda/camunda-modeler/issues/2029))
* `FEAT`: support non-default element templates for root elements ([#2121](https://github.com/camunda/camunda-modeler/issues/2121))
* `FEAT`: support BPMN Errors on external service tasks ([#2070](https://github.com/camunda/camunda-modeler/issues/2070))
* `FEAT`: introduce JSON Schema versioning via `$schema` property ([#2083](https://github.com/camunda/camunda-modeler/issues/2083))
* `FEAT`: validate element templates against JSON Schema ([#2159](https://github.com/camunda/camunda-modeler/issues/2159))
* `FEAT`: enable connection tool for text annotations ([#2042](https://github.com/camunda/camunda-modeler/issues/2042))
* `FIX`: support property panel plugins again ([#1992](https://github.com/camunda/camunda-modeler/issues/1992))
* `FIX`: consistently validate element templates in catalog ([#2110](https://github.com/camunda/camunda-modeler/issues/2110))
* `FIX`: improve error messages for element templates ([#2111](https://github.com/camunda/camunda-modeler/issues/2111))
* `FIX`: correctly display empty versions for element templates ([#2101](https://github.com/camunda/camunda-modeler/issues/2101))
* `FIX`: correctly display long variable names in the overview ([#2166](https://github.com/camunda/camunda-modeler/issues/2166))
* `CHORE`: disable Zeebe BPMN editor with flag ([#2171](https://github.com/camunda/camunda-modeler/pull/2171))
* `CHORE`: bump to `bpmn-js@8.3.0`
* `CHORE`: bump to `bpmn-js-properties-panel@0.42.0`

### DMN

* `CHORE`: bump to `dmn-js@10.1.0`

### Forms

* `FEAT`: add Forms editor ([#2149](https://github.com/camunda/camunda-modeler/issues/2149))
* `FEAT`: allow opening `.form` files ([#2108](https://github.com/camunda/camunda-modeler/issues/2108))
* `FEAT`: allow deploying Forms alongside BPMN diagrams ([#2100](https://github.com/camunda/camunda-modeler/issues/2100))

## 4.6.0

### General

* `FEAT`: offer `Check for Update` option in the menu ([#2010](https://github.com/camunda/camunda-modeler/issues/2010))
* `FEAT`: open fullscreen with Ctrl+Cmd+F on Mac ([#2050](https://github.com/camunda/camunda-modeler/issues/2050))
* `FIX`: correctly log filepath when logging a `write file` error ([#2079](https://github.com/camunda/camunda-modeler/pull/2079))
* `CHORE`: bump to `diagram-js@7.2.0`. Auxiliary mouse button events will now be passed as `element.*` mouse events to components (incl. components provided via plugins). You must filter your event listeners to prevent reactions to these events ([`1063f7c18`](https://github.com/bpmn-io/diagram-js/commit/1063f7c18474096d3d7c9e400ce82a1bf762a157)).

### BPMN

* `FEAT`: add `Participant-` prefix to respective `ID` and `Name` textInput labels to improve clarity ([#1738](https://github.com/camunda/camunda-modeler/issues/1738))
* `CHORE`: capture userTask formKey metrics on `diagram open` and `diagram deploy` events ([#2062](https://github.com/camunda/camunda-modeler/issues/2062))
* `FIX`: only catch DeploymentErrors and re-throw others when deploying a process or starting process instance fails ([#2078](https://github.com/camunda/camunda-modeler/issues/2078))
* `FIX`: only allow cancel boundary event on transaction subprocesses ([#2026](https://github.com/camunda/camunda-modeler/issues/2026))
* `CHORE`: bump to `bpmn-js@8.2.0`
* `CHORE`: bump to `bpmn-js-properties-panel@0.40.0`
* `CHORE`: bump to `@bpmn-io/extract-process-variables@0.4.0`

### DMN

* `FEAT`: add hand tool to DRD view ([#614](https://github.com/bpmn-io/dmn-js/pull/614))
* `FIX`: don't lose association when switching from DRD to DMN view ([#1874](https://github.com/camunda/camunda-modeler/issues/1874) and [#2052](https://github.com/camunda/camunda-modeler/issues/2052))
* `CHORE`: bump to `dmn-js@10.1.0-alpha.2`

## 4.5.0

### BPMN

* `FEAT`: support versioned element templates ([#1969](https://github.com/camunda/camunda-modeler/issues/1969))
* `FEAT`: support modeling `isCollection` marker for Data Object ([#381](https://github.com/bpmn-io/bpmn-js/issues/381))
* `FEAT`: support multi-instance pools ([#533](https://github.com/bpmn-io/bpmn-js/issues/533))
* `FEAT`: allow to replace Data Store Reference with Data Object Reference ([#1372](https://github.com/bpmn-io/bpmn-js/issues/1372))
* `FIX`: display local element templates in catalog ([#2012](https://github.com/camunda/camunda-modeler/issues/2012))
* `FIX`: allow to set external resource script value for I/O parameters ([#2007](https://github.com/camunda/camunda-modeler/issues/2007))
* `FIX`: escape element template properties ([#2031](https://github.com/camunda/camunda-modeler/issues/2031))
* `FIX`: rename Collapsed Pool to Empty Pool ([#2022](https://github.com/camunda/camunda-modeler/issues/2022))
* `FIX`: immediately activate tools when shortcut is pressed ([#664](https://github.com/camunda/camunda-modeler/issues/664), [#1229](https://github.com/camunda/camunda-modeler/issues/1229))
* `CHORE`: update to `bpmn-js@8.0.0`

### DMN

* `FEAT`: make decision table headers and the first column sticky ([#269](https://github.com/bpmn-io/dmn-js/issues/269))
* `FIX`: fix literal expression styles ([#2019](https://github.com/camunda/camunda-modeler/issues/2019))
* `CHORE`: update to `dmn-js@10.0.0`

### CMMN

* `FEAT`: set default value for `disable-cmmn`-flag to `true` ([#2036](https://github.com/camunda/camunda-modeler/issues/2036)); run with `--no-disable-cmmn` or edit your local [flags.json](https://docs.camunda.io/docs/components/modeler/desktop-modeler/flags/) to re-enable CMMN editor

## 4.4.0

### General

* `FEAT`: enable `Backspace` on MacOS for element removal ([#1989](https://github.com/camunda/camunda-modeler/issues/1989))
* `FEAT`: enable `SHIFT + click` for multi-selection ([#1964](https://github.com/camunda/camunda-modeler/issues/1964))
* `FIX`: correct switching between diagram and XML ([#1925](https://github.com/camunda/camunda-modeler/issues/1925))
* `CHORE`: capture deployment and process variables in telemetry events
* `CHORE`: bump to `bpmn-js@7.4.0`
* `CHORE`: bump to `dmn-js@9.4.0`
* `CHORE`: bump to `diagram-js@6.8.0`
* `CHORE`: bump to `bpmn-js-properties-panel@0.37.5`

### BPMN

* `FIX`: correct removal of element templates from events ([#1990](https://github.com/camunda/camunda-modeler/issues/1990))
* `FIX`: unlink incompatible element template during replace ([#1961](https://github.com/camunda/camunda-modeler/issues/1961))
* `FIX`: store variable events for conditional events in the correct property ([#836](https://github.com/camunda/camunda-modeler/issues/836))
* `FIX`: re-enable `entriesVisible` property of element templates ([#1975](https://github.com/camunda/camunda-modeler/issues/1975))
* `FIX`: correct label of start instance tool ([#1777](https://github.com/camunda/camunda-modeler/issues/1777))

### DMN

* `FEAT`: allow decision table name to take empty space
* `FEAT`: focus cell in newly added row ([#928](https://github.com/camunda/camunda-modeler/issues/928))
* `FIX`: render hit policy drop down in the correct location

## 4.3.0

### General

* `FEAT`: add modal menu to search and use element templates ([#1890](https://github.com/camunda/camunda-modeler/issues/1890))
* `FEAT`: introduce application, linking and unlinking logic of element templates ([#1889](https://github.com/camunda/camunda-modeler/issues/1889))
* `FIX`: prevent stopPropagation errors in iOS devices ([`0fbbbd1e`](https://github.com/bpmn-io/diagram-js/commit/0fbbbd1e439007d80c47158aa8774be3a592f936))
* `CHORE`: bump to `bpmn-js@7.3.1`
* `CHORE`: bump to `dmn-js@9.3.1`
* `CHORE`: bump to `diagram-js@6.7.1`
* `CHORE`: bump to `bpmn-js-properties-panel@0.37.1`

### BPMN

* `FEAT`: detect process variables in properties panel ([#348](https://github.com/bpmn-io/bpmn-js-properties-panel/issues/348))
* `FEAT`: improve input/output mapping GUI component in properties panel ([#349](https://github.com/bpmn-io/bpmn-js-properties-panel/issues/349))
* `FEAT`: add process variable overview for (sub) processes in properties panel ([#343](https://github.com/bpmn-io/bpmn-js-properties-panel/issues/343))
* `FEAT`: add process variable typeAhead functionality in properties panel ([#345](https://github.com/bpmn-io/bpmn-js-properties-panel/issues/345))
* `FEAT`: adjust element template view in properties panel ([#358](https://github.com/bpmn-io/bpmn-js-properties-panel/issues/358))
* `FEAT`: crop descriptions in properties panel ([#369](https://github.com/bpmn-io/bpmn-js-properties-panel/issues/369))
* `FIX`: allow incoming message flows to boundary message events ([#1919](https://github.com/camunda/camunda-modeler/issues/1919))

### DMN

* `FEAT`: improve intuition by recognising input and output columns ([#552](https://github.com/bpmn-io/dmn-js/issues/552))
* `FEAT`: move bpmn.io logo ([#573](https://github.com/bpmn-io/dmn-js/issues/573))
* `FIX`: clear clipboard after pasting ([#1246](https://github.com/camunda/camunda-modeler/issues/1246))
* `FIX`: handle undoing decision name direct editing ([#1912](https://github.com/camunda/camunda-modeler/issues/1912))
* `FIX`: handle undoing decision table components ([#1923](https://github.com/camunda/camunda-modeler/issues/1923))
* `FIX`: handle undoing deletion of decision elements ([#1921](https://github.com/camunda/camunda-modeler/issues/1921))
* `FIX`: handle undoing via keyboard ([#1922](https://github.com/camunda/camunda-modeler/issues/1922))
* `FIX`: save the size of resized text annotations in DRD ([#1941](https://github.com/camunda/camunda-modeler/issues/1941))
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
* `FEAT`: disable collapsing sub process ([`a2c008d0`](https://github.com/camunda/camunda-modeler/commit/a2c008d09effe200c857ec36a20889ae4dde598a))
* `FIX`: render colored BPMN groups ([#1246](https://github.com/bpmn-io/bpmn-js/pull/1246))

#### DMN

* `FEAT(decision-table)`: preserve aggregation when COLLECT is selected again
* `FEAT(decision-table)`: allow aggreation to be cleared from dropdown ([#370](https://github.com/bpmn-io/dmn-js/issues/370), [#389](https://github.com/bpmn-io/dmn-js/issues/389))
* `FEAT(decision-table)`: use JUEL as the default input expression language ([#405](https://github.com/bpmn-io/dmn-js/issues/405))
* `FEAT(decision-table)`: only allow standardized hit policy values
* `FIX(decision-table)`: correctly handle value erasing ([#826](https://github.com/camunda/camunda-modeler/issues/826))
* `FIX(decision-table)`: correctly display simple mode edit control when cell selection changes ([#341](https://github.com/bpmn-io/dmn-js/issues/341))
* `FIX(decision-table)`: do not close input on user selection ([#421](https://github.com/bpmn-io/dmn-js/issues/421))
* `FIX(decision-table)`: do not navigate when clearing pre-defined hints ([#431](https://github.com/bpmn-io/dmn-js/issues/431))
* `FIX(decision-table)`: prevent context menu jump in larger tables
* `FIX(decision-table)`: do not close context on user selection

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
  * \<tab.saved> ([#1498](https://github.com/camunda/camunda-modeler/pull/1498))
  * \<tab.activeSheetChanged> ([`403afc`](https://github.com/camunda/camunda-modeler/commit/403afc920cf6c745816c3cd456baeb99830b25ed))
  * \<app.activeTabChanged> ([`403afc`](https://github.com/camunda/camunda-modeler/commit/403afc920cf6c745816c3cd456baeb99830b25ed))
  * \<bpmn.modeler.configure> ([#1499](https://github.com/camunda/camunda-modeler/issues/1499))
  * \<bpmn.modeler.created> ([#1500](https://github.com/camunda/camunda-modeler/issues/1500))

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
* `CHORE`: add THIRD\_PARTY\_NOTICES ([#1233](https://github.com/camunda/camunda-modeler/issues/1233))
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
