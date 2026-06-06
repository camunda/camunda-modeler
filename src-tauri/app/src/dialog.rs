// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! Native dialogs + shell integration, the Tauri-layer port of `app/lib/dialog.js`
//! plus the `external:open-url` / `dialog:open-file-explorer` /
//! `system-clipboard:write-text` handlers from `app/lib/index.js`.
//!
//! File open/save use `tauri-plugin-dialog` (rfd) and faithfully reproduce
//! `Dialog#showOpenDialog` / `#showSaveDialog`, including the persisted
//! `defaultPath` (config) and the `activeFile`/`file.path` directory override the
//! Electron `index.js` handlers applied before delegating. Message boxes
//! (`dialog:show`) map the renderer's `{ id, label }` buttons onto the native
//! message dialog (≤ 3 buttons) and translate the result back to the button id
//! the renderer expects.
//!
//! These run from the async `ipc_dispatch` command (never the main thread), so
//! the plugin's `blocking_*` calls are safe.

use std::path::{Path, PathBuf};

use serde_json::{json, Value};
use tauri::{Manager, WebviewWindow};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_dialog::{
    DialogExt, MessageDialogButtons, MessageDialogKind, MessageDialogResult,
};
use tauri_plugin_opener::OpenerExt;

use crate::ipc::AppState;

/// A renderer button `{ id, label }`.
struct Button {
    id: String,
    label: String,
}

/// `dialog:open-files` -> `string[]` of selected paths (`[]` when cancelled).
pub fn open_files(window: &WebviewWindow, options: &Value) -> Value {
    let properties = string_array(options.get("properties"))
        .unwrap_or_else(|| vec!["openFile".into(), "multiSelections".into()]);

    let title = options
        .get("title")
        .and_then(Value::as_str)
        .unwrap_or("Open File");

    // `index.js` overrides defaultPath with the active file's directory; else the
    // renderer-supplied defaultPath; else the persisted/desktop default.
    let active_dir = options
        .get("activeFile")
        .and_then(|file| file.get("path"))
        .and_then(Value::as_str)
        .map(dirname);

    let default_dir = active_dir
        .or_else(|| {
            options
                .get("defaultPath")
                .and_then(Value::as_str)
                .map(PathBuf::from)
        })
        .unwrap_or_else(|| persisted_default_path(window));

    let mut builder = window
        .app_handle()
        .dialog()
        .file()
        .set_directory(&default_dir)
        .set_title(title);

    builder = apply_filters(builder, options);

    let is_directory = properties.iter().any(|p| p == "openDirectory");
    let multi = properties.iter().any(|p| p == "multiSelections");

    let selected = match (is_directory, multi) {
        (true, true) => builder.blocking_pick_folders(),
        (true, false) => builder.blocking_pick_folder().map(|p| vec![p]),
        (false, true) => builder.blocking_pick_files(),
        (false, false) => builder.blocking_pick_file().map(|p| vec![p]),
    };

    let paths: Vec<String> = selected
        .unwrap_or_default()
        .into_iter()
        .filter_map(|file_path| file_path.into_path().ok())
        .map(|path| path.to_string_lossy().into_owned())
        .collect();

    if let Some(first) = paths.first() {
        let next = if properties.iter().any(|p| p == "openFile") {
            dirname(first)
        } else {
            PathBuf::from(first)
        };

        set_default_path(window, &next);
    }

    json!(paths)
}

/// `dialog:save-file` -> the chosen path string, or `null` when cancelled.
pub fn save_file(window: &WebviewWindow, options: &Value) -> Value {
    let file = options.get("file").cloned().unwrap_or(Value::Null);

    let raw_name = file.get("name").and_then(Value::as_str).unwrap_or("");

    // Strip the extension, then re-append the first filter's default extension
    // (mirrors dialog.js, which avoids extension-less saves on Linux).
    let mut name = Path::new(raw_name)
        .file_stem()
        .map(|stem| stem.to_string_lossy().into_owned())
        .unwrap_or_default();

    if let Some(extension) = first_filter_extension(options) {
        name = format!("{name}.{extension}");
    }

    let file_dir = file
        .get("path")
        .and_then(Value::as_str)
        .map(dirname)
        .or_else(|| {
            options
                .get("defaultPath")
                .and_then(Value::as_str)
                .map(PathBuf::from)
        })
        .unwrap_or_else(|| persisted_default_path(window));

    let title = options
        .get("title")
        .and_then(Value::as_str)
        .map(String::from)
        .unwrap_or_else(|| format!("Save \"{name}\" as..."));

    let mut builder = window
        .app_handle()
        .dialog()
        .file()
        .set_directory(&file_dir)
        .set_file_name(&name)
        .set_title(title);

    builder = apply_filters(builder, options);

    match builder.blocking_save_file().and_then(|fp| fp.into_path().ok()) {
        Some(path) => {
            set_default_path(window, &dirname(&path.to_string_lossy()));
            json!(path.to_string_lossy())
        },
        None => Value::Null,
    }
}

