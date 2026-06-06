// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! Effectful/stateful IPC handled in the Tauri layer.
//!
//! Pure, stateless events (the file-system slice) live in `modeler-backend` and
//! are reached via the fallback at the bottom. Events that need persisted state
//! (config, workspace) or a webview effect (`client:ready` -> emit
//! `client:started`) are handled here, where we hold [`AppState`] (the persisted
//! [`Config`]) and the window. Boot-path shapes were taken from the renderer
//! startup map (`client/src/app/AppParent.js`, `client/src/app/RecentTabs.js`).

use std::path::Path;
use std::sync::Mutex;

use serde_json::{json, Value};
use tauri::{Emitter, Manager, WebviewWindow};

use modeler_backend::{workspace, Config, FileContext, IpcError};

/// In-process backend state: the persisted [`Config`] router (`config.json`,
/// `settings.json`, `.editorid`) rooted at the resolved user-data directory.
pub struct AppState {
    pub config: Config,
}

impl AppState {
    /// Build the state rooted at `user_path`. The Tauri layer resolves and
    /// creates that directory before constructing this.
    pub fn new(user_path: &Path) -> Self {
        AppState {
            config: Config::new(user_path),
        }
    }
}

/// First argument as an object (dialog/shell handlers take a single options
/// object), defaulting to `{}`.
fn arg0(args: &[Value]) -> Value {
    args.first().cloned().unwrap_or_else(|| json!({}))
}

/// Lock the managed [`FileContext`] (the file-context IPC handlers all mutate
/// it).
fn file_context<'a>(window: &'a WebviewWindow) -> std::sync::MutexGuard<'a, FileContext> {
    window
        .state::<Mutex<FileContext>>()
        .inner()
        .lock()
        .expect("file context mutex poisoned")
}

/// `options.filePath` from an add-root/remove-root request object.
fn file_path_field(options: &Value) -> String {
    options
        .get("filePath")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string()
}

/// Optional `options.processor` id from a file-opened/file-updated request.
fn processor_option(options: Option<&Value>) -> Option<String> {
    options
        .and_then(|options| options.get("processor"))
        .and_then(Value::as_str)
        .map(str::to_string)
}

/// Serialize a parity-shaped backend error into the `{ message, code, ... }`
/// object the renderer expects (the same shape Electron delivered).
fn to_error_value(err: IpcError) -> Value {
    serde_json::to_value(err).unwrap_or(Value::Null)
}

/// `os.info` is computed in the Tauri layer because it needs host APIs; it
/// mirrors Electron's `OSInfoProvider` (`{ platform, release }`) using Node
/// platform names and the kernel release string.
fn os_info() -> Value {
    json!({
        "platform": crate::node_platform(),
        "release": sysinfo::System::kernel_version().unwrap_or_default(),
    })
}

