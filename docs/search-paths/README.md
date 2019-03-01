# Search Paths

Inside the modeler we look inside different search paths to retrieve persistent application data or additional user resources, e.g. loading [Plugins](../plugins) or [Element Templates](../element-templates). The directories orientate on the [standard electron paths](https://github.com/electron/electron/blob/master/docs/api/app.md#appgetpathname).

## Application Home Directory

This is the installation directory of the application executable. Inside this documentation, we use the `{APP_HOME}` symbol to indicate the Application Home Directory.

## User Data Directory 

This is the per-user application data directory which differs across operating systems:

* **Windows**: `%APPDATA%/camunda-modeler`
* **Linux**: `$XDG_CONFIG_HOME/camunda-modeler` or `~/.config/camunda-modeler`
* **macOS**: `~/Library/Application Support/camunda-modeler`

If you don't know where to find these paths, learn more about Windows [`%APPDATA%`](https://www.howtogeek.com/318177/what-is-the-appdata-folder-in-windows/) and Linux [`$XDG_CONFIG_HOME`](https://wiki.archlinux.org/index.php/XDG_Base_Directory) directories.

Inside this documentation, we use the `{USER_DATA}` symbol to indicate the User Data Directory.