// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! Thin Tauri shell around `modeler-backend`.
//!
//! Exposes a single `ipc_dispatch` command (mirroring the Electron renderer
//! protocol) and injects, before the unchanged renderer loads:
//!   1. boot constants (`window.__MODELER_BOOT__`) the preload exposed
//!      synchronously, and
//!   2. the preload-compat shim that reconstructs `window.getAppPreload()`.

pub mod dialog;
pub mod ipc;

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use serde_json::{json, Map, Value};
use tauri::{Emitter, Manager, Runtime, WebviewUrl, WebviewWindowBuilder};

use modeler_backend::{ChangedSink, FileContext};

use crate::ipc::AppState;

/// Route a contract event through the IPC handler, returning the parity-shaped
/// error object on failure (so the renderer sees the same `{ message, code, ...}`
/// it got from Electron).
#[tauri::command]
async fn ipc_dispatch(
    window: tauri::WebviewWindow,
    event: String,
    args: Vec<Value>,
) -> Result<Value, Value> {
    // Zeebe endpoints are network-bound and async; route them through the
    // async REST client. The handlers always resolve a `{ success, ... }`
    // object (the Electron handlers never reject), so this is always `Ok`.
    if event.starts_with("zeebe:") {
        return Ok(modeler_backend::zeebe::handle(&event, &args).await);
    }

    ipc::handle(&window, &event, &args)
}

/// Node `process.platform` equivalent, which the renderer reads via
/// `backend.getPlatform()`.
pub fn node_platform() -> &'static str {
    match std::env::consts::OS {
        "macos" => "darwin",
        "windows" => "win32",
        other => other,
    }
}

/// Resolve the user-data directory holding `config.json`, `settings.json`,
/// `.editorid` and `flags.json`, creating it if needed.
///
/// `PROBE_USER_PATH` overrides the OS app-config dir so headless probes/tests
/// run hermetically against a throwaway directory. Note: this is intentionally a
/// fresh directory rather than Electron's `userData` — Phase 2 starts clean and
/// does not migrate the Electron store.
pub fn resolve_user_path<R: Runtime>(app: &tauri::AppHandle<R>) -> std::io::Result<PathBuf> {
    let user_path = match std::env::var_os("PROBE_USER_PATH") {
        Some(path) => PathBuf::from(path),
        None => app
            .path()
            .app_config_dir()
            .map_err(|err| std::io::Error::other(err.to_string()))?,
    };

    fs::create_dir_all(&user_path)?;

    Ok(user_path)
}

/// Load feature flags merged from `flags.json` under the search paths, applying
/// CLI overrides last. For now only the user-data directory is searched (the
/// resources/CLI surface is wired in a later phase).
pub fn load_flags(user_path: &Path) -> Map<String, Value> {
    modeler_backend::flags::load(&[user_path], &Map::new())
}

/// Boot constants the Electron preload exposed synchronously
/// (`window.getAppPreload()` reads these without IPC).
pub fn boot_script(version: &str, name: &str, flags: &Value) -> String {
    let boot = json!({
        "metadata": {
            "version": version,
            "name": name,
        },
        "plugins": [],
        "flags": flags,
        "platform": node_platform(),
    });

    format!("window.__MODELER_BOOT__ = {boot};")
}

/// Build the main webview window: resolve the user-data dir, manage the
/// persisted [`AppState`], load flags, and inject the boot constants + shim.
fn setup_main_window<R: Runtime>(app: &tauri::App<R>) -> Result<(), Box<dyn std::error::Error>> {
    let handle = app.handle();

    let user_path = resolve_user_path(handle)?;
    let flags = load_flags(&user_path);

    app.manage(AppState::new(&user_path));

    // File context: watches roots and pushes the full item list to the renderer
    // via `file-context:changed`. The push is wrapped in a one-element array
    // because the preload shim treats a Tauri event payload as the array of
    // renderer-callback args (here a single `items` argument).
    let emit_handle = handle.clone();
    let changed: ChangedSink = std::sync::Arc::new(move |items| {
        let _ = emit_handle.emit("file-context:changed", vec![Value::Array(items)]);
    });
    app.manage(Mutex::new(FileContext::new(changed)));

    let package = handle.package_info();
    let boot = boot_script(
        &package.version.to_string(),
        &package.name,
        &Value::Object(flags),
    );

    WebviewWindowBuilder::new(handle, "main", WebviewUrl::default())
        .title("Camunda Modeler")
        .inner_size(1280.0, 800.0)
        .initialization_script(&boot)
        .initialization_script(include_str!("../../preload-shim.js"))
        .build()?;

    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![ipc_dispatch])
        .setup(|app| {
            setup_main_window(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running the Camunda Modeler Tauri application");
}
