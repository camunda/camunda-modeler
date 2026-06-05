// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! Persistent configuration, a faithful port of `app/lib/config`.
//!
//! [`Config`] routes a key to a provider exactly like
//! `app/lib/config/index.js`:
//!   - `editor.id` -> a lazily generated v4 UUID persisted to `.editorid`
//!     ([`UuidProvider`], mirrors `UUIDProvider.js`),
//!   - `settings` -> the whole `settings.json` document, set by shallow merge
//!     ([`SettingsStore`], mirrors `SettingsProvider.js`),
//!   - `bpmn.elementTemplates` -> the persisted `elementTemplates` list (the
//!     on-disk template scan of `ElementTemplatesProvider.js` is deferred),
//!   - everything else -> `config.json` ([`JsonStore`], mirrors
//!     `DefaultProvider.js`).
//!
//! `os.info` is intentionally NOT handled here: it needs host APIs (Node
//! `os.platform()/os.release()`), so the Tauri layer computes it.
//!
//! Providers cache their parsed document on first read and then mutate + write
//! that cache, just like the Electron providers — so behavior (including the
//! read-once caching and write-on-set) matches for parity.

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use serde_json::{Map, Value};

use crate::error::IpcError;

/// Routes config keys to their providers, mirroring `Config` in
/// `app/lib/config/index.js`.
pub struct Config {
    default: JsonStore,
    settings: SettingsStore,
    editor_id: UuidProvider,
}

impl Config {
    /// Build a config rooted at `user_path` (the directory holding
    /// `config.json`, `settings.json` and `.editorid`). The directory is
    /// expected to exist; the Tauri layer creates it before constructing this.
    pub fn new(user_path: &Path) -> Self {
        Config {
            default: JsonStore::new(user_path.join("config.json")),
            settings: SettingsStore::new(user_path.join("settings.json")),
            editor_id: UuidProvider::new(user_path.join(".editorid")),
        }
    }

    /// Get a config value by key. `args` are the renderer's trailing arguments
    /// after the key (e.g. `args[0]` is the default value for the default
    /// provider), mirroring `config.get(key, ...args)`.
    pub fn get(&self, key: &str, args: &[Value]) -> Result<Value, IpcError> {
        let default = args.first().cloned().unwrap_or(Value::Null);

        match key {
            "editor.id" => Ok(Value::String(self.editor_id.get())),
            "settings" => Ok(self.settings.get_all()),

            // The on-disk `.camunda` template scan is deferred; persisted
            // templates (DefaultProvider.get('elementTemplates', [])) are still
            // returned so configured templates keep working.
            "bpmn.elementTemplates" => {
                Ok(self.default.get(Some("elementTemplates"), Value::Array(vec![])))
            },

            _ => Ok(self.default.get(Some(key), default)),
        }
    }

    /// Set a config value by key, returning `Null` (the providers return
    /// `undefined`). Mirrors `config.set(key, value)`; setting a key whose
    /// provider has no `set` errors like Electron.
    pub fn set(&self, key: &str, value: Value) -> Result<Value, IpcError> {
        match key {
            "settings" => {
                self.settings.merge_set(&value)?;
                Ok(Value::Null)
            },

            "editor.id" | "os.info" | "bpmn.elementTemplates" => Err(IpcError::new(
                "ERR_CANNOT_SET",
                format!("provider for <{key}> cannot set"),
            )),

            _ => {
                self.default.set(key, value)?;
                Ok(Value::Null)
            },
        }
    }
}

/// `config.json` provider — a faithful port of `DefaultProvider.js`.
///
/// Reads and caches the document on first access, tolerating a missing or
/// unreadable file by caching `{}` (so it is not re-read), and writes the whole
/// document back on every `set`.
struct JsonStore {
    path: PathBuf,
    json: Mutex<Option<Map<String, Value>>>,
}

impl JsonStore {
    fn new(path: PathBuf) -> Self {
        JsonStore {
            path,
            json: Mutex::new(None),
        }
    }

    /// Lazily read + cache the document. Any error (missing file, bad JSON)
    /// caches an empty object, matching `DefaultProvider._readFile`.
    fn read_or_cache(&self) -> std::sync::MutexGuard<'_, Option<Map<String, Value>>> {
        let mut guard = self.json.lock().unwrap();

        if guard.is_none() {
            *guard = Some(read_json_object(&self.path));
        }

