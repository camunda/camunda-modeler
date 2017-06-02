# Camunda Modeler XDG Scripts

The Camunda Modeler is shipped with shell scripts that register a
`*.desktop` file, icons and mime types. They use the xdg-utils
from https://www.freedesktop.org/ to do that in a standardized way
that is supported by all major Linux desktop environments. A script
for uninstalling is provided as well. The scripts are located in
the support path of the Camunda Modeler directory along with the
icon files and a mime type xml file.


### How to Register

./support/register.sh


### How to Unregister

./support/unregister.sh


### Resources

* https://www.freedesktop.org/wiki/Software/xdg-utils/