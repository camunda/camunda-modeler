// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! Faithful Rust port of `app/lib/file-system.js`.
//!
//! The renderer is unchanged by the migration, so these functions must produce
//! the SAME `FileDescriptor` shape (and the same `createFile` quirks) as the
//! Electron backend. Behavior is locked by the parity oracles on the parent
//! branch (`app/test/e2e/shared/lifecycle-suite.js`).

use std::fs;
use std::path::Path;
use std::time::UNIX_EPOCH;

use base64::Engine;
use base64::engine::general_purpose::STANDARD as BASE64;
use serde_json::{json, Map, Value};

use crate::error::IpcError;

/// Tag used to carry binary contents across the JSON IPC boundary so the JS
/// shim can revive a real `Uint8Array` (Electron delivers a `Uint8Array`; plain
/// JSON would deliver a `number[]`, which corrupts binary deploy/import flows).
pub const UINT8_TYPE: &str = "Uint8Array";

/// The only properties `createFile` carries over from an input file
/// (`FILE_PROPERTIES` in file-system.js). Note this deliberately omits
/// `dirname`/`extname`/`uri`, which is why those are dropped from the
/// `writeFile`/`readFileStats` return values.
const FILE_PROPERTIES: [&str; 5] = ["contents", "lastModified", "name", "path", "messages"];

/// Read a file, returning a `FileDescriptor`.
///
/// `options.encoding`: absent/null -> utf8 string; `false` -> tagged
/// `Uint8Array`; `"base64"` -> base64 string. Mirrors `readFile`.
pub fn read_file(file_path: &str, options: &Value) -> Result<Value, IpcError> {
    let encoding = encoding_of(options);

    let contents = match encoding {
        Encoding::Binary => {
            let bytes = fs::read(file_path).map_err(|e| IpcError::from_io(&e, "open", file_path))?;
            tagged_bytes(&bytes)
        },
        Encoding::Base64 => {
            let bytes = fs::read(file_path).map_err(|e| IpcError::from_io(&e, "open", file_path))?;
            Value::String(BASE64.encode(bytes))
        },
        Encoding::Utf8 => {
            let text = fs::read_to_string(file_path)
                .map_err(|e| IpcError::from_io(&e, "open", file_path))?;
            Value::String(text)
        },
    };

    Ok(create_file(
        &json!({}),
        &json!({
            "path": file_path,
            "contents": contents,
            "lastModified": last_modified_ticks(file_path),
        }),
    ))
}

/// Refresh `lastModified` for an existing file descriptor. Mirrors
/// `readFileStats` (does not recompute path-derived fields).
pub fn read_file_stats(file: &Value) -> Result<Value, IpcError> {
    let last_modified = match file.get("path").and_then(Value::as_str) {
        Some(path) => last_modified_ticks(path),
        None => 0,
    };

    Ok(create_file(file, &json!({ "lastModified": last_modified })))
}

/// Write a file and return the refreshed descriptor. Mirrors `writeFile`,
/// including the double `createFile` that drops `dirname`/`extname`/`uri` from
/// the returned descriptor.
pub fn write_file(file_path: &str, file: &Value, options: &Value) -> Result<Value, IpcError> {
    let contents = file.get("contents").cloned().unwrap_or(Value::Null);

    let encoding = options
        .get("encoding")
        .and_then(Value::as_str)
        .unwrap_or("utf8");

    let file_type = options.get("fileType").and_then(Value::as_str);

    let bytes = encode_contents(&contents, encoding)?;

    // `fileType` ensures an extension before the path-derived fields are built.
    let file_path = match file_type {
        Some(ft) => ensure_extension(file_path, ft),
        None => file_path.to_string(),
    };

    // file = createFile(file, { path: filePath })
    let file = create_file(file, &json!({ "path": file_path }));

    fs::write(&file_path, &bytes).map_err(|e| IpcError::from_io(&e, "open", &file_path))?;

    Ok(create_file(
        &file,
        &json!({ "lastModified": last_modified_ticks(&file_path) }),
    ))
}

// helpers //////////