        guard
    }

    /// `get(key, default)`: `!key` -> whole document; nil value -> default.
    fn get(&self, key: Option<&str>, default: Value) -> Value {
        let guard = self.read_or_cache();
        let json = guard.as_ref().unwrap();

        let Some(key) = key else {
            return Value::Object(json.clone());
        };

        match json.get(key) {
            Some(Value::Null) | None => default,
            Some(value) => value.clone(),
        }
    }

    /// `set(key, value)`: mutate the cached document and write it back.
    fn set(&self, key: &str, value: Value) -> Result<(), IpcError> {
        let mut guard = self.read_or_cache();
        let json = guard.as_mut().unwrap();

        json.insert(key.to_string(), value);

        write_json_object(&self.path, json)
    }
}

/// `settings.json` provider — a faithful port of `SettingsProvider.js`.
///
/// `get()` ignores the key and returns the whole document (lazily read).
/// `set(_, values)` shallow-merges `values` over the cached document WITHOUT
/// reading the file first — so a `set` before any `get` starts from `{}`,
/// matching `{ ...this._json, ...values }`.
struct SettingsStore {
    store: JsonStore,
}

impl SettingsStore {
    fn new(path: PathBuf) -> Self {
        SettingsStore {
            store: JsonStore::new(path),
        }
    }

    fn get_all(&self) -> Value {
        self.store.get(None, Value::Null)
    }

    fn merge_set(&self, values: &Value) -> Result<(), IpcError> {
        let Value::Object(values) = values else {

            // non-object `values` spread to nothing in JS ({ ...null/scalar });
            // still rewrites the (possibly empty) cached document.
            let mut guard = self.store.json.lock().unwrap();
            let json = guard.get_or_insert_with(Map::new);
            return write_json_object(&self.store.path, json);
        };

        let mut guard = self.store.json.lock().unwrap();
        let json = guard.get_or_insert_with(Map::new);

        for (key, value) in values {
            json.insert(key.clone(), value.clone());
        }

        write_json_object(&self.store.path, json)
    }
}

/// `.editorid` provider — a faithful port of `UUIDProvider.js`.
///
/// Lazily returns a cached client id: an existing valid UUID from the file, or
/// a freshly generated v4 UUID that is persisted (write failures are tolerated
/// — the generated id is still cached and returned).
struct UuidProvider {
    path: PathBuf,
    cached: Mutex<Option<String>>,
}

impl UuidProvider {
    fn new(path: PathBuf) -> Self {
        UuidProvider {
            path,
            cached: Mutex::new(None),
        }
    }

    fn get(&self) -> String {
        let mut guard = self.cached.lock().unwrap();

        if let Some(uuid) = guard.as_ref() {
            return uuid.clone();
        }

        let uuid = match fs::read_to_string(&self.path) {
            Ok(contents) if is_valid_uuid(contents.trim()) => contents.trim().to_string(),
            _ => self.generate_and_store(),
        };

        *guard = Some(uuid.clone());
        uuid
    }

    fn generate_and_store(&self) -> String {
        let uuid = uuid::Uuid::new_v4().to_string();

        // tolerate write failures (read-only dir, etc.); the id is still used
        let _ = fs::write(&self.path, &uuid);

        uuid
    }
}

/// Validate a UUID the way `UUIDProvider.isValidUUID` does (v1-v5, RFC variant).
fn is_valid_uuid(value: &str) -> bool {
    let bytes = value.as_bytes();

    if bytes.len() != 36 {
        return false;
    }

    for (index, &byte) in bytes.iter().enumerate() {
        let valid = match index {
            8 | 13 | 18 | 23 => byte == b'-',
            14 => byte.is_ascii_digit() && (b'0'..=b'5').contains(&byte),
            19 => matches!(byte, b'0' | b'8' | b'9' | b'a' | b'b' | b'A' | b'B'),
            _ => byte.is_ascii_hexdigit(),
        };

        if !valid {
            return false;
        }
    }

    true
}

/// Read a JSON object from disk, returning `{}` on any error (missing file,
/// invalid JSON, non-object root) — mirrors `DefaultProvider._readFile`.
fn read_json_object(path: &Path) -> Map<String, Value> {
    fs::read_to_string(path)
        .ok()
        .and_then(|text| serde_json::from_str::<Value>(&text).ok())
        .and_then(|value| match value {
            Value::Object(map) => Some(map),
            _ => None,
        })
        .unwrap_or_default()
}

/// Write a JSON object to disk pretty-printed with 2-space indent, erroring
/// like `DefaultProvider._writeFile` (`cannot write file <path>`).
fn write_json_object(path: &Path, json: &Map<String, Value>) -> Result<(), IpcError> {
    let serialized =
        serde_json::to_string_pretty(json).unwrap_or_else(|_| "{}".to_string());

    fs::write(path, serialized).map_err(|_| {
        IpcError::new(
            "ERR_WRITE_FAILED",
            format!("cannot write file {}", path.display()),
        )
    })
}
