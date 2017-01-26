#!/bin/bash
echo "Uninstalling icons and desktop entry..."
xdg-desktop-menu uninstall camunda-modeler.desktop
xdg-icon-resource uninstall --size  16 camunda-modeler
xdg-icon-resource uninstall --size  48 camunda-modeler
xdg-icon-resource uninstall --size 128 camunda-modeler
echo "Unregistering mime types..."
xdg-mime uninstall camunda-modeler-mime-types.xml
echo "done."