/// `dialog:show` -> `{ button: <id> }` for the clicked button.
pub fn show(window: &WebviewWindow, options: &Value) -> Value {
    let buttons = parse_buttons(options);

    let message = options.get("message").and_then(Value::as_str).unwrap_or("");
    let detail = options.get("detail").and_then(Value::as_str).unwrap_or("");

    let full_message = if detail.is_empty() {
        message.to_string()
    } else if message.is_empty() {
        detail.to_string()
    } else {
        format!("{message}\n\n{detail}")
    };

    let kind = match options.get("type").and_then(Value::as_str) {
        Some("error") => MessageDialogKind::Error,
        Some("warning") => MessageDialogKind::Warning,
        _ => MessageDialogKind::Info,
    };

    let dialog_buttons = match buttons.as_slice() {
        [a] => MessageDialogButtons::OkCustom(a.label.clone()),
        [a, b] => MessageDialogButtons::OkCancelCustom(a.label.clone(), b.label.clone()),
        [a, b, c, ..] => {
            MessageDialogButtons::YesNoCancelCustom(a.label.clone(), b.label.clone(), c.label.clone())
        },
        [] => MessageDialogButtons::OkCustom("Close".into()),
    };

    let mut builder = window
        .app_handle()
        .dialog()
        .message(full_message)
        .kind(kind)
        .buttons(dialog_buttons);

    if let Some(title) = options.get("title").and_then(Value::as_str) {
        builder = builder.title(title);
    }

    let result = builder.blocking_show_with_result();

    json!({ "button": result_to_button_id(&result, &buttons) })
}

/// `dialog:open-file-error` -> delegates to [`show`] with an error layout,
/// mirroring `Dialog#showOpenFileErrorDialog`.
pub fn open_file_error(window: &WebviewWindow, options: &Value) -> Value {
    let name = options.get("name").and_then(Value::as_str).unwrap_or("");

    let message = options
        .get("message")
        .and_then(Value::as_str)
        .map(String::from)
        .unwrap_or_else(|| format!("Unable to open \"{name}\""));

    let detail = options.get("detail").cloned().unwrap_or(Value::Null);

    show(
        window,
        &json!({
            "type": "error",
            "title": "File Open Error",
            "buttons": [ { "id": "cancel", "label": "Close" } ],
            "message": message,
            "detail": detail
        }),
    )
}

/// `dialog:open-file-explorer` -> reveal the path in the OS file manager.
pub fn open_file_explorer(window: &WebviewWindow, options: &Value) -> Value {
    if let Some(path) = options.get("path").and_then(Value::as_str) {
        let _ = window.app_handle().opener().reveal_item_in_dir(path);
    }

    Value::Null
}

/// `external:open-url` -> open a URL in the default browser.
pub fn open_url(window: &WebviewWindow, options: &Value) -> Value {
    if let Some(url) = options.get("url").and_then(Value::as_str) {
        let _ = window
            .app_handle()
            .opener()
            .open_url(url, None::<&str>);
    }

    Value::Null
}

/// `system-clipboard:write-text` -> write text to the system clipboard.
pub fn write_clipboard_text(window: &WebviewWindow, options: &Value) -> Value {
    if let Some(text) = options.get("text").and_then(Value::as_str) {
        let _ = window.app_handle().clipboard().write_text(text.to_string());
    }

    Value::Null
}

// -- helpers ----------------------------------------------------------------

