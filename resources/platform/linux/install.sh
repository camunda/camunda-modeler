#!/usr/bin/env sh

# -------------------------------------------------------
# A shell script that installs the camunda modeler and
#   provides a desktop shortcut
# Written by: Robert Van Voorhees
# Last updated on: 27 Oct 2016
# -------------------------------------------------------
#

echo "Install script for camunda-modeler"

read -p "Install for everyone (requires sudo)? [yN] " -n 1 -r
if [[ $REPLY =~ ^[Yy]$ ]]
then
  if [ -d "/opt/camunda-modeler" ]; then
    echo "Directory already exists, please remove previous install before installing."
    exit 1
  fi
  sudo -v
  if [ $? -eq 0 ]; then
    echo "Installing to /opt/camunda-modeler"
  else
    echo "Unable to get sudo access.  Exiting."
    exit 1
  fi
  sudo mv ../camunda-modeler /opt/
  sudo ln -sf /opt/camunda-modeler/camunda-modeler.desktop /usr/share/applications/camunda-modeler.desktop
else
  if [ -d "$HOME/camunda-modeler" ]; then
    echo "Directory already exists, please remove previous install before installing."
    exit 1
  fi
  mv ../camunda-modeler $HOME/
  sed -i "s|/opt/camunda-modeler|$HOME|g" $HOME/camunda-modeler/camunda-modeler.desktop
  ln -sf $HOME/camunda-modeler/camunda-modeler.desktop $HOME/.local/share/applications/camunda-modeler.desktop
fi