/// Faithful port of `createFile(oldFile, newFile)`: pick known properties from
/// both, derive `name`/`dirname`/`extname`/`uri` when the new file has a path,
/// default `messages`, then `Object.assign({}, oldFile, newFile)`.
/// Faithful port of `createFile`: keeps only `FILE_PROPERTIES`, and when a
/// `path` is present derives `name`/`dirname`/`extname`/`uri`. Exposed so the
/// indexer can build the same `FileDescriptor` shape for synthetic (empty /
/// read-error) files.
pub fn create_file(old_file: &Value, new_file: &Value) -> Value {
    let old_picked = pick(old_file);
    let mut new_picked = pick(new_file);

    if let Some(path) = new_picked.get("path").and_then(Value::as_str).map(str::to_string) {
        new_picked.insert("name".into(), json!(basename(&path)));
        new_picked.insert("dirname".into(), json!(dirname(&path)));
        new_picked.insert("extname".into(), json!(extname(&path)));
        new_picked.insert("uri".into(), json!(file_uri(&path)));
    }

    new_picked.entry("messages").or_insert_with(|| json!([]));

    let mut merged = old_picked;
    for (key, value) in new_picked {
        merged.insert(key, value);
    }

    Value::Object(merged)
}

fn pick(value: &Value) -> Map<String, Value> {
    let mut out = Map::new();

    if let Some(obj) = value.as_object() {
        for key in FILE_PROPERTIES {
            if let Some(val) = obj.get(key) {
                out.insert(key.to_string(), val.clone());
            }
        }
    }

    out
}

enum Encoding {
    Utf8,
    Base64,
    Binary,
}

/// Mirror `if (!encoding && encoding !== false) encoding = 'utf8'`.
fn encoding_of(options: &Value) -> Encoding {
    match options.get("encoding") {
        Some(Value::Bool(false)) => Encoding::Binary,
        Some(Value::String(s)) if s == "base64" => Encoding::Base64,
        _ => Encoding::Utf8,
    }
}

/// Decode the descriptor contents into the raw bytes to persist.
fn encode_contents(contents: &Value, encoding: &str) -> Result<Vec<u8>, IpcError> {
    // Binary contents (Electron Uint8Array / our tagged form) are written as-is,
    // mirroring `fs.writeFileSync(path, buffer)` ignoring the encoding.
    if let Some(bytes) = decode_tagged_bytes(contents) {
        return Ok(bytes);
    }

    let text = contents.as_str().unwrap_or("");

    if encoding == "base64" {
        let stripped = strip_data_url(text);

        return BASE64
            .decode(stripped)
            .map_err(|e| IpcError::new("ERR_INVALID_BASE64", e.to_string()));
    }

    Ok(text.as_bytes().to_vec())
}

fn tagged_bytes(bytes: &[u8]) -> Value {
    json!({ "__type": UINT8_TYPE, "data": BASE64.encode(bytes) })
}

fn decode_tagged_bytes(value: &Value) -> Option<Vec<u8>> {
    let obj = value.as_object()?;

    if obj.get("__type").and_then(Value::as_str) != Some(UINT8_TYPE) {
        return None;
    }

    let data = obj.get("data").and_then(Value::as_str)?;

    BASE64.decode(data).ok()
}

/// Mirror `getBase64Contents`: strip a leading `data:image/(jpeg|png);base64,`.
fn strip_data_url(contents: &str) -> &str {
    for prefix in ["data:image/jpeg;base64,", "data:image/png;base64,"] {
        if let Some(rest) = contents.strip_prefix(prefix) {
            return rest;
        }
    }

    contents
}

/// Mirror `ensureExtension`: append `.{ext}` only when there is no extension.
fn ensure_extension(file_path: &str, default_extension: &str) -> String {
    if extname(file_path).is_empty() {
        format!("{file_path}.{default_extension}")
    } else {
        file_path.to_string()
    }
}

/// Last modified time in epoch milliseconds, or 0 on error (mirrors
/// `getLastModifiedTicks`).
fn last_modified_ticks(file_path: &str) -> i64 {
    let result = fs::metadata(file_path)
        .and_then(|meta| meta.modified())
        .ok()
        .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
        .map(|dur| dur.as_millis() as i64);

    result.unwrap_or(0)
}

fn basename(file_path: &str) -> String {
    Path::new(file_path)
        .file_name()
        .map(|name| name.to_string_lossy().to_string())
        .unwrap_or_default()
}

fn dirname(file_path: &str) -> String {
    Path::new(file_path)
        .parent()
        .map(|parent| parent.to_string_lossy().to_string())
        .unwrap_or_else(|| ".".to_string())
}

/// Node `path.extname`: the extension including the leading dot, or `""`.
fn extname(file_path: &str) -> String {
    Path::new(file_path)
        .extension()
        .map(|ext| format!(".{}", ext.to_string_lossy()))
        .unwrap_or_default()
}

fn file_uri(file_path: &str) -> String {
    url::Url::from_file_path(file_path)
        .map(|url| url.to_string())
        .unwrap_or_default()
}
