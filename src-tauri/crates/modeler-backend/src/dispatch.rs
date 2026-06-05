// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! Event router mirroring `app/lib/util/renderer.js` dispatch.
//!
//! The renderer talks to the backend by contract event name
//! (`backend.send(event, ...args)`), so a single entry point routes by that
//! name into typed Rust functions. The allow-list is enforced here (not only in
//! the JS shim) because, under Tauri, a compromised renderer could call the
//! command directly.

use serde_json::Value;

use crate::error::IpcError;
use crate::file_system;

/// Events the renderer is allowed to send (from `allowedEvents` in
/// `app/lib/preload.js`). `file:get-path` is handled inside the preload and
/// never reaches the backend, so it is intentionally absent here.
pub const ALLOWED_EVENTS: &[&str] = &[
    "app:reload",
    "app:restart",
    "app:quit-aborted",
    "app:quit-allowed",
    "client:error",
    "client:ready",
    "client:templates-update",
    "config:get",
    "config:set",
    "context-menu:open",
    "dialog:open-file-error",
    "dialog:open-file-explorer",
    "dialog:open-files",
    "dialog:save-file",
    "dialog:show",
    "errorTracking:turnedOff",
    "errorTracking:turnedOn",
    "external:open-url",
    "file:read",
    "file:read-stats",
    "file:write",
    "file-context:add-root",
    "file-context:remove-root",
    "file-context:changed",
    "file-context:file-closed",
    "file-context:file-opened",
    "file-context:file-updated",
    "menu:register",
    "menu:update",
    "system-clipboard:write-text",
    "toggle-plugins",
    "workspace:restore",
    "workspace:save",
    "zeebe:checkConnection",
    "zeebe:deploy",
    "zeebe:getGatewayVersion",
    "zeebe:startInstance",
    "zeebe:searchProcessInstances",
    "zeebe:searchElementInstances",
    "zeebe:searchVariables",
    "zeebe:searchIncidents",
    "zeebe:searchJobs",
    "zeebe:searchMessageSubscriptions",
    "zeebe:searchUserTasks",
];

/// Route a contract event to its backend handler.
///
/// Returns the handler result as a `serde_json::Value` (ready to hand back over
/// IPC) or a parity-shaped [`IpcError`].
pub fn dispatch(event: &str, args: &[Value]) -> Result<Value, IpcError> {
    match event {
        "file:read" => {
            let path = require_str(args, 0, event)?;
            let options = args.get(1).cloned().unwrap_or(Value::Null);

            file_system::read_file(path, &options)
        },
        "file:read-stats" => {
            let file = args
                .first()
                .ok_or_else(|| missing_arg(event, 0))?;

            file_system::read_file_stats(file)
        },
        "file:write" => {
            let path = require_str(args, 0, event)?;
            let file = args.get(1).cloned().unwrap_or(Value::Null);
            let options = args.get(2).cloned().unwrap_or(Value::Null);

            file_system::write_file(path, &file, &options)
        },
        other if ALLOWED_EVENTS.contains(&other) => Err(IpcError::new(
            "ERR_NOT_IMPLEMENTED",
            format!("Event not yet implemented in the Tauri backend: {other}"),
        )),
        other => Err(IpcError::new(
            "ERR_DISALLOWED_EVENT",
            format!("Disallowed event: {other}"),
        )),
    }
}

fn require_str<'a>(args: &'a [Value], index: usize, event: &str) -> Result<&'a str, IpcError> {
    args.get(index)
        .ok_or_else(|| missing_arg(event, index))?
        .as_str()
        .ok_or_else(|| {
            IpcError::new(
                "ERR_INVALID_ARG",
                format!("Expected a string at arg {index} for event {event}"),
            )
        })
}

fn missing_arg(event: &str, index: usize) -> IpcError {
    IpcError::new(
        "ERR_INVALID_ARG",
        format!("Missing arg {index} for event {event}"),
    )
}
