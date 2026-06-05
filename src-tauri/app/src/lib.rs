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

use serde_json::{json, Value};
use tauri::{WebviewUrl, WebviewWindowBuilder};

/// Route a contract event to the pure backend, returning the parity-shaped
/// error object on failure (so the renderer sees the same `{ message, code, ...}`
/// it got from Electron).
#[tauri::command]
async fn ipc_dispatch(event: String, args: Vec<Value>) -> Result<Value, Value> {
    modeler_backend::dispatch(&event, &args)
        .map_err(|err| serde_json::to_value(err).unwrap_or(Value::Null))
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

fn boot_script(app: &tauri::AppHandle) -> String {
    let package = app.package_info();

    let boot = json!({
        "metadata": {
            "version": package.version.to_string(),
            "name": package.name,
        },
        "plugins": [],
        "flags": {},
        "platform": node_platform(),
    });

    format!("window.__MODELER_BOOT__ = {boot};")
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![ipc_dispatch])
        .setup(|app| {
            let handle = app.handle();

            WebviewWindowBuilder::new(handle, "main", WebviewUrl::default())
                .title("Camunda Modeler")
                .inner_size(1280.0, 800.0)
                .initialization_script(&boot_script(handle))
                .initialization_script(include_str!("../../preload-shim.js"))
                .build()?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running the Camunda Modeler Tauri application");
}
