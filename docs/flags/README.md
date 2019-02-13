# Flags :flags:

Flags allow to disable several features inside the application.

## Available flags

Following flags are available:

- `disable-plugins`: Disabling use of plugins
- `disable-adjust-origin`: Disabling automatic adjustments to origin coordinates
- `disable-cmmn`: Disabling `CMMN-Editor`
- `disable-dmn`: Disabling `DMN-Editor`

All flags are _not_ set per default.

## Use a configuration file

One way to use flags persistently is to create a `flags.json` configuration file inside your user directory. Just modify the configuration file inside your local `{APP_DIRECTORY}/resources` or `{USER_DATA_DIRECTORY}/resources`  location. 

### BPMN-only mode example

One example of using the flags is the BPMN-only mode. To disable the `CMMN-` and `DMN-Editor`, simply modify the `flags.json` configuration file with

```js
{
    "disable-cmmn": true,
    "disable-dmn": true
}
```

![BPMN only mode](./bpmn-only.png)

## Use the CLI

Another way to enable feature toggles is simply using them while starting the application via command line on Windows and Linux. E.g. in the case of disabling the `DMN-Editor`, add the following argument to the start command:

```sh
$ camunda-modeler --disable-dmn
```