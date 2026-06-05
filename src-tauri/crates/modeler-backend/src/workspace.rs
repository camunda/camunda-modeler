// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! Workspace restore/save, a faithful port of `app/lib/workspace.js`.
//!
//! The workspace is stored under the `workspace` config key. On restore, each
//! saved file is re-read from disk so the renderer gets fresh contents;
//! unreadable files are skipped individually (NOT fatal), and a saved workspace
//! with zero readable files still returns the workspace object (with an empty
//! `files` list) rather than the default.

use serde_json::Value;

use crate::config::Config;
use crate::error::IpcError;
use crate::file_system;

/// `workspace:restore(defaultConfig)`: return the saved workspace with its files
/// re-read from disk, or `default` when nothing was saved.
pub fn restore(config: &Config, default: Value) -> Value {
    let workspace = config
        .get("workspace", &[Value::Null])
        .unwrap_or(Value::Null);

    let Value::Object(mut workspace) = workspace else {
        return default;
    };

    let saved_files = match workspace.get("files") {
        Some(Value::Array(files)) => files.clone(),
        _ => Vec::new(),
    };

    let mut files = Vec::new();

    for file in &saved_files {
        let Some(path) = file.get("path").and_then(Value::as_str) else {
            continue;
        };

        // skip unreadable files (deleted/moved since save), like the Electron
        // try/catch around readFile
        if let Ok(descriptor) = file_system::read_file(path, &Value::Null) {
            files.push(descriptor);
        }
    }

    workspace.insert("files".to_string(), Value::Array(files));

    Value::Object(workspace)
}

/// `workspace:save(workspace)`: persist the workspace, returning `Null`
/// (`done(null)`).
pub fn save(config: &Config, workspace: Value) -> Result<Value, IpcError> {
    config.set("workspace", workspace)?;

    Ok(Value::Null)
}
