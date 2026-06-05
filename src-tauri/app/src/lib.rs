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

pub mod ipc;

use serde_json::{json, Value};
use tauri::{WebviewUrl, WebviewWindow, WebviewWindowBuilder};

use crate::ipc::AppState;

/// Route a contract event through the IPC handler, returning the parity-shaped
/// error object on failure (so the renderer sees the same `{ message, code, ...}`
/// it got from Electron).
#[tauri::command]
async fn ipc_dispatch(
    window: WebviewWindow,
    event: String,
    args: Vec<Value>,
) -> Result<Value, Value> {
    ipc::handle(&window, &event, &args)
}

/// Node `process.platform` equivalent, which the renderer reads via
/// `backend.getPlatform()`.
fn node_platform() -> &'static str {
    match std::env::consts::OS {
        "macos" => "darwin",
        "windows" => "win32",
        other => other,
    }
}

/// Boot constants the Electron preload exposed synchronously
/// (`window.getAppPreload()` reads these without IPC).
pub fn boot_script(version: &str, name: &str) -> String {
    let boot = json!({
        "metadata": {
            "version": version,
            "name": name,
        },
        "plugins": [],
        "flags": {},
        "platform": node_platform(),
    });

    format!("window.__MODELER_BOOT__ = {boot};")
}

pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![ipc_dispatch])
        .setup(|app| {
            let handle = app.handle();
            let package = handle.package_info();
            let boot = boot_script(&package.version.to_string(), &package.name);

            WebviewWindowBuilder::new(handle, "main", WebviewUrl::default())
                .title("Camunda Modeler")
                .inner_size(1280.0, 800.0)
                .initialization_script(&boot)
                .initialization_script(include_str!("../../preload-shim.js"))
                .build()?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running the Camunda Modeler Tauri application");
}
