// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! Tauri lifecycle parity probe.
//!
//! A headless Tauri runtime that drives the SAME backend-agnostic journey
//! (`app/test/e2e/shared/lifecycle-journey.js`) the Electron lifecycle oracle
//! uses, but over real Tauri `invoke` + the preload shim + the Rust
//! `modeler-backend` dispatch. Observations are written to `PROBE_OUT` and the
//! mocha driver (`app/test/e2e/lifecycle/lifecycle-tauri-spec.js`) feeds them to
//! `defineLifecycleSuite` — the identical assertions that judge the Electron
//! backend, so parity is structurally enforced.
//!
//! Inputs (env): `PROBE_FIXTURE`, `PROBE_SAVE_PATH`, `PROBE_OUT`.

use std::fs;
use std::thread;
use std::time::Duration;

use serde_json::{json, Value};
use tauri::{WebviewUrl, WebviewWindowBuilder};

#[tauri::command]
async fn ipc_dispatch(event: String, args: Vec<Value>) -> Result<Value, Value> {
    modeler_backend::dispatch(&event, &args)
        .map_err(|err| serde_json::to_value(err).unwrap_or(Value::Null))
}

#[tauri::command]
fn probe_report(app: tauri::AppHandle, results: Value) {
    let out = std::env::var("PROBE_OUT").expect("PROBE_OUT must be set");

    fs::write(out, serde_json::to_string_pretty(&results).expect("serialize report"))
        .expect("write report");

    app.exit(0);
}

#[tauri::command]
fn probe_error(app: tauri::AppHandle, message: String) {
    eprintln!("tauri lifecycle probe: renderer error: {message}");

    app.exit(1);
}

/// Inject the fixture (and the journey's edit markers) the same way the Electron
/// main process pushes `probe:fixture`.
fn boot_script() -> String {
    let probe = json!({
        "fixturePath": std::env::var("PROBE_FIXTURE").unwrap_or_default(),
        "savePath": std::env::var("PROBE_SAVE_PATH").unwrap_or_default(),
        "markerFrom": "ORIGINAL",
        "markerTo": "EDITED",
    });

    let boot = json!({
        "metadata": {},
        "plugins": [],
        "flags": {},
        "platform": "test",
        "probe": probe,
    });

    format!("window.__MODELER_BOOT__ = {boot};")
}

fn main() {
    // safety net: never hang a CI run
    thread::spawn(|| {
        thread::sleep(Duration::from_secs(20));
        eprintln!("tauri lifecycle probe: timed out");
        std::process::exit(2);
    });

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![ipc_dispatch, probe_report, probe_error])
        .setup(|app| {
            WebviewWindowBuilder::new(app.handle(), "probe", WebviewUrl::App("probe.html".into()))
                .visible(false)
                .initialization_script(&boot_script())
                .initialization_script(include_str!("../../../preload-shim.js"))
                .initialization_script(include_str!(
                    "../../../../app/test/e2e/shared/lifecycle-journey.js"
                ))
                .initialization_script(include_str!("../../../lifecycle-probe-driver.js"))
                .build()?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running the lifecycle probe");
}
