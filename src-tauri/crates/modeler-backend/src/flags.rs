// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! Feature flags, a faithful port of `app/lib/flags.js` + `globJSON`.
//!
//! Each search path contributes its `flags.json` (if present); the documents
//! are deep-merged in order (later paths win, like min-dash `merge`), then the
//! explicit overrides are applied as a SHALLOW top-level overwrite — matching
//! `Flags`'s `{ ...config, ...overrides }`.
//!
//! Flags are delivered to the renderer at boot via
//! `window.getAppPreload().flags`, not over an IPC event.

use std::fs;
use std::path::Path;

use serde_json::{Map, Value};

/// Load and merge `flags.json` across `search_paths`, then apply `overrides`.
pub fn load<P: AsRef<Path>>(search_paths: &[P], overrides: &Map<String, Value>) -> Map<String, Value> {
    let mut flags = Map::new();

    for search_path in search_paths {
        let file = search_path.as_ref().join("flags.json");

        // unreadable / invalid files are skipped (errors collected+ignored in
        // Electron); only plain objects contribute
        if let Ok(text) = fs::read_to_string(&file) {
            if let Ok(Value::Object(document)) = serde_json::from_str::<Value>(&text) {
                deep_merge(&mut flags, &document);
            }
        }
    }

    // overrides are a shallow top-level overwrite, NOT a deep merge
    for (key, value) in overrides {
        flags.insert(key.clone(), value.clone());
    }

    flags
}

/// Recursively merge `source` into `target` the way min-dash `merge` does:
/// nested plain objects merge, everything else (arrays, scalars) replaces, and
/// the `__proto__` key is skipped.
fn deep_merge(target: &mut Map<String, Value>, source: &Map<String, Value>) {
    for (key, value) in source {
        if key == "__proto__" {
            continue;
        }

        match (target.get_mut(key), value) {
            (Some(Value::Object(existing)), Value::Object(incoming)) => {
                deep_merge(existing, incoming);
            },
            _ => {
                target.insert(key.clone(), value.clone());
            },
        }
    }
}

/// `flags.get(key, default)`.
pub fn get(flags: &Map<String, Value>, key: &str, default: Value) -> Value {
    flags.get(key).cloned().unwrap_or(default)
}
