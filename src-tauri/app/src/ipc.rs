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
//! are reached via the fallback at the bottom. Events that need process state
//! (config, workspace) or a webview effect (`client:ready` -> emit
//! `client:started`) are handled here, where we hold [`AppState`] and the
//! window. Boot-path shapes were taken from the renderer startup map
//! (`client/src/app/AppParent.js`, `client/src/app/RecentTabs.js`).

use std::sync::Mutex;

use serde_json::{json, Value};
use tauri::{Emitter, Manager, WebviewWindow};

/// In-process backend state. A persisted store replaces this in a later phase;
/// in-memory is enough to boot the renderer to its ready state.
#[derive(Default)]
pub struct AppState {
    config: Mutex<serde_json::Map<String, Value>>,
    workspace: Mutex<Option<Value>>,
}

/// Route a contract event, handling the stateful/effectful ones here and
/// delegating everything else to the pure backend.
pub fn handle(window: &WebviewWindow, event: &str, args: &[Value]) -> Result<Value, Value> {
    let state = window.state::<AppState>();

    match event {

        // config:get(key, default?) -> stored value, else default, else null
        "config:get" => {
            let key = args.first().and_then(Value::as_str).unwrap_or_default();
            let mut config = state.config.lock().unwrap();

            // editor.id mirrors the Electron UUIDProvider: a v4 UUID generated
            // and cached on first read (the renderer's stats/error-tracking
            // plugins reject boot if it is missing).
            if key == "editor.id" {
                let id = config
                    .entry(key.to_string())
                    .or_insert_with(|| Value::String(uuid::Uuid::new_v4().to_string()));

                return Ok(id.clone());
            }

            let value = config
                .get(key)
                .cloned()
                .or_else(|| args.get(1).cloned())
                .unwrap_or(Value::Null);

            Ok(value)
        },

        // config:set(key, value) -> value
        "config:set" => {
            let key = args.first().and_then(Value::as_str).unwrap_or_default().to_string();
            let value = args.get(1).cloned().unwrap_or(Value::Null);

            state.config.lock().unwrap().insert(key, value.clone());

            Ok(value)
        },

        // workspace:restore(defaultConfig) -> saved workspace, else the default
        "workspace:restore" => {
            let default = args.first().cloned().unwrap_or_else(|| json!({}));
            let workspace = state.workspace.lock().unwrap();

            Ok(workspace.clone().unwrap_or(default))
        },

        // workspace:save(config) -> config
        "workspace:save" => {
            let config = args.first().cloned().unwrap_or_else(|| json!({}));

            *state.workspace.lock().unwrap() = Some(config.clone());

            Ok(config)
        },

        // The renderer sends client:ready after restoring the workspace and then
        // waits for the client:started push to open restored/CLI files.
        "client:ready" => {
            let _ = window.emit("client:started", Vec::<Value>::new());

            Ok(Value::Null)
        },

        // Fire-and-forget / not-yet-meaningful boot calls: accept as no-ops so
        // the renderer's promises resolve instead of rejecting during startup.
        "menu:register"
        | "menu:update"
        | "client:error"
        | "client:templates-update"
        | "errorTracking:turnedOn"
        | "errorTracking:turnedOff"
        | "external:open-url"
        | "system-clipboard:write-text"
        | "context-menu:open"
        | "toggle-plugins"
        | "app:reload"
        | "app:restart"
        | "app:quit-allowed"
        | "app:quit-aborted" => Ok(Value::Null),

        // Pure, stateless events (file-system, ...) and the
        // disallowed/not-implemented fallbacks.
        other => modeler_backend::dispatch(other, args)
            .map_err(|err| serde_json::to_value(err).unwrap_or(Value::Null)),
    }
}
