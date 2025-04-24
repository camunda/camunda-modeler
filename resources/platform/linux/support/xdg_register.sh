#!/bin/bash
#
# Resolve the location of the Camunda Modeler installation.
# This includes resolving any symlinks.

PRG=$0
while [ -h "$PRG" ]; do
    ls=`ls -ld "$PRG"`
    link=`expr "$ls" : '^.*-> \(.*\)$' 2>/dev/null`
    if expr "$link" : '^/' 2> /dev/null >/dev/null; then
        PRG="$link"
    else
        PRG="`dirname "$PRG"`/$link"
    fi
done

CAMUNDA_MODELER_BIN=`dirname "$PRG"`

# absolutize dir
oldpwd=`pwd`
cd "${CAMUNDA_MODELER_BIN}"
cd ".."
CAMUNDA_MODELER_BIN=`pwd`
cd "${oldpwd}"

ICON_NAME=camunda-modeler
TMP_DIR=`mktemp --directory`
DESKTOP_FILE=$TMP_DIR/camunda-modeler.desktop
cat "$CAMUNDA_MODELER_BIN/support/camunda-modeler.desktop" > $DESKTOP_FILE

desktop-file-edit \
  --set-key="Path" --set-value="$CAMUNDA_MODELER_BIN" \
  "$DESKTOP_FILE"

desktop-file-validate "$DESKTOP_FILE"

# seems necessary to refresh immediately:
chmod 644 $DESKTOP_FILE

echo "Installing icons..."
xdg-icon-resource install --size  16 "$CAMUNDA_MODELER_BIN/support/icon_16.png"  $ICON_NAME
xdg-icon-resource install --size  48 "$CAMUNDA_MODELER_BIN/support/icon_48.png"  $ICON_NAME
xdg-icon-resource install --size 128 "$CAMUNDA_MODELER_BIN/support/icon_128.png" $ICON_NAME

echo "Installing desktop file..."
xdg-desktop-menu install $DESKTOP_FILE

echo "Registering mime types..."
xdg-mime install "$CAMUNDA_MODELER_BIN/support/mime-types.xml"

rm $DESKTOP_FILE
rm -R $TMP_DIR

echo "Done."
