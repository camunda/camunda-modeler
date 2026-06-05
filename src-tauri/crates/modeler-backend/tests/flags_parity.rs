// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! Parity tests for flag loading, mirroring `app/lib/__tests__/flags-spec.js`
//! and the `globJSON` merge semantics.

use std::fs;
use std::path::{Path, PathBuf};

use serde_json::{json, Map, Value};

use modeler_backend::flags;

fn temp_dir(tag: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();

    let dir = std::env::temp_dir().join(format!("cm-flags-{tag}-{nanos}"));

    fs::create_dir_all(&dir).unwrap();

    dir
}

fn write_flags(dir: &Path, contents: &str) {
    fs::write(dir.join("flags.json"), contents).unwrap();
}

fn overrides(value: Value) -> Map<String, Value> {
    value.as_object().unwrap().clone()
}

#[test]
fn merges_flags_across_paths_then_applies_overrides() {
    let one = temp_dir("one");
    let two = temp_dir("two");
    write_flags(&one, r#"{ "ONE": true }"#);
    write_flags(&two, r#"{ "TWO": true }"#);

    let result = flags::load(&[one, two], &overrides(json!({ "TWO": "overridden" })));

    assert_eq!(result, *json!({ "ONE": true, "TWO": "overridden" }).as_object().unwrap());
}

#[test]
fn later_paths_win_on_conflict() {
    let one = temp_dir("first");
    let two = temp_dir("second");
    write_flags(&one, r#"{ "FLAG": "from-one" }"#);
    write_flags(&two, r#"{ "FLAG": "from-two" }"#);

    let result = flags::load(&[one, two], &Map::new());

    assert_eq!(result.get("FLAG"), Some(&json!("from-two")));
}

#[test]
fn deep_merges_nested_objects_from_files() {
    let one = temp_dir("nested-one");
    let two = temp_dir("nested-two");
    write_flags(&one, r#"{ "group": { "a": 1, "b": 1 } }"#);
    write_flags(&two, r#"{ "group": { "b": 2, "c": 2 } }"#);

    let result = flags::load(&[one, two], &Map::new());

    assert_eq!(result.get("group"), Some(&json!({ "a": 1, "b": 2, "c": 2 })));
}

#[test]
fn overrides_are_a_shallow_top_level_overwrite() {
    let one = temp_dir("shallow");
    write_flags(&one, r#"{ "group": { "keep": true } }"#);

    // a deep merge would preserve `keep`; the shallow override must replace the
    // whole `group` object
    let result = flags::load(&[one], &overrides(json!({ "group": { "replaced": true } })));

    assert_eq!(result.get("group"), Some(&json!({ "replaced": true })));
}

#[test]
fn skips_missing_and_invalid_flag_files() {
    let present = temp_dir("present");
    let missing = temp_dir("missing-removed");
    let broken = temp_dir("broken");
    write_flags(&present, r#"{ "OK": true }"#);
    write_flags(&broken, "{ not json");
    // remove the "missing" dir's flags.json by simply not writing one
    let _ = fs::remove_file(missing.join("flags.json"));

    let result = flags::load(&[present, missing, broken], &Map::new());

    assert_eq!(result, *json!({ "OK": true }).as_object().unwrap());
}

#[test]
fn skips_the_proto_key_during_merge() {
    let one = temp_dir("proto");
    write_flags(&one, r#"{ "__proto__": { "polluted": true }, "SAFE": true }"#);

    let result = flags::load(&[one], &Map::new());

    assert_eq!(result.get("SAFE"), Some(&json!(true)));
    assert_eq!(result.get("__proto__"), None);
}

#[test]
fn get_returns_value_or_default() {
    let mut map = Map::new();
    map.insert("ONE".to_string(), json!(true));

    assert_eq!(flags::get(&map, "ONE", Value::Null), json!(true));
    assert_eq!(flags::get(&map, "MISSING", Value::Null), Value::Null);
    assert_eq!(flags::get(&map, "MISSING", json!(10000)), json!(10000));
}
