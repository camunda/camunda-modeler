> :warning: This feature got introduced in Camunda Modeler `v3.0.0` and __may be subject to change in the future__.


# Flags

Flags will allow you to control the availability of certain features within the application.


## Configuring Flags

You may configure flags in a `flags.json` file or pass them via CLI (Command Line Interface).

### Configure in `flags.json`

Place a `flags.json` file inside the `resources` folder of your local [`{USER_DATA}`](../search-paths#user-data-directory) or [`{APP_HOME}`](../search-paths#application-home-directory) directory to persist them.

### Configure via CLI

Pass flags via the command line when starting the application. 

```
camunda-modeler --disable-plugins
```

Flags passed as command line arguments take precedence over those configured via a configuration file.


## Available Flags

| flag | default value |
| ------------- | ------------- |
| "disable-plugins"  | false  |
| "disable-adjust-origin"  | false  |
| "disable-cmmn" | false |
| "disable-dmn" | false |
| "single-instance" | false |
| "user-data-dir" | [Electron default](../search-paths) |


## Examples

### BPMN-only Mode

To disable the CMMN and DMN editing capabilities of the App, configure your `flags.json` like below:

```js
{
    "disable-cmmn": true,
    "disable-dmn": true
}
```

As a result, the app will only allow users to model BPMN diagrams.

![BPMN only mode](./bpmn-only.png)
