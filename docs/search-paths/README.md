# Search Paths

Features like [Element Templates](../element-templates) and [Plugins](../plugins) allow you to add your own resources to the Camunda Modeler. For these resources to be found, they have to be in one of two directories depending on how local or global you want them to be.

## App Data Directory

The `resources` directory relative to the directory containing the Camunda Modeler executable file. In our documentation we refer to it as `{APP_DATA_DIRECTORY}`.

Resources in the app data directory will be found by any local Camunda Modeler instance.

### Example (Windows):

```
└── camunda-modeler-3.5.0-win-x64
    ├── Camunda Modeler.exe
    └── resources
        ├── element-templates
        |   └── my-element-templates.json
        └── plugins
            └── my-plugin
                └── index.js
```

## User Data Directory

The `camunda-modeler/resources` directory relative to the per-user application data directory, which by default points to:

* `%APPDATA%` on [Windows](https://www.pcworld.com/article/2690709/whats-in-the-hidden-windows-appdata-folder-and-how-to-find-it-if-you-need-it.html)
* `$XDG_CONFIG_HOME` or `~/.config` on [Linux](https://wiki.archlinux.org/index.php/XDG_user_directories)
* `~/Library/Application Support` on macOS

In our documentation we refer to it as `{USER_DATA_DIRECTORY}`.

Resources in the user data directory will be found by all Camunda Modeler instances.

### Example (Windows):

```
└── AppData
    └── Roaming
        └── camunda-modeler
            └── resources
                ├── element-templates
                |   └── my-element-templates.json
                └── plugins
                    └── my-plugin
                        └── index.js
```

It is possible to change the user data directory using the `--user-data-dir` option via when starting the Camunda Modeler from the command line. Refer to the [flags documentation](../flags) on how to configure the application with a flags file.
