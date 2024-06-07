#!/bin/bash

# Check if the correct number of arguments is provided
if [ "$#" -ne 2 ]; then
  echo "Usage: $0 path_to_zip_file target_extraction_path"
  exit 1
fi

# Assign the arguments to variables
ZIPFILE="$1"
TARGET_PATH="$2"

# Check if the zip file exists
if [ ! -f "$ZIPFILE" ]; then
  echo "Error: File '$ZIPFILE' does not exist."
  exit 1
fi

# Check if the target path exists; if not, create it
if [ ! -d "$TARGET_PATH" ]; then
  echo "Target path '$TARGET_PATH' does not exist. Creating it now..."
  mkdir -p "$TARGET_PATH"
  if [ $? -ne 0 ]; then
    echo "Error: Failed to create target directory."
    exit 1
  fi
fi

# Unzip the file to the target path
tar -xzf "$ZIPFILE" --strip-components=1 -C "$TARGET_PATH"

# Check if unzip was successful
if [ $? -eq 0 ]; then
  echo "Unzip successful."
else
  echo "Error: Failed to unzip file."
  exit 1
fi

$TARGET_PATH/camunda-modeler

exit 0