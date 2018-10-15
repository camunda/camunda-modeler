@echo off
setlocal enabledelayedexpansion
set DIR=%~dp0

set IN_FILE=%DIR%\fileassoc.reg
set OUT_FILE=%DIR%\fileassoc_full_path.reg
set PLACEHOLDER=__CWD__

echo %IN_FILE%

rem move one level up
cd %DIR%
cd ..

set DIR=%cd%

echo %DIR%
set EXECUTABLE_DIR=!DIR:\=\\!
set EXECUTABLE_PATH=%EXECUTABLE_DIR%\\Zeebe Modeler.exe

echo "%EXECUTABLE_PATH%"

set OUTPUTLINE=

for /f "tokens=1,* delims=¶" %%A in ( '"type %IN_FILE%"') do (
	SET string=%%A

	SET modified=!string:%PLACEHOLDER%=%EXECUTABLE_PATH%!
	echo !modified! >> %OUT_FILE%
)

reg import %OUT_FILE%

del %OUT_FILE%