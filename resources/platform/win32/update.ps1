# Check if the correct number of arguments is provided
if ($args.Count -ne 2) {
    Write-Host "Usage: `"$($MyInvocation.MyCommand.Name)`" path_to_zip_file target_extraction_path"
    exit 1
}

# Assign the arguments to variables
$ZIPFILE = $args[0]
$TARGET_PATH = $args[1]

# Check if the zip file exists
if (-not (Test-Path -Path $ZIPFILE -PathType Leaf)) {
    Write-Host "Error: File '$ZIPFILE' does not exist."
    exit 1
}

# Check if the target path exists; if not, create it
if (-not (Test-Path -Path $TARGET_PATH)) {
    Write-Host "Target path '$TARGET_PATH' does not exist. Creating it now..."
    New-Item -ItemType Directory -Path $TARGET_PATH | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to create target directory."
        exit 1
    }
}

# Unzip the file to the target path
$TempExtractionPath = Join-Path $TARGET_PATH "temp_extract"
New-Item -ItemType Directory -Path $TempExtractionPath -Force | Out-Null
Expand-Archive -Path $ZIPFILE -DestinationPath $TempExtractionPath -Force

# Move the contents from the subdirectory (stripping off 1 leading component)
Get-ChildItem -Path (Join-Path $TempExtractionPath "*\*") |
    Move-Item -Destination $TARGET_PATH

# Check if unzip was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "Unzip successful."
} else {
    Write-Host "Error: Failed to unzip file."
    exit 1
}

# Optionally, remove the temporary directory if it is now empty
if (-not (Get-ChildItem -Path $TempExtractionPath)) {
    Remove-Item -Path $TempExtractionPath
}

# Execute the application inside the target path
& "$TARGET_PATH\camunda-modeler.exe"