/// Route a contract event, handling the stateful/effectful ones here and
/// delegating everything else to the pure backend.
pub fn handle(window: &WebviewWindow, event: &str, args: &[Value]) -> Result<Value, Value> {
    let state = window.state::<AppState>();

    match event {

        // config:get(key, ...args) -> provider value (args[0] is the default for
        // the default provider). os.info is intercepted here; everything else is
        // routed by the persisted Config.
        "config:get" => {
            let key = args.first().and_then(Value::as_str).unwrap_or_default();

            if key == "os.info" {
                return Ok(os_info());
            }

            state
                .config
                .get(key, args.get(1..).unwrap_or(&[]))
                .map_err(to_error_value)
        },

        // config:set(key, value) -> null (the Electron providers return
        // undefined; the renderer ignores the resolved value).
        "config:set" => {
            let key = args.first().and_then(Value::as_str).unwrap_or_default();
            let value = args.get(1).cloned().unwrap_or(Value::Null);

            state.config.set(key, value).map_err(to_error_value)
        },

        // workspace:restore(defaultConfig) -> saved workspace (files re-read from
        // disk), else the default.
        "workspace:restore" => {
            let default = args.first().cloned().unwrap_or_else(|| json!({}));

            Ok(workspace::restore(&state.config, default))
        },

        // workspace:save(workspace) -> null
        "workspace:save" => {
            let ws = args.first().cloned().unwrap_or_else(|| json!({}));

            workspace::save(&state.config, ws).map_err(to_error_value)
        },

        // The renderer sends client:ready after restoring the workspace and then
        // waits for the client:started push to open restored/CLI files.
        "client:ready" => {
            let _ = window.emit("client:started", Vec::<Value>::new());

            Ok(Value::Null)
        },

        // file context: drive the watcher/indexer; pushes happen out-of-band via
        // the `file-context:changed` event the FileContext emits (ports the
        // `file-context:*` handlers in index.js). All return null (done(null)).
        "file-context:add-root" => {
            file_context(window).add_root(&file_path_field(&arg0(args)));

            Ok(Value::Null)
        },
        "file-context:remove-root" => {
            file_context(window).remove_root(&file_path_field(&arg0(args)));

            Ok(Value::Null)
        },
        "file-context:file-opened" => {
            let file_path = args.first().and_then(Value::as_str).unwrap_or_default();

            file_context(window).file_opened(file_path, processor_option(args.get(1)));

            Ok(Value::Null)
        },
        "file-context:file-updated" => {
            let file_path = args.first().and_then(Value::as_str).unwrap_or_default();

            file_context(window).file_updated(file_path, processor_option(args.get(1)));

            Ok(Value::Null)
        },
        "file-context:file-closed" => {
            let file_path = args.first().and_then(Value::as_str).unwrap_or_default();

            file_context(window).file_closed(file_path);

            Ok(Value::Null)
        },

        // dialogs / shell / clipboard (Tauri-layer, port of dialog.js + the
        // shell handlers in index.js).
        "dialog:open-files" => Ok(crate::dialog::open_files(window, &arg0(args))),
        "dialog:save-file" => Ok(crate::dialog::save_file(window, &arg0(args))),
        "dialog:show" => Ok(crate::dialog::show(window, &arg0(args))),
        "dialog:open-file-error" => Ok(crate::dialog::open_file_error(window, &arg0(args))),
        "dialog:open-file-explorer" => Ok(crate::dialog::open_file_explorer(window, &arg0(args))),
        "external:open-url" => Ok(crate::dialog::open_url(window, &arg0(args))),
        "system-clipboard:write-text" => Ok(crate::dialog::write_clipboard_text(window, &arg0(args))),

        // Native application menu (port of app/lib/menu). register/update mutate
        // the managed menu model and reinstall the menu; the menu's Quit and the
        // window close button defer to the renderer, which replies app:quit-allowed.
        "menu:register" => {
            let provider_id = args.first().and_then(Value::as_str).unwrap_or_default();
            crate::menu::register(window.app_handle(), provider_id, &arg0(&args[1..]));

            Ok(Value::Null)
        },
        "menu:update" => {
            crate::menu::update(window.app_handle(), args.first().cloned().unwrap_or(Value::Null));

            Ok(Value::Null)
        },
        "app:quit-allowed" => {
            window.app_handle().exit(0);

            Ok(Value::Null)
        },

        // Fire-and-forget / not-yet-meaningful boot calls: accept as no-ops so
        // the renderer's promises resolve instead of rejecting during startup.
        "client:error"
        | "client:templates-update"
        | "errorTracking:turnedOn"
        | "errorTracking:turnedOff"
        | "context-menu:open"
        | "toggle-plugins"
        | "app:reload"
        | "app:restart"
        | "app:quit-aborted" => Ok(Value::Null),

        // Pure, stateless events (file-system, ...) and the
        // disallowed/not-implemented fallbacks.
        other => modeler_backend::dispatch(other, args)
            .map_err(|err| serde_json::to_value(err).unwrap_or(Value::Null)),
    }
}
