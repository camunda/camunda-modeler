// Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
// under one or more contributor license agreements. See the NOTICE file
// distributed with this work for additional information regarding copyright
// ownership.
//
// Camunda licenses this file to you under the MIT; you may not use this file
// except in compliance with the MIT License.

//! Parity tests for the persistent config providers. These mirror
//! `app/lib/config/__tests__/config-spec.js` and the provider semantics in
//! `app/lib/config/providers/*` (DefaultProvider, SettingsProvider,
//! UUIDProvider) so the Rust port behaves identically.

use std::fs;
use std::path::PathBuf;

use serde_json::{json, Value};

use modeler_backend::config::Config;

fn temp_dir(tag: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();

    let dir = std::env::temp_dir().join(format!("cm-config-{tag}-{nanos}"));

    fs::create_dir_all(&dir).unwrap();

    dir
}

fn get(config: &Config, key: &str) -> Value {
    config.get(key, &[]).unwrap()
}

fn get_default(config: &Config, key: &str, default: Value) -> Value {
    config.get(key, &[default]).unwrap()
}

// -- DefaultProvider (config.json) ------------------------------------------

#[test]
fn default_provider_gets_a_stored_value() {
    let dir = temp_dir("get");
    fs::write(dir.join("config.json"), r#"{ "foo": 42 }"#).unwrap();

    let config = Config::new(&dir);

    assert_eq!(get(&config, "foo"), json!(42));
}

#[test]
fn default_provider_returns_null_for_a_missing_key() {
    let dir = temp_dir("get-null");
    fs::write(dir.join("config.json"), r#"{ "foo": 42 }"#).unwrap();

    let config = Config::new(&dir);

    assert_eq!(get(&config, "bar"), Value::Null);
}

#[test]
fn default_provider_returns_the_default_for_a_missing_key() {
    let dir = temp_dir("get-default");
    fs::write(dir.join("config.json"), r#"{ "foo": 42 }"#).unwrap();

    let config = Config::new(&dir);

    assert_eq!(get_default(&config, "bar", json!(42)), json!(42));
}

#[test]
fn default_provider_does_not_throw_when_config_is_missing() {
    let dir = temp_dir("get-missing-file");

    let config = Config::new(&dir);

    // no config.json on disk -> behaves like an empty document
    assert_eq!(get(&config, "anything"), Value::Null);
    assert_eq!(get_default(&config, "anything", json!("fallback")), json!("fallback"));
}

#[test]
fn default_provider_does_not_throw_when_config_is_broken() {
    let dir = temp_dir("get-broken-file");
    fs::write(dir.join("config.json"), "{ this is not json").unwrap();

    let config = Config::new(&dir);

    assert_eq!(get(&config, "editor.privacyPreferences"), Value::Null);
}

#[test]
fn default_provider_sets_and_persists() {
    let dir = temp_dir("set");

    let config = Config::new(&dir);
    config.set("foo", json!(false)).unwrap();

    // visible through a fresh instance reading from disk
    let reread = Config::new(&dir);
    assert_eq!(get(&reread, "foo"), json!(false));
}

#[test]
fn default_provider_writes_pretty_two_space_json() {
    let dir = temp_dir("set-pretty");

    let config = Config::new(&dir);
    config.set("foo", json!({ "bar": true })).unwrap();

    let on_disk = fs::read_to_string(dir.join("config.json")).unwrap();

    assert_eq!(on_disk, "{\n  \"foo\": {\n    \"bar\": true\n  }\n}");
}

#[test]
fn default_provider_updates_cache_on_set() {
    let dir = temp_dir("set-cache");

    let config = Config::new(&dir);
    config.set("bar", json!("baz")).unwrap();

    // same instance must observe the value without re-reading disk
    assert_eq!(get(&config, "bar"), json!("baz"));
}

// -- SettingsProvider (settings.json) ---------------------------------------

#[test]
fn settings_provider_returns_the_whole_document() {
    let dir = temp_dir("settings-get");
    fs::write(dir.join("settings.json"), r#"{ "a": 1, "b": 2 }"#).unwrap();

    let config = Config::new(&dir);

    assert_eq!(get(&config, "settings"), json!({ "a": 1, "b": 2 }));
}

#[test]
fn settings_provider_shallow_merges_on_set() {
    let dir = temp_dir("settings-set");
    fs::write(dir.join("settings.json"), r#"{ "a": 1, "keep": true }"#).unwrap();

    let config = Config::new(&dir);

    // a get first loads the file into cache; the merge keeps untouched keys
    let _ = get(&config, "settings");
    config.set("settings", json!({ "a": 2, "c": 3 })).unwrap();

    let reread = Config::new(&dir);
    assert_eq!(
        get(&reread, "settings"),
        json!({ "a": 2, "keep": true, "c": 3 })
    );
}

#[test]
fn settings_provider_set_before_get_starts_from_empty() {
    let dir = temp_dir("settings-set-first");
    fs::write(dir.join("settings.json"), r#"{ "fromDisk": true }"#).unwrap();

    let config = Config::new(&dir);

    // set before any get must NOT read the file first ({ ...null, ...values })
    config.set("settings", json!({ "added": 1 })).unwrap();

    let on_disk: Value =
        serde_json::from_str(&fs::read_to_string(dir.join("settings.json")).unwrap()).unwrap();

    assert_eq!(on_disk, json!({ "added": 1 }));
}

// -- UUIDProvider (.editorid) -----------------------------------------------

#[test]
fn editor_id_generates_persists_and_is_stable() {
    let dir = temp_dir("editor-id");

    let config = Config::new(&dir);
    let first = get(&config, "editor.id");
    let id = first.as_str().unwrap().to_string();

    // valid v4 UUID shape
    assert_eq!(id.len(), 36);
    assert_eq!(id.as_bytes()[14], b'4');

    // stable within the instance
    assert_eq!(get(&config, "editor.id"), first);

    // persisted to .editorid and reused by a fresh instance
    assert_eq!(fs::read_to_string(dir.join(".editorid")).unwrap(), id);
    assert_eq!(get(&Config::new(&dir), "editor.id"), first);
}

#[test]
fn editor_id_reuses_a_valid_existing_id() {
    let dir = temp_dir("editor-id-existing");
    fs::write(dir.join(".editorid"), "51e50852-53b3-462a-801b-40e98d7c32fd").unwrap();

    let config = Config::new(&dir);

    assert_eq!(
        get(&config, "editor.id"),
        json!("51e50852-53b3-462a-801b-40e98d7c32fd")
    );
}

#[test]
fn editor_id_regenerates_an_invalid_existing_id() {
    let dir = temp_dir("editor-id-invalid");
    fs::write(dir.join(".editorid"), "not-a-uuid").unwrap();

    let config = Config::new(&dir);
    let id = get(&config, "editor.id");

    assert_ne!(id, json!("not-a-uuid"));
    assert_eq!(id.as_str().unwrap().len(), 36);
}

#[test]
fn editor_id_cannot_be_set() {
    let dir = temp_dir("editor-id-set");

    let config = Config::new(&dir);
    let error = config.set("editor.id", json!("x")).unwrap_err();

    assert_eq!(error.message, "provider for <editor.id> cannot set");
}

// -- bpmn.elementTemplates ---------------------------------------------------

#[test]
fn element_templates_returns_persisted_templates() {
    let dir = temp_dir("templates");
    fs::write(
        dir.join("config.json"),
        r#"{ "elementTemplates": [ { "id": "com.foo.Bar" } ] }"#,
    )
    .unwrap();

    let config = Config::new(&dir);

    assert_eq!(
        get(&config, "bpmn.elementTemplates"),
        json!([ { "id": "com.foo.Bar" } ])
    );
}

#[test]
fn element_templates_defaults_to_empty_list() {
    let dir = temp_dir("templates-empty");

    let config = Config::new(&dir);

    assert_eq!(get(&config, "bpmn.elementTemplates"), json!([]));
}
