// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! Tauri real-renderer boot probe.
//!
//! Boots the UNCHANGED bpmn.io renderer (`app/public`, built via
//! `npm run client:build`) under the Tauri shell + preload shim and proves it
//! completes its boot handshake:
//!   1. the renderer mounts, reads its config, restores the workspace, then
//!      sends `client:ready` (so receiving it server-side means the app got that
//!      far), and
//!   2. the backend emits `client:started`, which the renderer must receive to
//!      leave its loading state — the probe registers its own listener and only
//!      declares success once that round-trip is observed.
//!
//! Any uncaught renderer error (`window.error` / `unhandledrejection`) or a
//! renderer-reported `client:error` fails the boot. Exit codes: 0 = booted;
//! 1 = renderer error; 2 = timed out (e.g. `client:started` never delivered).
//! The observed events / errors are written to `PROBE_OUT` for the mocha driver
//! (`app/test/e2e/boot/boot-tauri-spec.js`).

use std::fs;
use std::sync::Mutex;
use std::thread;
use std::time::Duration;

use serde_json::{json, Value};
use tauri::{Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder};

use camunda_modeler_tauri_lib::boot_script;
use camunda_modeler_tauri_lib::ipc::{self, AppState};

/// Records what the renderer did during boot so the driver can assert on it.
#[derive(Default)]
struct BootObserver {
    events: Mutex<Vec<String>>,
    errors: Mutex<Vec<String>>,
    started: Mutex<bool>,
}

fn write_report(window: &WebviewWindow, booted: bool) {
    let observer = window.state::<BootObserver>();

    let report = json!({
        "booted": booted,
        "events": *observer.events.lock().unwrap(),
        "errors": *observer.errors.lock().unwrap(),
    });

    if let Ok(out) = std::env::var("PROBE_OUT") {
        let _ = fs::write(out, serde_json::to_string_pretty(&report).unwrap());
    }
}

fn record_error(window: &WebviewWindow, message: String) {
    eprintln!("tauri boot probe: renderer error: {message}");

    window
        .state::<BootObserver>()
        .errors
        .lock()
        .unwrap()
        .push(message);
}

#[tauri::command]
async fn ipc_dispatch(
    window: WebviewWindow,
    event: String,
    args: Vec<Value>,
) -> Result<Value, Value> {
    window
        .state::<BootObserver>()
        .events
        .lock()
        .unwrap()
        .push(event.clone());

    // The renderer reports handled (boundary/app-level) failures via client:error
    // rather than throwing globally; treat them as boot failures.
    if event == "client:error" {
        let message = args
            .first()
            .and_then(Value::as_str)
            .unwrap_or("client:error")
            .to_string();

        record_error(&window, format!("client:error: {message}"));
    }

    ipc::handle(&window, &event, &args)
}

/// Called by the probe's renderer-side listener once `client:started` is
/// actually delivered back to the webview — the deterministic "the app left its
/// loading state" signal. Reaching this is what declares the boot a success.
#[tauri::command]
fn probe_started(window: WebviewWindow) {
    {
        let observer = window.state::<BootObserver>();
        *observer.started.lock().unwrap() = true;
        observer.events.lock().unwrap().push("client:started".to_string());
    }

    let window = window.clone();
    thread::spawn(move || {
        // brief grace so a crash triggered by handling client:started can still
        // surface as an error before we report success
        thread::sleep(Duration::from_millis(200));

        let booted = window.state::<BootObserver>().errors.lock().unwrap().is_empty();
        write_report(&window, booted);
        window.app_handle().exit(if booted { 0 } else { 1 });
    });
}

#[tauri::command]
fn probe_error(window: WebviewWindow, message: String) {
    record_error(&window, message);

    write_report(&window, false);
    window.app_handle().exit(1);
}

/// Injected before anything else: capture uncaught renderer errors (script
/// crashes, failed chunk loads, rejected boot promises) and confirm the
/// `client:started` round-trip. Polls for the Tauri global since it registers
/// around the same document-start tick.
const PROBE_HOOKS: &str = r#"
(function () {
  function invoke(name, payload) {
    try { window.__TAURI__.core.invoke(name, payload); } catch (e) {}
  }

  window.addEventListener('error', function (event) {
    var message = event && (event.message || (event.error && event.error.stack)) || 'unknown error';
    invoke('probe_error', { message: String(message) });
  });

  window.addEventListener('unhandledrejection', function (event) {
    var reason = event && event.reason;
    var message = (reason && (reason.stack || reason.message)) || String(reason);
    invoke('probe_error', { message: 'unhandledrejection: ' + String(message) });
  });

  function registerStarted() {
    if (!window.__TAURI__ || !window.__TAURI__.event) {
      return setTimeout(registerStarted, 20);
    }

    window.__TAURI__.event.listen('client:started', function () {
      invoke('probe_started', {});
    });
  }

  registerStarted();
})();
"#;

fn main() {
    // safety net: never hang a CI run. Reaching this means the boot handshake
    // never completed (e.g. client:started was not delivered).
    thread::spawn(|| {
        thread::sleep(Duration::from_secs(30));
        eprintln!("tauri boot probe: timed out before the client:started round-trip");
        std::process::exit(2);
    });

    let package_boot = |app: &tauri::AppHandle| {
        let package = app.package_info();
        boot_script(&package.version.to_string(), &package.name)
    };

    tauri::Builder::default()
        .manage(AppState::default())
        .manage(BootObserver::default())
        .invoke_handler(tauri::generate_handler![ipc_dispatch, probe_started, probe_error])
        .setup(move |app| {
            WebviewWindowBuilder::new(app.handle(), "main", WebviewUrl::default())
                .visible(false)
                .initialization_script(PROBE_HOOKS)
                .initialization_script(&package_boot(app.handle()))
                .initialization_script(include_str!("../../../preload-shim.js"))
                .build()?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running the boot probe");
}
