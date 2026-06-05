// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! Error shape that mirrors what the Electron backend delivers to the renderer.
//!
//! `app/lib/util/renderer.js` maps a thrown/rejected `Error` to a plain,
//! enumerable object carrying at least `message` and `code`, plus the
//! underlying Node `fs` error's own enumerable props (`errno`, `syscall`,
//! `path`). The serialization parity oracle asserts that surface, so a Tauri
//! backend has to reproduce it rather than emit idiomatic Rust errors.

use std::io;

use serde::Serialize;

/// Parity-shaped IPC error. Serializes to the same JSON the renderer expects
/// from the Electron backend.
#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct IpcError {
    pub message: String,
    pub code: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub errno: Option<i32>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub syscall: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
}

impl IpcError {
    /// A non-filesystem error (e.g. disallowed/unimplemented event), shaped like
    /// the Electron `{ message, code }` object.
    pub fn new(code: &str, message: impl Into<String>) -> Self {
        IpcError {
            message: message.into(),
            code: code.into(),
            errno: None,
            syscall: None,
            path: None,
        }
    }

    /// Build a Node-`fs`-like error from a Rust IO error for the given syscall
    /// and path, matching the enumerable props the renderer relies on.
    pub fn from_io(err: &io::Error, syscall: &str, path: &str) -> Self {
        let (code, errno) = node_code(err);

        IpcError {
            // Mirrors Node's "ENOENT: no such file or directory, open '/p'".
            message: format!("{code}: {}, {syscall} '{path}'", describe(&code)),
            code,
            errno: Some(errno),
            syscall: Some(syscall.to_string()),
            path: Some(path.to_string()),
        }
    }
}

/// Map a Rust IO error to the Node `code`/`errno` pair the renderer may branch
/// on (e.g. `err.code === 'ENOENT'`).
fn node_code(err: &io::Error) -> (String, i32) {
    use io::ErrorKind::*;

    match err.kind() {
        NotFound => ("ENOENT".into(), -2),
        PermissionDenied => ("EACCES".into(), -13),
        AlreadyExists => ("EEXIST".into(), -17),
        _ => {
            // Surface the raw OS errno when available, otherwise a generic code.
            if let Some(raw) = err.raw_os_error() {
                ("EUNKNOWN".into(), raw)
            } else {
                ("EUNKNOWN".into(), -1)
            }
        }
    }
}

fn describe(code: &str) -> &'static str {
    match code {
        "ENOENT" => "no such file or directory",
        "EACCES" => "permission denied",
        "EEXIST" => "file already exists",
        _ => "i/o error",
    }
}