type FileDialogBuilder = tauri_plugin_dialog::FileDialogBuilder<tauri::Wry>;

/// Apply Electron-style `filters` (`[{ name, extensions: [..] }]`) to a file
/// dialog builder.
fn apply_filters(mut builder: FileDialogBuilder, options: &Value) -> FileDialogBuilder {
    if let Some(filters) = options.get("filters").and_then(Value::as_array) {
        for filter in filters {
            let name = filter.get("name").and_then(Value::as_str).unwrap_or("");

            let extensions: Vec<&str> = filter
                .get("extensions")
                .and_then(Value::as_array)
                .map(|exts| exts.iter().filter_map(Value::as_str).collect())
                .unwrap_or_default();

            if !extensions.is_empty() {
                builder = builder.add_filter(name, &extensions);
            }
        }
    }

    builder
}

fn parse_buttons(options: &Value) -> Vec<Button> {
    let buttons: Vec<Button> = options
        .get("buttons")
        .and_then(Value::as_array)
        .map(|arr| {
            arr.iter()
                .map(|button| Button {
                    id: button.get("id").and_then(Value::as_str).unwrap_or("").to_string(),
                    label: button.get("label").and_then(Value::as_str).unwrap_or("").to_string(),
                })
                .collect()
        })
        .unwrap_or_default();

    if buttons.is_empty() {
        vec![Button { id: "close".into(), label: "Close".into() }]
    } else {
        buttons
    }
}

/// Translate a native dialog result back to the renderer button id. With custom
/// labels rfd returns `Custom(label)`, matched by label; a dismissal maps to the
/// `cancel` button (or the last one), mirroring Electron's `cancelId`.
fn result_to_button_id(result: &MessageDialogResult, buttons: &[Button]) -> String {
    let cancel_id = || {
        buttons
            .iter()
            .find(|button| button.id == "cancel")
            .or_else(|| buttons.last())
            .map(|button| button.id.clone())
            .unwrap_or_else(|| "cancel".into())
    };

    match result {
        MessageDialogResult::Custom(label) => buttons
            .iter()
            .find(|button| &button.label == label)
            .map(|button| button.id.clone())
            .unwrap_or_else(cancel_id),
        MessageDialogResult::Ok | MessageDialogResult::Yes => buttons
            .first()
            .map(|button| button.id.clone())
            .unwrap_or_else(cancel_id),
        MessageDialogResult::No => buttons
            .get(1)
            .map(|button| button.id.clone())
            .unwrap_or_else(cancel_id),
        MessageDialogResult::Cancel => cancel_id(),
    }
}

fn string_array(value: Option<&Value>) -> Option<Vec<String>> {
    value.and_then(Value::as_array).map(|arr| {
        arr.iter()
            .filter_map(Value::as_str)
            .map(String::from)
            .collect()
    })
}

fn first_filter_extension(options: &Value) -> Option<String> {
    options
        .get("filters")
        .and_then(Value::as_array)
        .and_then(|filters| filters.first())
        .and_then(|filter| filter.get("extensions"))
        .and_then(Value::as_array)
        .and_then(|exts| exts.first())
        .and_then(Value::as_str)
        .filter(|ext| *ext != "*")
        .map(String::from)
}

fn dirname(path: &str) -> PathBuf {
    Path::new(path)
        .parent()
        .map(Path::to_path_buf)
        .unwrap_or_else(|| PathBuf::from(path))
}

/// `config.get('defaultPath', userDesktopPath)`, falling back to the desktop dir.
fn persisted_default_path(window: &WebviewWindow) -> PathBuf {
    let desktop = window
        .app_handle()
        .path()
        .desktop_dir()
        .unwrap_or_else(|_| PathBuf::from("."));

    let state = window.state::<AppState>();

    state
        .config
        .get("defaultPath", &[json!(desktop.to_string_lossy())])
        .ok()
        .and_then(|value| value.as_str().map(PathBuf::from))
        .unwrap_or(desktop)
}

/// `Dialog#setDefaultPath`: persist the directory for the next dialog.
fn set_default_path(window: &WebviewWindow, path: &Path) {
    let state = window.state::<AppState>();

    let _ = state
        .config
        .set("defaultPath", json!(path.to_string_lossy()));
}
